#!/usr/bin/env node
/**
 * Servidor del aula para el modo Examen de PSJavaScript (sin dependencias).
 *
 * - Sirve la versión web (carpeta dist/, generada con `npm run export:web`).
 * - Reenvía los mensajes de la sala entre el maestro y los alumnos por
 *   WebSocket en /sala. No necesita Internet: basta con estar en la misma red.
 *
 * Uso:  npm run sala              (puerto 8787)
 *       npm run sala -- --puerto 9000 --dir ./dist
 */
'use strict';
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const args = process.argv.slice(2);
const arg = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
};
const PORT = Number(arg('puerto', process.env.PORT || 8787));
const DIR = path.resolve(arg('dir', path.join(__dirname, '..', 'dist')));
const MAX_PAYLOAD = 2 * 1024 * 1024;
const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

// ───────────────────────────── WebSocket mínimo (RFC 6455) ─────────────────────────────

class Conn {
  constructor(socket) {
    this.socket = socket;
    this.buf = Buffer.alloc(0);
    this.fragments = null;
    this.alive = true;
    this.closed = false;
    this.onmessage = null;
    this.onclose = null;
    socket.setNoDelay(true);
    socket.on('data', (chunk) => this.onData(chunk));
    socket.on('close', () => this.finish());
    socket.on('error', () => this.finish());
  }

  onData(chunk) {
    this.buf = this.buf.length ? Buffer.concat([this.buf, chunk]) : chunk;
    for (;;) {
      const b = this.buf;
      if (b.length < 2) return;
      const fin = (b[0] & 0x80) !== 0;
      const op = b[0] & 0x0f;
      const masked = (b[1] & 0x80) !== 0;
      let len = b[1] & 0x7f;
      let off = 2;
      if (len === 126) {
        if (b.length < 4) return;
        len = b.readUInt16BE(2);
        off = 4;
      } else if (len === 127) {
        if (b.length < 10) return;
        len = Number(b.readBigUInt64BE(2));
        off = 10;
      }
      if (len > MAX_PAYLOAD) return this.close(1009);
      const maskLen = masked ? 4 : 0;
      if (b.length < off + maskLen + len) return;
      let payload = b.subarray(off + maskLen, off + maskLen + len);
      if (masked) {
        const mask = b.subarray(off, off + 4);
        payload = Buffer.from(payload);
        for (let i = 0; i < payload.length; i++) payload[i] ^= mask[i & 3];
      }
      this.buf = b.subarray(off + maskLen + len);
      this.frame(fin, op, payload);
      if (this.closed) return;
    }
  }

  frame(fin, op, payload) {
    if (op === 0x8) return this.close(1000);
    if (op === 0x9) return this.write(0xa, payload);
    if (op === 0xa) {
      this.alive = true;
      return;
    }
    if (op === 0x1 || op === 0x2) this.fragments = [payload];
    else if (op === 0x0 && this.fragments) this.fragments.push(payload);
    else return;
    if (!fin) return;
    const text = Buffer.concat(this.fragments).toString('utf8');
    this.fragments = null;
    this.alive = true;
    if (this.onmessage) this.onmessage(text);
  }

  write(op, payload) {
    if (this.closed) return;
    const len = payload.length;
    let header;
    if (len < 126) header = Buffer.from([0x80 | op, len]);
    else if (len < 65536) {
      header = Buffer.alloc(4);
      header[0] = 0x80 | op;
      header[1] = 126;
      header.writeUInt16BE(len, 2);
    } else {
      header = Buffer.alloc(10);
      header[0] = 0x80 | op;
      header[1] = 127;
      header.writeBigUInt64BE(BigInt(len), 2);
    }
    this.socket.write(Buffer.concat([header, payload]));
  }

  send(obj) {
    this.write(0x1, Buffer.from(JSON.stringify(obj), 'utf8'));
  }

  ping() {
    this.write(0x9, Buffer.alloc(0));
  }

  close(code = 1000) {
    if (this.closed) return;
    const p = Buffer.alloc(2);
    p.writeUInt16BE(code, 0);
    try {
      this.write(0x8, p);
    } catch {
      /* ya cerrado */
    }
    this.socket.end();
    this.finish();
  }

  finish() {
    if (this.closed) return;
    this.closed = true;
    this.socket.destroy();
    if (this.onclose) this.onclose();
  }
}

// ───────────────────────────── salas ─────────────────────────────

/** Conexiones abiertas (para el latido). */
const conns = new Set();
/** código → { host: Conn, clients: Map<peer, Conn> } */
const rooms = new Map();
let peerSeq = 0;

function attach(conn) {
  let role = null;
  let room = null;
  let code = null;
  let peer = null;

  conn.onmessage = (text) => {
    let m;
    try {
      m = JSON.parse(text);
    } catch {
      return;
    }
    if (!m || typeof m !== 'object') return;
    if (!role) {
      const c = typeof m.code === 'string' ? m.code.toUpperCase().slice(0, 12) : '';
      if (m.t === 'host' && c) {
        const existing = rooms.get(c);
        if (existing && !existing.host.closed) return conn.send({ t: 'error', message: 'Ese código de sala ya está en uso.' });
        role = 'host';
        code = c;
        room = { host: conn, clients: new Map() };
        rooms.set(c, room);
        conn.send({ t: 'hosted' });
        log(`Sala ${c} abierta`);
      } else if (m.t === 'join' && c) {
        const r = rooms.get(c);
        if (!r || r.host.closed) return conn.send({ t: 'error', message: 'No existe una sala abierta con ese código en este servidor.' });
        role = 'client';
        code = c;
        room = r;
        peer = `c${++peerSeq}`;
        r.clients.set(peer, conn);
        conn.send({ t: 'joined', peer });
        r.host.send({ t: 'join', peer });
      }
      return;
    }
    if (m.t !== 'msg') return;
    if (role === 'host') {
      const target = room.clients.get(m.to);
      if (target) target.send({ t: 'msg', data: m.data });
    } else if (role === 'client') {
      room.host.send({ t: 'msg', from: peer, data: m.data });
    }
  };

  conn.onclose = () => {
    if (role === 'host' && rooms.get(code) === room) {
      rooms.delete(code);
      for (const c of room.clients.values()) {
        c.send({ t: 'host-left' });
        c.close();
      }
      log(`Sala ${code} cerrada`);
    } else if (role === 'client' && room) {
      room.clients.delete(peer);
      if (!room.host.closed) room.host.send({ t: 'leave', peer });
    }
  };
}

// ───────────────────────────── HTTP (archivos de la versión web) ─────────────────────────────

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
};

const INJECT = "<script>window.__PSJS_SALA__=(location.protocol==='https:'?'wss://':'ws://')+location.host+'/sala';</script>";
const hasWeb = () => fs.existsSync(path.join(DIR, 'index.html'));

function serve(req, res) {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/sala-info') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    return res.end(JSON.stringify({ ok: true, rooms: rooms.size }));
  }
  if (!hasWeb()) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(
      '<meta charset="utf-8"><body style="font-family:sans-serif;max-width:640px;margin:40px auto;line-height:1.5">' +
        '<h1>Servidor del aula de PSJavaScript</h1><p>El reenvío de la sala está funcionando, pero falta la versión web.</p>' +
        '<p>En la carpeta del proyecto ejecuta <code>npm run export:web</code> y vuelve a iniciar <code>npm run sala</code>.</p></body>',
    );
  }
  let rel = decodeURIComponent(url.pathname);
  if (rel.endsWith('/')) rel += 'index.html';
  let file = path.normalize(path.join(DIR, rel));
  if (!file.startsWith(DIR)) {
    res.writeHead(403);
    return res.end();
  }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIR, 'index.html');
  const ext = path.extname(file).toLowerCase();
  let data = fs.readFileSync(file);
  if (ext === '.html') data = Buffer.from(data.toString('utf8').replace('</head>', `${INJECT}</head>`), 'utf8');
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
  res.end(data);
}

const server = http.createServer(serve);

server.on('upgrade', (req, socket) => {
  const key = req.headers['sec-websocket-key'];
  if (!req.url.startsWith('/sala') || !key || String(req.headers.upgrade).toLowerCase() !== 'websocket') {
    socket.destroy();
    return;
  }
  const accept = crypto.createHash('sha1').update(key + GUID).digest('base64');
  socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`);
  const conn = new Conn(socket);
  conns.add(conn);
  attach(conn);
  const leaveRoom = conn.onclose;
  conn.onclose = () => {
    conns.delete(conn);
    leaveRoom();
  };
});

// latido: cierra conexiones muertas
const beat = setInterval(() => {
  for (const c of conns) {
    if (!c.alive) {
      c.close(1001);
      continue;
    }
    c.alive = false;
    c.ping();
  }
}, 20_000);
beat.unref();

function log(msg) {
  if (!process.env.SALA_SILENCIO) console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
}

function addresses() {
  const out = [];
  for (const list of Object.values(os.networkInterfaces())) {
    for (const a of list || []) if (a.family === 'IPv4' && !a.internal) out.push(a.address);
  }
  return out;
}

if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log('\nServidor del aula de PSJavaScript listo.\n');
    const ips = addresses();
    if (ips.length) {
      console.log('Pide a tus alumnos que abran en el navegador (misma red Wi-Fi):');
      for (const ip of ips) console.log(`   http://${ip}:${PORT}`);
    } else console.log(`   http://localhost:${PORT}`);
    console.log('\nEl maestro también abre esa dirección, entra a «Modo Maestro» y elige «Red del aula».');
    if (!hasWeb()) console.log(`\n⚠ No encontré la versión web en ${DIR}. Ejecuta primero: npm run export:web`);
    console.log('\nPresiona Ctrl+C para detener.\n');
  });
}

module.exports = { server, rooms };

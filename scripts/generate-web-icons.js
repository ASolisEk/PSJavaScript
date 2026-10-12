const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const iconSrc = path.join(rootDir, 'assets', 'icon.png');
const publicDir = path.join(rootDir, 'public');
const assetsDir = path.join(rootDir, 'assets');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('[web-icons] Generando iconos web a partir de assets/icon.png...');

// 1. Copiar versiones PNG directas
fs.copyFileSync(iconSrc, path.join(publicDir, 'icon.png'));
fs.copyFileSync(iconSrc, path.join(assetsDir, 'favicon.png'));
fs.copyFileSync(iconSrc, path.join(publicDir, 'favicon.png'));

// 2. Generar apple-touch-icon.png (180x180) y favicon-32x32.png
const appleTouchIcon = path.join(publicDir, 'apple-touch-icon.png');
execSync(`sips -z 180 180 "${iconSrc}" --out "${appleTouchIcon}"`, { stdio: 'pipe' });

// 3. Generar tamaños para favicon.ico (16, 32, 48, 64)
const sizes = [16, 32, 48, 64];
const pngBuffers = [];

const tempDir = path.join(rootDir, 'scripts', '.temp-ico');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

try {
  for (const size of sizes) {
    const tempPng = path.join(tempDir, `icon_${size}.png`);
    execSync(`sips -z ${size} ${size} "${iconSrc}" --out "${tempPng}"`, { stdio: 'pipe' });
    pngBuffers.push({
      size,
      buffer: fs.readFileSync(tempPng)
    });
  }

  // Empaquetar en formato ICO estándar (PNG-encoded ICO)
  // Header: 6 bytes
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type 1 = icon
  header.writeUInt16LE(pngBuffers.length, 4); // count

  let currentOffset = 6 + pngBuffers.length * 16;
  const dirEntries = [];
  const imageBuffers = [];

  for (const item of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(item.size >= 256 ? 0 : item.size, 0); // width
    entry.writeUInt8(item.size >= 256 ? 0 : item.size, 1); // height
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(item.buffer.length, 8); // size
    entry.writeUInt32LE(currentOffset, 12); // offset

    dirEntries.push(entry);
    imageBuffers.push(item.buffer);
    currentOffset += item.buffer.length;
  }

  const icoBuffer = Buffer.concat([header, ...dirEntries, ...imageBuffers]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
  fs.writeFileSync(path.join(assetsDir, 'favicon.ico'), icoBuffer);
  console.log('[web-icons] favicon.ico multi-resolución generado con éxito.');
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

console.log('[web-icons] ¡Iconos web actualizados exitosamente!');

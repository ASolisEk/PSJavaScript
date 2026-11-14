#!/usr/bin/env node
/**
 * Cambia la versión de PSJavaScript en todos los lugares donde aparece y, si se pide,
 * crea el commit y la etiqueta que disparan la compilación de los instaladores.
 *
 *   npm run version:bump -- patch            1.0.5 → 1.0.6 (también minor, major o 1.2.3)
 *   npm run version:bump -- patch --tag      además: commit «chore: versión X» + etiqueta vX
 *   npm run version:bump -- patch --push     además: sube el commit y la etiqueta a GitHub
 *   npm run version:bump -- --check          solo revisa que todas las versiones coincidan
 *
 * Al subir la etiqueta, el workflow «Instaladores» compila Windows, macOS (Apple Silicon e
 * Intel), Linux y Android y los publica en GitHub Releases. Nada se guarda en el repositorio.
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const write = (f, s) => fs.writeFileSync(path.join(root, f), s);

const FILES = {
  package: 'package.json',
  lock: 'package-lock.json',
  app: 'app.json',
  updater: 'src/core/updater.ts',
};

function versions() {
  const pkg = JSON.parse(read(FILES.package)).version;
  const lock = fs.existsSync(path.join(root, FILES.lock)) ? JSON.parse(read(FILES.lock)).version : pkg;
  const app = JSON.parse(read(FILES.app)).expo.version;
  const updater = /CURRENT_VERSION = '([^']+)'/.exec(read(FILES.updater))?.[1];
  return { pkg, lock, app, updater };
}

function next(current, kind) {
  if (/^\d+\.\d+\.\d+$/.test(kind)) return kind;
  const [a, b, c] = current.split('.').map(Number);
  if (kind === 'major') return `${a + 1}.0.0`;
  if (kind === 'minor') return `${a}.${b + 1}.0`;
  if (kind === 'patch') return `${a}.${b}.${c + 1}`;
  return null;
}

const v = versions();
if (flag('--check')) {
  const all = Object.entries(v);
  const ok = all.every(([, x]) => x === v.pkg);
  for (const [k, x] of all) console.log(`  ${k.padEnd(8)} ${x}${x === v.pkg ? '' : '  ✗'}`);
  console.log(ok ? `Todas las versiones coinciden: ${v.pkg}` : 'Las versiones no coinciden: usa npm run version:bump -- <versión>');
  process.exit(ok ? 0 : 1);
}

const kind = args.find((a) => !a.startsWith('--'));
const version = kind && next(v.pkg, kind);
if (!version) {
  console.error('Indica patch, minor, major o una versión como 1.2.3.  Ej.: npm run version:bump -- patch --tag');
  process.exit(1);
}
const isNewer = (a, b) => {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] > pb[i];
  return false;
};
if (!isNewer(version, v.pkg)) {
  console.error(`La versión nueva (${version}) debe ser mayor que la actual (${v.pkg}).`);
  process.exit(1);
}

// package.json y package-lock.json
const pkg = JSON.parse(read(FILES.package));
pkg.version = version;
write(FILES.package, JSON.stringify(pkg, null, 2) + '\n');
if (fs.existsSync(path.join(root, FILES.lock))) {
  const lock = JSON.parse(read(FILES.lock));
  lock.version = version;
  if (lock.packages?.['']) lock.packages[''].version = version;
  write(FILES.lock, JSON.stringify(lock, null, 2) + '\n');
}
// app.json: versión y versionCode de Android (debe crecer en cada versión)
const app = JSON.parse(read(FILES.app));
app.expo.version = version;
if (app.expo.android) app.expo.android.versionCode = (Number(app.expo.android.versionCode) || 0) + 1;
write(FILES.app, JSON.stringify(app, null, 2) + '\n');
// versión con la que la app compara las actualizaciones
write(FILES.updater, read(FILES.updater).replace(/CURRENT_VERSION = '[^']+'/, `CURRENT_VERSION = '${version}'`));

console.log(`Versión ${v.pkg} → ${version}${app.expo.android ? ` (Android versionCode ${app.expo.android.versionCode})` : ''}`);

if (!flag('--tag') && !flag('--push')) {
  console.log(`Siguiente paso: npm run version:bump -- ${version} --tag  (o haz el commit y la etiqueta v${version} a mano)`);
  process.exit(0);
}

const git = (...a) => {
  const r = spawnSync('git', a, { cwd: root, stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
};
const tag = `v${version}`;
if (spawnSync('git', ['rev-parse', '-q', '--verify', `refs/tags/${tag}`], { cwd: root }).status === 0) {
  console.error(`La etiqueta ${tag} ya existe.`);
  process.exit(1);
}
git('add', ...Object.values(FILES).filter((f) => fs.existsSync(path.join(root, f))));
git('commit', '-m', `chore: versión ${version}`);
git('tag', '-a', tag, '-m', `PSJavaScript ${version}`);
console.log(`Commit y etiqueta ${tag} creados.`);
if (flag('--push')) {
  git('push', 'origin', 'HEAD');
  git('push', 'origin', tag);
  console.log('Listo: GitHub está compilando los instaladores (pestaña Actions → «Instaladores»).');
} else {
  console.log(`Para publicar: git push origin HEAD && git push origin ${tag}`);
}

#!/usr/bin/env node
/**
 * Publica los instaladores en GitHub Releases (en lugar de guardarlos en el repositorio).
 *
 *   npm run release              crea la versión vX.Y.Z (de package.json) y sube los instaladores de public/
 *   npm run release -- --dry-run muestra lo que haría, sin publicar nada
 *
 * Requiere la herramienta `gh` con sesión iniciada (gh auth login). Si la versión ya existe,
 * reemplaza los archivos (--clobber). Los botones de descarga de la página y el actualizador
 * usan solos los instaladores de la última versión publicada.
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dry = process.argv.includes('--dry-run');
const { version } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const tag = `v${version}`;
const FILES = ['PSJavaScript.apk', 'PSJavaScript.dmg', 'PSJavaScript-Setup.exe', 'PSJavaScript.AppImage'];
const found = FILES.map((f) => path.join(root, 'public', f)).filter((f) => fs.existsSync(f));

if (!found.length) {
  console.error('No hay instaladores en public/. Compílalos primero (npm run build:android, npm run build:desktop:…).');
  process.exit(1);
}
console.log(`Versión ${tag}: ${found.length} instalador(es)`);
for (const f of found) console.log(`  · ${path.basename(f)} (${(fs.statSync(f).size / 1048576).toFixed(1)} MB)`);
const missing = FILES.filter((f) => !found.some((x) => x.endsWith(f)));
if (missing.length) console.log(`  (faltan: ${missing.join(', ')})`);

const gh = (args) => {
  if (dry) {
    console.log(`[simulación] gh ${args.join(' ')}`);
    return { status: 0 };
  }
  return spawnSync('gh', args, { cwd: root, stdio: 'inherit' });
};

if (!dry && spawnSync('gh', ['--version'], { stdio: 'ignore' }).status !== 0) {
  console.error('Falta la herramienta gh: https://cli.github.com (después: gh auth login).');
  process.exit(1);
}
const exists = !dry && spawnSync('gh', ['release', 'view', tag], { cwd: root, stdio: 'ignore' }).status === 0;
const r = exists
  ? gh(['release', 'upload', tag, ...found, '--clobber'])
  : gh(['release', 'create', tag, ...found, '--title', `PSJavaScript ${version}`, '--notes', `Instaladores de PSJavaScript ${version}.`]);
process.exit(r.status ?? 1);

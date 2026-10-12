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

// 3. Generar favicon.ico nativo usando sips
if (process.platform === 'darwin') {
  const icoPublic = path.join(publicDir, 'favicon.ico');
  execSync(`sips -s format ico -z 64 64 "${iconSrc}" --out "${icoPublic}"`, { stdio: 'pipe' });
  fs.copyFileSync(icoPublic, path.join(assetsDir, 'favicon.ico'));
  console.log('[web-icons] favicon.ico nativo generado con éxito.');

  // Favicons en tamaños estándar para navegadores modernos
  execSync(`sips -z 32 32 "${iconSrc}" --out "${path.join(publicDir, 'favicon-32x32.png')}"`, { stdio: 'pipe' });
  execSync(`sips -z 16 16 "${iconSrc}" --out "${path.join(publicDir, 'favicon-16x16.png')}"`, { stdio: 'pipe' });
  fs.copyFileSync(path.join(publicDir, 'favicon-32x32.png'), path.join(assetsDir, 'favicon-32x32.png'));
}

console.log('[web-icons] ¡Iconos web actualizados exitosamente!');

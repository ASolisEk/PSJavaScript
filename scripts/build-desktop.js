const { spawnSync } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const platform = process.platform;
const args = process.argv.slice(2);

console.log(`[build-desktop] Detectado sistema operativo: ${platform}`);

if (platform === 'darwin') {
  console.log('[build-desktop] Ejecutando compilación para macOS...');
  const scriptPath = path.join(__dirname, 'build-desktop-mac.sh');
  const result = spawnSync('bash', [scriptPath, ...args], {
    cwd: rootDir,
    stdio: 'inherit'
  });
  process.exit(result.status || 0);
} else if (platform === 'win32') {
  console.log('[build-desktop] Ejecutando compilación para Windows...');
  const scriptPath = path.join(__dirname, 'build-desktop.ps1');
  const result = spawnSync('powershell', ['-ExecutionPolicy', 'Bypass', '-File', scriptPath, ...args], {
    cwd: rootDir,
    stdio: 'inherit'
  });
  process.exit(result.status || 0);
} else {
  console.error(`[build-desktop] Plataforma no soportada directamente: ${platform}`);
  console.log('Para macOS usa: npm run build:desktop:mac');
  console.log('Para Windows usa: npm run build:desktop:win');
  process.exit(1);
}

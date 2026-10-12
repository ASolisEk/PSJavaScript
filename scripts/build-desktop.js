const { spawnSync } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const platform = process.platform;
const args = process.argv.slice(2);

console.log(`[build-desktop] Detectado sistema operativo: ${platform}`);

// Permitir forzar la plataforma objetivo vía argumentos
const targetLinux = args.includes('--linux') || args.includes('linux');
const targetMac = args.includes('--mac') || args.includes('mac') || args.includes('darwin');
const targetWin = args.includes('--win') || args.includes('win') || args.includes('win32');

const targetPlatform = targetLinux ? 'linux' : targetMac ? 'darwin' : targetWin ? 'win32' : platform;
const cleanArgs = args.filter(a => !['--linux', 'linux', '--mac', 'mac', 'darwin', '--win', 'win', 'win32'].includes(a));

if (targetPlatform === 'darwin') {
  console.log('[build-desktop] Ejecutando compilación para macOS...');
  const scriptPath = path.join(__dirname, 'build-desktop-mac.sh');
  const result = spawnSync('bash', [scriptPath, ...cleanArgs], {
    cwd: rootDir,
    stdio: 'inherit'
  });
  process.exit(result.status || 0);
} else if (targetPlatform === 'win32') {
  console.log('[build-desktop] Ejecutando compilación para Windows...');
  const scriptPath = path.join(__dirname, 'build-desktop.ps1');
  const result = spawnSync('powershell', ['-ExecutionPolicy', 'Bypass', '-File', scriptPath, ...cleanArgs], {
    cwd: rootDir,
    stdio: 'inherit'
  });
  process.exit(result.status || 0);
} else if (targetPlatform === 'linux') {
  console.log('[build-desktop] Ejecutando compilación para GNU/Linux...');
  const scriptPath = path.join(__dirname, 'build-desktop-linux.sh');
  const result = spawnSync('bash', [scriptPath, ...cleanArgs], {
    cwd: rootDir,
    stdio: 'inherit'
  });
  process.exit(result.status || 0);
} else {
  console.error(`[build-desktop] Plataforma no soportada directamente: ${platform}`);
  console.log('Para GNU/Linux usa: npm run build:desktop:linux');
  console.log('Para macOS usa:     npm run build:desktop:mac');
  console.log('Para Windows usa:   npm run build:desktop:win');
  process.exit(1);
}

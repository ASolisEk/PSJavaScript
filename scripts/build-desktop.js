const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
const platform = process.platform;
const args = process.argv.slice(2);

console.log(`[build-desktop] Sistema operativo anfitrión: ${platform}`);

// Permitir forzar la plataforma objetivo vía argumentos
const targetLinux = args.includes('--linux') || args.includes('linux');
const targetMac = args.includes('--mac') || args.includes('mac') || args.includes('darwin');
const targetWin = args.includes('--win') || args.includes('win') || args.includes('win32');

const targetPlatform = targetLinux ? 'linux' : targetMac ? 'darwin' : targetWin ? 'win32' : platform;
const cleanArgs = args.filter(a => !['--linux', 'linux', '--mac', 'mac', 'darwin', '--win', 'win', 'win32'].includes(a));

function findBash() {
  if (platform !== 'win32') return 'bash';
  const candidates = [
    'bash',
    'C:\\Program Files\\Git\\bin\\bash.exe',
    'C:\\Program Files (x86)\\Git\\bin\\bash.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Git', 'bin', 'bash.exe'),
    path.join(process.env.ProgramW6432 || '', 'Git', 'bin', 'bash.exe')
  ];
  for (const c of candidates) {
    if (c === 'bash') {
      const check = spawnSync('where', ['bash'], { stdio: 'ignore' });
      if (check.status === 0) return 'bash';
    } else if (fs.existsSync(c)) {
      return c;
    }
  }
  return null;
}

if (targetPlatform === 'darwin') {
  console.log('[build-desktop] Ejecutando compilación para macOS...');
  if (platform !== 'darwin') {
    console.warn('\n[build-desktop] AVISO: La generación de paquetes DMG para macOS requiere el entorno nativo de macOS.');
    console.log('Para generar la versión de macOS, compila desde un equipo con macOS o utiliza GitHub Actions en un runner macos-latest.\n');
  }
  const scriptPath = path.join(__dirname, 'build-desktop-mac.sh');
  const bashCmd = findBash();
  if (!bashCmd) {
    console.error('[build-desktop] ERROR: Se requiere "bash" o Git Bash en Windows para ejecutar este script.');
    process.exit(1);
  }
  const result = spawnSync(bashCmd, [scriptPath, ...cleanArgs], {
    cwd: rootDir,
    stdio: 'inherit'
  });
  process.exit(result.status || 0);
} else if (targetPlatform === 'win32') {
  console.log('[build-desktop] Ejecutando compilación para Windows...');
  const scriptPath = path.join(__dirname, 'build-desktop.ps1');
  if (platform === 'win32') {
    const result = spawnSync('powershell', ['-ExecutionPolicy', 'Bypass', '-File', scriptPath, ...cleanArgs], {
      cwd: rootDir,
      stdio: 'inherit'
    });
    process.exit(result.status || 0);
  } else {
    // Si estamos en Linux o macOS pero se solicitó compilar para Windows
    const result = spawnSync('npx', ['electron-builder', '--win', ...cleanArgs], {
      cwd: path.join(rootDir, 'desktop-app'),
      stdio: 'inherit'
    });
    process.exit(result.status || 0);
  }
} else if (targetPlatform === 'linux') {
  console.log('[build-desktop] Ejecutando compilación para GNU/Linux...');
  if (platform === 'win32') {
    // En Windows se utiliza el script nativo de PowerShell para evitar depender de bash en PATH
    const scriptPath = path.join(__dirname, 'build-desktop-linux.ps1');
    const result = spawnSync('powershell', ['-ExecutionPolicy', 'Bypass', '-File', scriptPath, ...cleanArgs], {
      cwd: rootDir,
      stdio: 'inherit'
    });
    process.exit(result.status || 0);
  } else {
    // En Linux o macOS se ejecuta el script bash original
    const scriptPath = path.join(__dirname, 'build-desktop-linux.sh');
    const result = spawnSync('bash', [scriptPath, ...cleanArgs], {
      cwd: rootDir,
      stdio: 'inherit'
    });
    process.exit(result.status || 0);
  }
} else {
  console.error(`[build-desktop] Plataforma no soportada directamente: ${platform}`);
  console.log('Para GNU/Linux usa: npm run build:desktop:linux');
  console.log('Para macOS usa:     npm run build:desktop:mac');
  console.log('Para Windows usa:   npm run build:desktop:win');
  process.exit(1);
}

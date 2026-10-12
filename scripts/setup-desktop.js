const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const desktopDir = path.join(rootDir, 'desktop-app');

if (!fs.existsSync(desktopDir)) {
  fs.mkdirSync(desktopDir, { recursive: true });
}

// 1. Copy icon files to desktop-app
const iconPng = path.join(rootDir, 'assets', 'icon.png');
const iconIcns = path.join(rootDir, 'assets', 'icon.icns');

if (fs.existsSync(iconPng)) {
  fs.copyFileSync(iconPng, path.join(desktopDir, 'icon.png'));
}
if (fs.existsSync(iconIcns)) {
  fs.copyFileSync(iconIcns, path.join(desktopDir, 'icon.icns'));
}

// 2. desktop-app/package.json
const packageJson = {
  name: 'psjavascript-desktop',
  version: '1.0.0',
  description: 'PSJavaScript Entorno Educativo de Programación',
  main: 'main.js',
  repository: 'github:ASolisEk/PSJavaScript',
  dependencies: {
    express: '^4.19.2'
  },
  devDependencies: {
    electron: '30.0.0',
    'electron-builder': 'latest'
  },
  build: {
    appId: 'com.psjavascript.desktop',
    productName: 'PSJavaScript',
    directories: {
      output: 'out'
    },
    compression: 'maximum',
    mac: {
      category: 'public.app-category.education',
      target: [
        {
          target: 'dmg',
          arch: ['arm64', 'x64']
        }
      ],
      icon: 'icon.icns',
      identity: null,
      hardenedRuntime: false,
      gatekeeperAssess: false
    },
    dmg: {
      title: 'PSJavaScript',
      icon: 'icon.icns',
      contents: [
        {
          x: 130,
          y: 220,
          type: 'file'
        },
        {
          x: 410,
          y: 220,
          type: 'link',
          path: '/Applications'
        }
      ],
      window: {
        width: 540,
        height: 380
      }
    },
    win: {
      target: 'nsis',
      icon: 'icon.png'
    },
    nsis: {
      createDesktopShortcut: true,
      createStartMenuShortcut: true,
      shortcutName: 'PSJavaScript'
    },
    asar: false,
    files: [
      'main.js',
      'package.json',
      'icon.png',
      'icon.icns',
      'www/**/*'
    ]
  }
};

fs.writeFileSync(
  path.join(desktopDir, 'package.json'),
  JSON.stringify(packageJson, null, 2),
  'utf8'
);

// 3. desktop-app/main.js
const mainJs = `const { app, BrowserWindow, session, Menu } = require('electron');
const path = require('path');
const express = require('express');
const fs = require('fs');

let server;

function setupMenu(win) {
  if (process.platform === 'darwin') {
    const template = [
      {
        label: app.name,
        submenu: [
          { role: 'about', label: 'Acerca de PSJavaScript' },
          { type: 'separator' },
          { role: 'services', label: 'Servicios' },
          { type: 'separator' },
          { role: 'hide', label: 'Ocultar PSJavaScript' },
          { role: 'hideOthers', label: 'Ocultar otros' },
          { role: 'unhide', label: 'Mostrar todo' },
          { type: 'separator' },
          { role: 'quit', label: 'Salir de PSJavaScript' }
        ]
      },
      {
        label: 'Edición',
        submenu: [
          { role: 'undo', label: 'Deshacer' },
          { role: 'redo', label: 'Rehacer' },
          { type: 'separator' },
          { role: 'cut', label: 'Cortar' },
          { role: 'copy', label: 'Copiar' },
          { role: 'paste', label: 'Pegar' },
          { role: 'selectAll', label: 'Seleccionar todo' }
        ]
      },
      {
        label: 'Ver',
        submenu: [
          { role: 'reload', label: 'Recargar' },
          { role: 'forceReload', label: 'Forzar recarga' },
          { role: 'toggleDevTools', label: 'Herramientas de desarrollo' },
          { type: 'separator' },
          { role: 'resetZoom', label: 'Tamaño real' },
          { role: 'zoomIn', label: 'Acercar' },
          { role: 'zoomOut', label: 'Alejar' },
          { type: 'separator' },
          { role: 'togglefullscreen', label: 'Pantalla completa' }
        ]
      },
      {
        label: 'Ventana',
        submenu: [
          { role: 'minimize', label: 'Minimizar' },
          { role: 'zoom', label: 'Zoom' },
          { role: 'close', label: 'Cerrar' }
        ]
      }
    ];
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  } else {
    win.setMenuBarVisibility(false);
  }
}

function createWindow() {
  const iconPng = path.join(__dirname, 'icon.png');
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 800,
    minHeight: 600,
    icon: fs.existsSync(iconPng) ? iconPng : undefined,
    title: 'PSJavaScript',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  setupMenu(win);

  if (process.platform === 'darwin' && app.dock && fs.existsSync(iconPng)) {
    try {
      app.dock.setIcon(iconPng);
    } catch (e) {
      console.warn('No se pudo establecer el icono del Dock:', e);
    }
  }

  const expApp = express();

  expApp.get('*', (req, res) => {
    let urlPath = req.path;
    if (urlPath === '/') urlPath = '/index.html';

    let filePath = path.join(__dirname, 'www', urlPath);

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(__dirname, 'www', 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.ico': 'image/x-icon',
      '.svg': 'image/svg+xml',
      '.ttf': 'font/ttf',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.json': 'application/json'
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';

    try {
      const data = fs.readFileSync(filePath);
      res.set('Content-Type', contentType);
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.send(data);
    } catch (err) {
      res.status(500).send('Error al cargar archivo');
    }
  });

  server = expApp.listen(0, '127.0.0.1', () => {
    const port = server.address().port;
    win.loadURL(\`http://127.0.0.1:\${port}\`);
  });
}

app.whenReady().then(() => {
  session.defaultSession.clearCache().then(() => {
    createWindow();
  });
});

app.on('will-quit', () => {
  if (server) {
    try {
      server.close();
    } catch (e) {}
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
`;

fs.writeFileSync(path.join(desktopDir, 'main.js'), mainJs, 'utf8');

console.log('Archivos de configuración desktop-app generados exitosamente.');

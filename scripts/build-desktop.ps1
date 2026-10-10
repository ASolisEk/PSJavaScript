# scripts/build-desktop.ps1
Write-Host "Building web version..."
npm run export:web

Write-Host "Setting up Electron desktop app..."
if (Test-Path -Path "desktop-app") {
    Remove-Item -Recurse -Force "desktop-app"
}
New-Item -ItemType Directory -Path "desktop-app"
New-Item -ItemType Directory -Path "desktop-app/www"

Copy-Item -Path "dist/*" -Destination "desktop-app/www" -Recurse
Remove-Item -Path "desktop-app/www/PSJavaScript-Setup.exe" -ErrorAction SilentlyContinue

Write-Host "Injecting base64 fonts to guarantee offline rendering..."
node scripts/inject-fonts.js

$packageJsonPath = "desktop-app/package.json"
$packageJson = @{
    name = "psjavascript-desktop"
    version = "1.0.0"
    main = "main.js"
    repository = "github:ASolisEk/PSJavaScript"
    dependencies = @{
        "express" = "^4.19.2"
    }
    devDependencies = @{
        "electron" = "30.0.0"
        "electron-builder" = "latest"
    }
    build = @{
        appId = "com.psjavascript.desktop"
        productName = "PSJavaScript"
        directories = @{
            output = "out"
        }
        win = @{
            target = "nsis"
            icon = "../assets/icon.png"
        }
        nsis = @{
            createDesktopShortcut = $true
            createStartMenuShortcut = $true
            shortcutName = "PSJavaScript"
        }
        asar = $false
        files = @(
            "main.js",
            "package.json",
            "www/**/*"
        )
    }
}
$packageJson | ConvertTo-Json -Depth 5 | Out-File -FilePath $packageJsonPath -Encoding ascii

$mainJsPath = "desktop-app/main.js"
$mainJs = @'
const { app, BrowserWindow, session } = require('electron');
const path = require('path');
const express = require('express');

let server;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, '../assets/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  win.setMenuBarVisibility(false);
  
  const expApp = express();
  const fs = require('fs');

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
      res.status(500).send('Error loading file');
    }
  });
  
  server = expApp.listen(0, '127.0.0.1', () => {
    const port = server.address().port;
    win.loadURL(`http://127.0.0.1:${port}`);
  });
}

app.whenReady().then(() => {
  session.defaultSession.clearCache().then(() => {
    createWindow();
  });
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
'@
Set-Content -Path $mainJsPath -Value $mainJs -Encoding ascii

Set-Location "desktop-app"
if (Test-Path -Path "out") {
    Remove-Item -Recurse -Force "out"
}
npm install
Write-Host "Building Windows executable..."
npx electron-builder --win

Write-Host "Copying executable to public folder..."
Set-Location ".."
if (!(Test-Path -Path "public")) {
    New-Item -ItemType Directory -Path "public"
}
$exePath = Get-ChildItem -Path "desktop-app/out/PSJavaScript Setup *.exe" | Select-Object -First 1
if ($exePath) {
    Copy-Item -Path $exePath.FullName -Destination "public/PSJavaScript-Setup.exe" -Force
    Write-Host "Executable copied to public/PSJavaScript-Setup.exe"
} else {
    Write-Host "Executable not found!"
}

Write-Host "Re-building web version to include the executable..."
npm run export:web
Write-Host "Done!"

const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1024,
    height: 1024,
    useContentSize: true,
    show: false,
    frame: false,
    transparent: true,
    enableLargerThanScreen: true,
    webPreferences: {
      offscreen: true
    }
  });

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1024px;
    height: 1024px;
    background: transparent;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .icon-container {
    width: 1024px;
    height: 1024px;
    background: #1c1c1e;
    border-radius: 224px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05);
  }
  .brand-text {
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro", "Helvetica Neue", "Arial Black", sans-serif;
    font-size: 360px;
    font-weight: 900;
    letter-spacing: -14px;
    line-height: 1;
    display: flex;
    align-items: center;
    user-select: none;
    padding-top: 10px; /* Optical vertical centering adjustment */
  }
  .ps {
    color: #FFFFFF;
  }
  .js {
    color: #E8B100;
  }
</style>
</head>
<body>
  <div class="icon-container">
    <div class="brand-text">
      <span class="ps">PS</span><span class="js">JS</span>
    </div>
  </div>
</body>
</html>`;

  await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
  await new Promise(resolve => setTimeout(resolve, 800));

  const image = await win.capturePage({ x: 0, y: 0, width: 1024, height: 1024 });
  const iconPngPath = path.resolve(__dirname, '..', 'assets', 'icon.png');
  fs.writeFileSync(iconPngPath, image.toPNG());
  console.log('Icon generated at:', iconPngPath);
  app.exit(0);
});

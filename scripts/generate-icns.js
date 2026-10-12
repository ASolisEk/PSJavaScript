const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function generateIcns() {
  const rootDir = path.resolve(__dirname, '..');
  const iconSrc = path.join(rootDir, 'assets', 'icon.png');
  const icnsDest = path.join(rootDir, 'assets', 'icon.icns');
  const iconsetDir = path.join(rootDir, 'assets', 'icon.iconset');

  if (!fs.existsSync(iconSrc)) {
    console.error(`Source icon not found at: ${iconSrc}`);
    process.exit(1);
  }

  // Only macOS has sips and iconutil natively
  if (process.platform !== 'darwin') {
    console.log('Skipping native icns generation (not on macOS)');
    return;
  }

  console.log('Generating macOS icon.icns from assets/icon.png...');

  if (fs.existsSync(iconsetDir)) {
    fs.rmSync(iconsetDir, { recursive: true, force: true });
  }
  fs.mkdirSync(iconsetDir, { recursive: true });

  const sizes = [
    { size: 16, name: 'icon_16x16.png' },
    { size: 32, name: 'icon_16x16@2x.png' },
    { size: 32, name: 'icon_32x32.png' },
    { size: 64, name: 'icon_32x32@2x.png' },
    { size: 128, name: 'icon_128x128.png' },
    { size: 256, name: 'icon_128x128@2x.png' },
    { size: 256, name: 'icon_256x256.png' },
    { size: 512, name: 'icon_256x256@2x.png' },
    { size: 512, name: 'icon_512x512.png' },
    { size: 1024, name: 'icon_512x512@2x.png' },
  ];

  try {
    for (const { size, name } of sizes) {
      const dest = path.join(iconsetDir, name);
      execSync(`sips -z ${size} ${size} "${iconSrc}" --out "${dest}"`, { stdio: 'pipe' });
    }

    execSync(`iconutil -c icns "${iconsetDir}" -o "${icnsDest}"`, { stdio: 'pipe' });
    console.log(`Successfully generated: ${icnsDest}`);
  } catch (err) {
    console.error('Error generating .icns:', err);
    throw err;
  } finally {
    if (fs.existsSync(iconsetDir)) {
      fs.rmSync(iconsetDir, { recursive: true, force: true });
    }
  }
}

if (require.main === module) {
  generateIcns();
}

module.exports = { generateIcns };

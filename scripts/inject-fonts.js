const fs = require('fs');
const path = require('path');

const wwwDir = path.join(__dirname, '..', 'desktop-app', 'www');
const indexHtmlPath = path.join(wwwDir, 'index.html');

if (!fs.existsSync(indexHtmlPath)) {
  console.log('index.html not found, skipping font injection');
  process.exit(0);
}

let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

// Find Ionicons font file
const fontsDir = path.join(wwwDir, 'assets', 'node_modules', '@expo', 'vector-icons', 'build', 'vendor', 'react-native-vector-icons', 'Fonts');
if (!fs.existsSync(fontsDir)) {
  console.log('Fonts directory not found');
  process.exit(0);
}

const files = fs.readdirSync(fontsDir);
const ioniconsFile = files.find(f => f.startsWith('Ionicons') && f.endsWith('.ttf'));

if (ioniconsFile) {
  const fontPath = path.join(fontsDir, ioniconsFile);
  const fontBase64 = fs.readFileSync(fontPath).toString('base64');
  
  const styleInject = `
  <style id="injected-ionicons">
    @font-face {
      font-family: "Ionicons";
      src: url(data:font/ttf;charset=utf-8;base64,${fontBase64}) format("truetype");
      font-display: swap;
    }
  </style>
  `;
  
  if (indexHtml.includes('</head>')) {
    indexHtml = indexHtml.replace('</head>', `${styleInject}\n</head>`);
    fs.writeFileSync(indexHtmlPath, indexHtml, 'utf8');
    console.log('Successfully injected Ionicons base64 into index.html');
  }
} else {
  console.log('Ionicons font file not found');
}

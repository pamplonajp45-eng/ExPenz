const fs = require('fs');
const path = require('path');

// Create assets/images directory
const assetsDir = path.join(__dirname, 'dist', 'assets', 'images');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Copy logo.png
const logoSrc = path.join(__dirname, 'assets', 'images', 'logo.png');
const logoDest = path.join(assetsDir, 'logo.png');
fs.copyFileSync(logoSrc, logoDest);

// Copy manifest.json
const manifestSrc = path.join(__dirname, 'public', 'manifest.json');
const manifestDest = path.join(__dirname, 'dist', 'manifest.json');
fs.copyFileSync(manifestSrc, manifestDest);

// Copy sw.js
const swSrc = path.join(__dirname, 'public', 'sw.js');
const swDest = path.join(__dirname, 'dist', 'sw.js');
fs.copyFileSync(swSrc, swDest);

// Modify HTML to include manifest and service worker
const htmlPath = path.join(__dirname, 'dist', 'index.html');
let htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Add manifest link
htmlContent = htmlContent.replace(
  '<title data-rh="true"></title>',
  '<title data-rh="true"></title><link rel="manifest" href="/manifest.json">'
);

// Add service worker script
htmlContent = htmlContent.replace(
  '<link rel="manifest" href="/manifest.json">',
  '<link rel="manifest" href="/manifest.json"><script>if ("serviceWorker" in navigator) { navigator.serviceWorker.register("/sw.js"); }</script>'
);

fs.writeFileSync(htmlPath, htmlContent);

console.log('PWA files copied and HTML modified successfully!');
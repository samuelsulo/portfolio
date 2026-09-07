// Regenerates qr-matrix.json from a target URL.
// Usage: node generate-qr.js [url]  (defaults to https://samuelsulo.it)
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

const url = process.argv[2] || 'https://samuelsulo.it';
const qr = QRCode.create(url, { errorCorrectionLevel: 'M' });
const size = qr.modules.size;
const data = qr.modules.data;

const matrix = [];
for (let r = 0; r < size; r++) {
  const row = [];
  for (let c = 0; c < size; c++) row.push(data[r * size + c] & 1);
  matrix.push(row);
}

fs.writeFileSync(path.join(__dirname, 'qr-matrix.json'), JSON.stringify({ url, size, matrix }));
console.log(`qr-matrix.json written: ${size}x${size} modules, encoding "${url}"`);
console.log('Run build-back.js next to re-embed it into back.html, then generate-pdf.js for print files.');

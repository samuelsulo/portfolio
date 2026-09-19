// Embeds qr-matrix.json as an inline SVG into back.template.html, producing
// the final, directly-viewable back.html. Re-run after generate-qr.js.
const fs = require('fs');
const path = require('path');

const { size, matrix } = JSON.parse(fs.readFileSync(path.join(__dirname, 'qr-matrix.json'), 'utf8'));

const qrMm = 25; // physical QR size in mm, matches .back__qr-frame's inner space
const mod = qrMm / size;
let rects = '';
for (let r = 0; r < size; r++) {
  for (let c = 0; c < size; c++) {
    if (matrix[r][c]) {
      const x = (c * mod).toFixed(3);
      const y = (r * mod).toFixed(3);
      rects += `<rect x="${x}" y="${y}" width="${mod.toFixed(3)}" height="${mod.toFixed(3)}"/>`;
    }
  }
}
const svg = `<svg class="qr-svg" viewBox="0 0 ${qrMm} ${qrMm}" width="${qrMm}mm" height="${qrMm}mm" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">${rects}</svg>`;

const tpl = fs.readFileSync(path.join(__dirname, 'back.template.html'), 'utf8');
fs.writeFileSync(path.join(__dirname, 'back.html'), tpl.replace('__QR_SVG__', svg));
console.log('back.html written with embedded QR (' + size + 'x' + size + ' modules, ' + mod.toFixed(3) + 'mm/module)');

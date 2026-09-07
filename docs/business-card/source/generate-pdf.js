// Print-ready CMYK PDF generator for Samuel Sulo's business card.
// Pure vector output (PDFKit), true CMYK colorspace, exact mm sizing:
// 91 x 61 mm artboard = 85 x 55 mm finished size + 3mm bleed/edge.
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const OUT = path.resolve(__dirname, '../export');
const FONTS = path.resolve(__dirname, 'fonts');

const mm = (v) => (v * 72) / 25.4;

// ---- Color: naive sRGB -> CMYK, plus hand-tuned overrides for ink-heavy
// solids (a straight formulaic conversion of a near-black gives a flat,
// lifeless K-only gray in print; a "rich black" recipe reads much closer
// to the site's near-black background). ----
function rgbToCmyk(hex) {
  const n = hex.replace('#', '');
  const r = parseInt(n.slice(0, 2), 16) / 255;
  const g = parseInt(n.slice(2, 4), 16) / 255;
  const b = parseInt(n.slice(4, 6), 16) / 255;
  const k = 1 - Math.max(r, g, b);
  if (k >= 1) return [0, 0, 0, 100];
  const c = ((1 - r - k) / (1 - k)) * 100;
  const m = ((1 - g - k) / (1 - k)) * 100;
  const y = ((1 - b - k) / (1 - k)) * 100;
  return [c, m, y, k * 100];
}

const CMYK = {
  bg: [60, 45, 35, 100], // rich, cool black (hand-tuned; matches #05060a's blue-black tone far better than a naive formula)
  textLight: rgbToCmyk('#e9ebf3'),
  textMuted: rgbToCmyk('#a3a9bd'),
  textDim: rgbToCmyk('#6b7186'),
  cyan: rgbToCmyk('#35e6ff'),
  cyanStrong: rgbToCmyk('#7df3ff'),
  purple: rgbToCmyk('#b24bf3'),
  success: rgbToCmyk('#45f0a6'),
  border: [8, 5, 0, 12],
};

const CARD_W = 91;
const CARD_H = 61;
const SAFE = 7.5; // = 3mm bleed + 4.5mm safe margin from trim
const safeX = SAFE;
const safeY = SAFE;
const safeW = CARD_W - SAFE * 2;
const safeH = CARD_H - SAFE * 2;

function registerFonts(doc) {
  doc.registerFont('Sans', path.join(FONTS, 'SpaceGrotesk-Regular.ttf'));
  doc.registerFont('Sans-Medium', path.join(FONTS, 'SpaceGrotesk-Medium.ttf'));
  doc.registerFont('Sans-Bold', path.join(FONTS, 'SpaceGrotesk-Bold.ttf'));
  doc.registerFont('Mono', path.join(FONTS, 'JetBrainsMono-Regular.ttf'));
  doc.registerFont('Mono-Medium', path.join(FONTS, 'JetBrainsMono-Medium.ttf'));
  doc.registerFont('Mono-Bold', path.join(FONTS, 'JetBrainsMono-Bold.ttf'));
}

function drawBackground(doc) {
  doc.rect(0, 0, mm(CARD_W), mm(CARD_H)).fillColor(CMYK.bg).fill();
}

// Faint cyberpunk grid texture, same 6mm pitch as the site's .bg-grid.
function drawGrid(doc) {
  doc.save();
  doc.opacity(0.05);
  doc.lineWidth(0.35);
  for (let x = 0; x <= CARD_W; x += 6) {
    doc.moveTo(mm(x), 0).lineTo(mm(x), mm(CARD_H)).strokeColor(CMYK.cyan).stroke();
  }
  for (let y = 0; y <= CARD_H; y += 6) {
    doc.moveTo(0, mm(y)).lineTo(mm(CARD_W), mm(y)).strokeColor(CMYK.cyan).stroke();
  }
  doc.restore();
}

// Soft radial glow, faked as concentric rings (PDFKit CMYK + gradients
// together are unreliable across viewers, so rings are the robust choice).
function drawGlow(doc, cx, cy, color) {
  doc.save();
  const steps = [
    [42, 0.035],
    [32, 0.05],
    [22, 0.07],
    [13, 0.09],
  ];
  for (const [r, op] of steps) {
    doc.opacity(op);
    doc.circle(mm(cx), mm(cy), mm(r)).fillColor(color).fill();
  }
  doc.restore();
}

function glowStroke(doc, drawPath, color, baseWidthMm) {
  // Layered translucent strokes under a crisp final stroke = fake glow.
  doc.save();
  const rings = [
    [baseWidthMm + 2.2, 0.12],
    [baseWidthMm + 1.1, 0.22],
  ];
  for (const [w, op] of rings) {
    doc.opacity(op);
    drawPath(doc);
    doc.lineWidth(mm(w)).strokeColor(color).stroke();
  }
  doc.opacity(1);
  drawPath(doc);
  doc.lineWidth(mm(baseWidthMm)).strokeColor(color).stroke();
  doc.restore();
}

function drawIconCircle(doc, cx, cy, d, drawGlyph) {
  const r = d / 2;
  doc.save();
  doc.opacity(1);
  doc.circle(mm(cx), mm(cy), mm(r)).lineWidth(mm(0.2)).strokeColor(CMYK.cyan).strokeOpacity(0.5).stroke();
  doc.restore();
  drawGlyph(mm(cx), mm(cy), mm(r));
}

// ---------------------------------------------------------------- FRONT --
function drawFront(doc) {
  drawBackground(doc);
  drawGlow(doc, CARD_W + 3, -4, CMYK.purple);
  drawGrid(doc);

  const markR = 5.5;
  const markCX = safeX + markR;
  const markCY = safeY + markR;

  glowStroke(
    doc,
    (d) => d.circle(mm(markCX), mm(markCY), mm(markR)),
    CMYK.cyan,
    0.28,
  );

  const markFoxSizeMm = 7.4; // matches front.html's .front__mark svg
  drawFox(doc, markCX - markFoxSizeMm / 2, markCY - markFoxSizeMm / 2, markFoxSizeMm, 1, { badge: false });

  // Identity block, bottom-anchored within the safe area.
  const paddingBottom = 1.5;
  const roleFontMm = 3;
  const roleLineMm = roleFontMm * 1.35;
  const nameFontMm = 6.4;
  const nameLineMm = nameFontMm * 1.08;
  const gapMm = 2;

  const roleBottomY = safeY + safeH - paddingBottom;
  const roleTopY = roleBottomY - roleLineMm;
  const nameBottomY = roleTopY - gapMm;
  const nameTopY = nameBottomY - nameLineMm;

  doc
    .font('Sans-Bold')
    .fontSize(mm(nameFontMm))
    .fillColor(CMYK.textLight)
    .text('Samuel Sulo', mm(safeX), mm(nameTopY), { lineBreak: false });

  // Accent bar beside the role line.
  const barW = 0.7;
  const barH = roleLineMm * 0.72;
  const barY = roleTopY + (roleLineMm - barH) / 2;
  glowStroke(
    doc,
    (d) =>
      d
        .roundedRect(mm(safeX), mm(barY), mm(barW), mm(barH), mm(barW / 2))
        .fillColor(CMYK.cyan),
    CMYK.cyan,
    0.05,
  );
  doc.roundedRect(mm(safeX), mm(barY), mm(barW), mm(barH), mm(barW / 2)).fillColor(CMYK.cyan).fill();

  doc
    .font('Sans-Medium')
    .fontSize(mm(roleFontMm))
    .fillColor(CMYK.textMuted)
    .text('Web Developer & Cloud Engineer', mm(safeX + barW + 2.2), mm(roleTopY) + mm(roleLineMm) * 0.14, {
      lineBreak: false,
    });

  // Small brand watermark, bottom-right of the safe area.
  const wmFontMm = 1.85;
  doc
    .font('Mono')
    .fontSize(mm(wmFontMm))
    .fillColor(CMYK.textDim)
    .text('SAMUELSULO.IT', mm(safeX), mm(safeY + safeH - 1.5 - wmFontMm * 1.2), {
      width: mm(safeW),
      align: 'right',
      characterSpacing: mm(wmFontMm) * 0.16,
      lineBreak: false,
    });
}

// ----------------------------------------------------------------- BACK --
function drawIconGlyph(doc, name, cx, cy, size) {
  // cx, cy, size already in points; size = icon circle diameter's inner
  // glyph box (roughly 0.52 * circle diameter, mirroring the HTML).
  const s = size;
  doc.save();
  doc.lineWidth(s * 0.09);
  doc.strokeColor(CMYK.cyan);
  doc.lineCap('round').lineJoin('round');
  const x0 = cx - s / 2;
  const y0 = cy - s / 2;
  const P = (fx, fy) => [x0 + fx * s, y0 + fy * s];

  if (name === 'globe') {
    doc.circle(cx, cy, s * 0.42).stroke();
    doc.moveTo(...P(0.03, 0.5)).lineTo(...P(0.97, 0.5)).stroke();
    doc
      .moveTo(...P(0.5, 0.03))
      .bezierCurveTo(...P(0.75, 0.28), ...P(0.75, 0.72), ...P(0.5, 0.97))
      .bezierCurveTo(...P(0.25, 0.72), ...P(0.25, 0.28), ...P(0.5, 0.03))
      .stroke();
  } else if (name === 'mail') {
    doc.roundedRect(...P(0, 0.14), s * 0.94, s * 0.7, s * 0.08).stroke();
    doc.moveTo(...P(0.05, 0.2)).lineTo(...P(0.47, 0.55)).lineTo(...P(0.89, 0.2)).stroke();
  } else if (name === 'instagram') {
    doc.roundedRect(...P(0, 0), s, s, s * 0.24).stroke();
    doc.circle(cx, cy, s * 0.17).stroke();
    doc.circle(...P(0.72, 0.24), s * 0.03).fillColor(CMYK.cyan).fill();
  } else if (name === 'linkedin') {
    doc.roundedRect(...P(0, 0), s, s, s * 0.1).stroke();
    doc.moveTo(...P(0.18, 0.42)).lineTo(...P(0.18, 0.83)).stroke();
    doc.circle(...P(0.18, 0.28), s * 0.045).fillColor(CMYK.cyan).fill();
    doc
      .moveTo(...P(0.42, 0.83))
      .lineTo(...P(0.42, 0.5))
      .bezierCurveTo(...P(0.42, 0.36), ...P(0.66, 0.36), ...P(0.66, 0.5))
      .lineTo(...P(0.66, 0.83))
      .stroke();
    doc.moveTo(...P(0.42, 0.42)).lineTo(...P(0.42, 0.83)).stroke();
  }
  doc.restore();
}

function drawBack(doc, qr) {
  drawBackground(doc);
  drawGlow(doc, -3, CARD_H + 4, CMYK.cyan);
  drawGrid(doc);

  // ---- contacts column ----
  const colX = safeX;
  const eyebrowMm = 1.9;
  const rowD = 5.6;
  const rowGap = 2.4;
  const rows = [
    { icon: 'globe', text: 'samuelsulo.it', primary: true },
    { icon: 'mail', text: 'work.samuelsulo@gmail.com' },
    { icon: 'instagram', text: '@samuelsulo' },
    { icon: 'linkedin', text: '/in/work-samuelsulo' },
  ];
  const stackH = eyebrowMm * 1.3 + 1 + rows.length * rowD + (rows.length - 1) * rowGap;
  let y = safeY + (safeH - stackH) / 2;

  doc
    .font('Mono-Medium')
    .fontSize(mm(eyebrowMm))
    .fillColor(CMYK.cyan)
    .text('GET IN TOUCH', mm(colX), mm(y), {
      characterSpacing: mm(eyebrowMm) * 0.16,
      lineBreak: false,
    });
  y += eyebrowMm * 1.3 + 1;

  for (const row of rows) {
    const cx = colX + rowD / 2;
    const cy = y + rowD / 2;
    drawIconCircle(doc, cx, cy, rowD, () => {});
    drawIconGlyph(doc, row.icon, mm(cx), mm(cy), mm(rowD * 0.5));
    doc
      .font('Mono')
      .fontSize(mm(2.35))
      .fillColor(row.primary ? CMYK.textLight : CMYK.textMuted)
      .text(row.text, mm(colX + rowD + 2.2), mm(cy) - mm(2.35) * 0.72, {
        width: mm(safeW - rowD - 2.2),
        lineBreak: false,
      });
    y += rowD + rowGap;
  }

  // ---- QR column ----
  const frameSize = 29.8;
  const captionMm = 1.7;
  const qrColH = frameSize + 2 + captionMm * 1.3;
  const frameX = safeX + safeW - frameSize;
  const frameY = safeY + (safeH - qrColH) / 2;

  doc
    .roundedRect(mm(frameX), mm(frameY), mm(frameSize), mm(frameSize), mm(2.6))
    .fillColor(CMYK.bg)
    .fill();
  doc
    .roundedRect(mm(frameX), mm(frameY), mm(frameSize), mm(frameSize), mm(2.6))
    .lineWidth(mm(0.22))
    .strokeColor(CMYK.border)
    .stroke();

  const pad = 2.4;
  const qrSize = frameSize - pad * 2;
  const mod = qrSize / qr.size;
  doc.fillColor(CMYK.textLight);
  for (let r = 0; r < qr.size; r++) {
    for (let c = 0; c < qr.size; c++) {
      if (qr.matrix[r][c]) {
        doc.rect(
          mm(frameX + pad + c * mod),
          mm(frameY + pad + r * mod),
          mm(mod) + 0.4,
          mm(mod) + 0.4,
        );
      }
    }
  }
  doc.fill();

  doc
    .font('Mono-Medium')
    .fontSize(mm(captionMm))
    .fillColor(CMYK.cyan)
    .text('SCAN → PORTFOLIO', mm(frameX), mm(frameY + frameSize + 2), {
      width: mm(frameSize),
      align: 'center',
      characterSpacing: mm(captionMm) * 0.14,
      lineBreak: false,
    });
}

function drawFox(doc, x, y, sizeMm = 5.3, opacity = 0.92, { badge = true } = {}) {
  // Same low-poly facets as SignatureFox.vue, translated to CMYK and
  // scaled to sizeMm (viewBox 100x100 -> sizeMm). `badge: false` skips the
  // circular backdrop, for use inside a badge that already draws its own
  // (glowing) ring, e.g. the front's top-left mark.
  const s = sizeMm / 100;
  const P = (px, py) => [mm(x + px * s), mm(y + py * s)];
  doc.save();
  doc.opacity(opacity);

  if (badge) {
    doc.circle(...P(50, 52), mm(44 * s)).fillColor(CMYK.bg).fill();
    doc.circle(...P(50, 52), mm(44 * s)).lineWidth(mm(0.14)).strokeColor(CMYK.cyan).strokeOpacity(0.35).stroke();
  }

  const poly = (pts, color) => {
    doc.moveTo(...P(pts[0][0], pts[0][1]));
    for (let i = 1; i < pts.length; i++) doc.lineTo(...P(pts[i][0], pts[i][1]));
    doc.closePath().fillColor(color).fill();
  };

  poly(
    [
      [22, 22],
      [27, 46],
      [41, 40],
    ],
    CMYK.cyanStrong,
  );
  poly(
    [
      [78, 22],
      [73, 46],
      [59, 40],
    ],
    CMYK.purple,
  );
  poly(
    [
      [41, 40],
      [50, 30],
      [59, 40],
      [50, 55],
    ],
    CMYK.cyan,
  );
  poly(
    [
      [27, 46],
      [41, 40],
      [50, 55],
      [38, 78],
      [24, 60],
    ],
    CMYK.cyan,
  );
  poly(
    [
      [73, 46],
      [59, 40],
      [50, 55],
      [62, 78],
      [76, 60],
    ],
    CMYK.purple,
  );
  poly(
    [
      [50, 55],
      [38, 78],
      [50, 86],
      [62, 78],
    ],
    CMYK.cyanStrong,
  );
  poly(
    [
      [46, 80],
      [54, 80],
      [50, 88],
    ],
    CMYK.success,
  );

  doc.restore();
}

function newDoc() {
  const doc = new PDFDocument({
    size: [mm(CARD_W), mm(CARD_H)],
    margins: { top: 0, left: 0, right: 0, bottom: 0 },
    info: {
      Title: 'Samuel Sulo - Business Card',
      Author: 'Samuel Sulo',
      Subject: 'Business card, print-ready (91x61mm bleed / 85x55mm trim)',
    },
  });
  // PDF/X-ish intent: explicit CMYK color throughout, no ICC profile
  // embedding available in PDFKit, so print shops should still soft-proof.
  registerFonts(doc);
  return doc;
}

function main() {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  const qr = JSON.parse(fs.readFileSync(path.join(__dirname, 'qr-matrix.json'), 'utf8'));

  // front.pdf
  {
    const doc = newDoc();
    doc.pipe(fs.createWriteStream(path.join(OUT, 'business-card-front.pdf')));
    drawFront(doc);
    doc.end();
  }

  // back.pdf
  {
    const doc = newDoc();
    doc.pipe(fs.createWriteStream(path.join(OUT, 'business-card-back.pdf')));
    drawBack(doc, qr);
    doc.end();
  }

  // combined.pdf (front, then back)
  {
    const doc = newDoc();
    doc.pipe(fs.createWriteStream(path.join(OUT, 'business-card-print-ready.pdf')));
    drawFront(doc);
    doc.addPage({ size: [mm(CARD_W), mm(CARD_H)], margins: { top: 0, left: 0, right: 0, bottom: 0 } });
    drawBack(doc, qr);
    doc.end();
  }

  console.log('PDFs written to', OUT);
}

main();

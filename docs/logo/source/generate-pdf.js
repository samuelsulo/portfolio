// Brand guidelines PDF for the Kitsune personal brand mark.
// Pure vector output (PDFKit), built directly from the same geometry and
// colorway data as build-svgs.js (see palette.js), so the PDF documents the
// mark exactly as implemented, not a redrawn interpretation.
'use strict';

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { VIEWBOX, BADGE, FACETS, COLORWAYS, CURRENT_COLOR } = require('./palette');

const OUT = path.resolve(__dirname, '..');
const OUT_FILE = path.join(OUT, 'brand-guidelines.pdf');

// Also published as a static site asset, linked directly (opened in a new
// tab) from the footer's "Brand guidelines" link (see AppFooter.vue).
// Copied straight from OUT_FILE below rather than generated twice, so the
// two can never drift apart.
const SITE_COPY = path.resolve(__dirname, '../../../website/public/brand/kitsune-brand-guidelines.pdf');

const PAGE = { size: 'A4', margin: 50 };
const PAGE_W = 595.28;
const PAGE_H = 841.89;

const INK = {
  bg: '#0a0b12',
  panelDark: '#05060a',
  panelLight: '#ffffff',
  text: '#111318',
  textMuted: '#5a5f6e',
  border: '#d8d9e2',
  cyan: '#35e6ff',
};

function byId(id) {
  const c = COLORWAYS.find((x) => x.id === id);
  if (!c) throw new Error('unknown colorway ' + id);
  return c;
}

// Map viewBox coordinates (0..100) into a box in PDF points.
function mapper(x, y, size) {
  const s = size / VIEWBOX.w;
  return (px, py) => [x + px * s, y + py * s];
}

function drawMark(doc, { x, y, size, colorway, opacity = 1 }) {
  const P = mapper(x, y, size);
  const s = size / VIEWBOX.w;
  doc.save();
  doc.opacity(opacity);

  if (colorway.badge) {
    doc
      .circle(...P(BADGE.cx, BADGE.cy), BADGE.r * s)
      .fillColor(rgbaFill(colorway.badgeFill))
      .fillOpacity(rgbaAlpha(colorway.badgeFill))
      .fill();
    doc
      .circle(...P(BADGE.cx, BADGE.cy), BADGE.r * s)
      .lineWidth(BADGE.strokeWidth * s)
      .strokeColor(rgbaFill(colorway.badgeBorder))
      .strokeOpacity(rgbaAlpha(colorway.badgeBorder))
      .stroke();
    doc.fillOpacity(1);
  }

  for (const facet of FACETS) {
    doc.moveTo(...P(facet.points[0][0], facet.points[0][1]));
    for (let i = 1; i < facet.points.length; i++) doc.lineTo(...P(facet.points[i][0], facet.points[i][1]));
    doc.closePath().fillColor(colorway.colors[facet.role]).fill();
  }
  doc.restore();
}

function drawMarkCurrentColor(doc, { x, y, size, color }) {
  const P = mapper(x, y, size);
  doc.save();
  for (const facet of FACETS) {
    const op = CURRENT_COLOR.opacities[facet.name];
    doc.moveTo(...P(facet.points[0][0], facet.points[0][1]));
    for (let i = 1; i < facet.points.length; i++) doc.lineTo(...P(facet.points[i][0], facet.points[i][1]));
    doc.closePath().fillColor(color).fillOpacity(op).fill();
  }
  doc.restore();
}

// PDFKit fill/strokeColor doesn't parse rgba(); pull out r,g,b and set
// opacity separately via fillOpacity/strokeOpacity where the caller needs it.
// Here we bake the alpha into a flattened hex-ish approach: PDFKit *does*
// accept an [r,g,b] array plus a separate opacity call, so parse manually.
function rgbaFill(cssRgba) {
  if (!cssRgba || cssRgba === 'none') return '#000000';
  const m = cssRgba.match(/rgba?\(([^)]+)\)/);
  if (!m) return cssRgba; // already a hex string
  const parts = m[1].split(',').map((v) => parseFloat(v.trim()));
  const [r, g, b] = parts;
  return [r, g, b];
}

function rgbaAlpha(cssRgba) {
  const m = cssRgba && cssRgba.match(/rgba?\(([^)]+)\)/);
  if (!m) return 1;
  const parts = m[1].split(',').map((v) => parseFloat(v.trim()));
  return parts.length > 3 ? parts[3] : 1;
}

function heading(doc, text, y) {
  doc.font('Helvetica-Bold').fontSize(20).fillColor(INK.text).text(text, PAGE.margin, y);
  return doc.y;
}

function eyebrow(doc, text, y) {
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(INK.cyan)
    .text(text.toUpperCase(), PAGE.margin, y, { characterSpacing: 1.2 });
  return doc.y;
}

function paragraph(doc, text, x, y, width, opts = {}) {
  doc
    .font('Helvetica')
    .fontSize(10.5)
    .fillColor(opts.color || INK.textMuted)
    .text(text, x, y, { width, lineGap: 3, ...opts });
  return doc.y;
}

function footer(doc, pageLabel) {
  // Written low in the page's bottom margin. PDFKit auto-inserts a page
  // break for any .text() call whose y falls beyond page.maxY() (page
  // height minus the bottom margin), so the document's bottom margin is
  // kept small (see PDFDocument options below) specifically so this call
  // lands inside the writable area instead of spilling onto a blank page.
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(INK.textMuted)
    .text(`Kitsune - brand guidelines   ·   © 2026 Samuel Sulo   ·   ${pageLabel}`, PAGE.margin, PAGE_H - 36, {
      width: PAGE_W - PAGE.margin * 2,
      align: 'center',
      lineBreak: false,
    });
}

function swatch(doc, x, y, hexOrRgb, w = 16, h = 16) {
  doc.roundedRect(x, y, w, h, 3).fillColor(hexOrRgb).fill();
  doc.roundedRect(x, y, w, h, 3).lineWidth(0.75).strokeColor(INK.border).stroke();
}

function hexToRgbString(hex) {
  const n = hex.replace('#', '');
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

function colorRow(doc, x, y, role, hex) {
  swatch(doc, x, y, hex);
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(INK.text).text(role, x + 24, y + 1);
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(INK.textMuted)
    .text(`${hex.toUpperCase()}   ${hexToRgbString(hex)}`, x + 24, y + 13);
}

function panel(doc, x, y, w, h, fill) {
  doc.rect(x, y, w, h).fillColor(fill).fill();
}

function main() {
  const doc = new PDFDocument({
    size: PAGE.size,
    margins: { top: 60, left: PAGE.margin, right: PAGE.margin, bottom: 26 },
    bufferPages: true,
    info: {
      Title: 'Kitsune - Brand Guidelines',
      Author: 'Samuel Sulo',
      Subject: 'Brand guidelines for the Kitsune personal brand mark: geometry, proportions and documented color variants',
      Keywords: 'Kitsune, personal logo, brand mark, brand guidelines',
    },
  });
  const writeStream = fs.createWriteStream(OUT_FILE);
  doc.pipe(writeStream);

  const ref = byId('reference');
  const darkPf = byId('dark-portfolio');
  const lightP = byId('light-proposed');
  const markOnly = byId('mark-only');

  // ---------------------------------------------------------------- PAGE 1: cover
  panel(doc, 0, 0, PAGE_W, PAGE_H, INK.panelDark);
  const markSize = 220;
  drawMark(doc, { x: (PAGE_W - markSize) / 2, y: 150, size: markSize, colorway: ref });

  doc
    .font('Helvetica-Bold')
    .fontSize(34)
    .fillColor('#ffffff')
    .text('Kitsune', 0, 420, { width: PAGE_W, align: 'center' });
  doc
    .font('Helvetica')
    .fontSize(13)
    .fillColor('#a3a9bd')
    .text('Personal logo - brand guidelines', 0, 462, { width: PAGE_W, align: 'center' });

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#6b7186')
    .text('Creator: Samuel Sulo   ·   Copyright: © 2026 Samuel Sulo   ·   Asset: Personal Logo', 0, PAGE_H - 90, {
      width: PAGE_W,
      align: 'center',
    });
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor('#4a4f5c')
    .text('This document is a set of brand guidelines, not a trademark registration or legal certification.', 0, PAGE_H - 74, {
      width: PAGE_W,
      align: 'center',
    });

  // ---------------------------------------------------------------- PAGE 2: what it is
  doc.addPage();
  eyebrow(doc, 'Overview', 60);
  heading(doc, 'What this mark is', 78);
  let y = paragraph(
    doc,
    'Kitsune is an original low-poly fox mark used as a personal signature across the sites, applications and printed material developed by Samuel Sulo. It appears in the portfolio navigation bar and footer, and as a "built by" / "developed by" mark in client projects, wherever the identity of the author of the work needs a quiet, purely decorative signature (no link, no interaction).',
    PAGE.margin,
    108,
    PAGE_W - PAGE.margin * 2,
  );
  y += 14;
  y = paragraph(
    doc,
    'It is implemented as a self-contained Vue component (see component/Kitsune.vue in this documentation folder) whose markup and geometry never change between projects: only its color props do. This lets the same mark adapt to a different site’s theme (light, dark, or a custom palette) while remaining, by design, the same graphic sign. The rest of this document treats the geometry as the fixed design and each coloring as a variant of it, never as a different logo.',
    PAGE.margin,
    y,
    PAGE_W - PAGE.margin * 2,
  );

  y += 30;
  eyebrow(doc, 'Where it is used', y);
  y += 18;
  const uses = [
    'Samuel Sulo’s own portfolio (samuelsulo.it): navigation bar brand mark and footer signature.',
    'Client websites and applications, retinted to the client’s own palette, as an unobtrusive "built by" mark.',
    'Printed material (e.g. the business card, see docs/business-card), promoted to a front badge.',
  ];
  for (const u of uses) {
    doc.circle(PAGE.margin + 3, y + 5, 1.6).fillColor(INK.cyan).fill();
    y = paragraph(doc, u, PAGE.margin + 14, y, PAGE_W - PAGE.margin * 2 - 14) + 8;
  }
  footer(doc, 'Page 2 - Overview');

  // ---------------------------------------------------------------- PAGE 3: geometry
  doc.addPage();
  eyebrow(doc, 'Structure', 60);
  heading(doc, 'Geometry and proportions', 78);
  paragraph(
    doc,
    'The mark is drawn on a square 100 x 100 SVG viewBox, so it is always used at a 1:1 aspect ratio and scales losslessly to any size. Seven flat-shaded polygons (facets) build a low-poly fox head; an optional circular badge (center 50,52; radius 44) frames it. Facet fills are grouped into four color roles, listed below by the same names used in the component’s props.',
    PAGE.margin,
    108,
    PAGE_W - PAGE.margin * 2,
  );

  // Grid + labeled mark
  const gridX = PAGE.margin;
  const gridY = 210;
  const gridSize = 260;
  panel(doc, gridX, gridY, gridSize, gridSize, '#f4f4f8');
  doc.save();
  for (let i = 0; i <= 10; i++) {
    const p = (i / 10) * gridSize;
    doc.moveTo(gridX + p, gridY).lineTo(gridX + p, gridY + gridSize).lineWidth(0.4).strokeColor('#d0d2dc').stroke();
    doc.moveTo(gridX, gridY + p).lineTo(gridX + gridSize, gridY + p).lineWidth(0.4).strokeColor('#d0d2dc').stroke();
  }
  doc.restore();
  drawMark(doc, { x: gridX, y: gridY, size: gridSize, colorway: ref });
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(INK.textMuted)
    .text('viewBox: 0 0 100 100 - 10-unit grid', gridX, gridY + gridSize + 8);

  const notesX = gridX + gridSize + 30;
  const notesW = PAGE_W - PAGE.margin - notesX;
  let ny = gridY;
  const notes = [
    ['Canvas', '100 × 100 units, square (1:1)'],
    ['Badge', 'circle, center (50, 52), radius 44'],
    ['Badge stroke', '1.5 units wide'],
    ['Ears', '2 facets: colorLight (left), colorDark (right)'],
    ['Forehead', '1 facet: colorMid'],
    ['Cheeks', '2 facets: colorMid (left), colorDark (right)'],
    ['Muzzle', '1 facet: colorLight, laid over the cheeks'],
    ['Nose', '1 small facet: colorAccent'],
  ];
  for (const [label, val] of notes) {
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor(INK.text).text(label, notesX, ny, { width: notesW });
    doc.font('Helvetica').fontSize(9).fillColor(INK.textMuted).text(val, notesX, doc.y, { width: notesW });
    ny = doc.y + 8;
  }
  footer(doc, 'Page 3 - Structure');

  // ---------------------------------------------------------------- PAGE 4: color roles / dark
  doc.addPage();
  eyebrow(doc, 'Color', 60);
  heading(doc, 'Color roles and colorways', 78);
  paragraph(
    doc,
    'The mark uses four color roles (colorLight, colorMid, colorDark, colorAccent) plus a badge fill/border pair. A colorway is one concrete assignment of colors to those roles. Changing colorway never changes the geometry above: it is the same sign, differently colored. Two colorways below are implemented and verified against the current code; a third is a proposed adaptation, clearly marked as such.',
    PAGE.margin,
    108,
    PAGE_W - PAGE.margin * 2,
  );

  function colorwaySection(doc, cw, y0, bgPanel) {
    const boxX = PAGE.margin;
    const boxW = PAGE_W - PAGE.margin * 2;
    const boxH = 150;
    panel(doc, boxX, y0, boxW, boxH, bgPanel);
    doc.roundedRect(boxX, y0, boxW, boxH, 4).lineWidth(0.75).strokeColor(INK.border).stroke();
    drawMark(doc, { x: boxX + 24, y: y0 + 20, size: 110, colorway: cw });

    const infoX = boxX + 24 + 110 + 30;
    const infoW = boxX + boxW - 20 - infoX;
    let iy = y0 + 20;
    doc.font('Helvetica-Bold').fontSize(12).fillColor(bgPanel === INK.panelDark ? '#ffffff' : INK.text).text(cw.title, infoX, iy, { width: infoW });
    iy = doc.y + 4;
    doc
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor(bgPanel === INK.panelDark ? '#8f97ad' : INK.textMuted)
      .text(cw.status, infoX, iy, { width: infoW });
    iy = doc.y + 8;

    const roles = ['colorLight', 'colorMid', 'colorDark', 'colorAccent'];
    let cx = infoX;
    for (const role of roles) {
      const hex = cw.colors[role];
      swatch(doc, cx, iy, hex, 30, 14);
      doc
        .font('Helvetica')
        .fontSize(6.5)
        .fillColor(bgPanel === INK.panelDark ? '#8f97ad' : INK.textMuted)
        .text(hex.toUpperCase(), cx, iy + 16, { width: 60 });
      cx += 70;
    }
    return y0 + boxH + 20;
  }

  y = 210;
  y = colorwaySection(doc, ref, y, INK.panelDark);
  y = colorwaySection(doc, darkPf, y, INK.panelDark);
  footer(doc, 'Page 4 - Color: dark-background colorways');

  // ---------------------------------------------------------------- PAGE 5: light + mark-only + currentColor
  doc.addPage();
  eyebrow(doc, 'Color', 60);
  heading(doc, 'Light background, structural and dynamic variants', 78);
  paragraph(
    doc,
    'No project currently displays Kitsune on a light background; the variant below is a proposed adaptation, provided as a starting point should one be needed, and is explicitly not a verified, shipped colorway.',
    PAGE.margin,
    108,
    PAGE_W - PAGE.margin * 2,
  );
  y = 150;
  y = colorwaySection(doc, lightP, y, INK.panelLight);

  paragraph(
    doc,
    'The badge backdrop is optional: setting badgeFill="none" renders the mark alone, useful where a surrounding UI element (button, avatar frame) already provides its own backdrop.',
    PAGE.margin,
    y + 4,
    PAGE_W - PAGE.margin * 2,
  );
  y = doc.y + 16;
  const moBoxH = 130;
  panel(doc, PAGE.margin, y, PAGE_W - PAGE.margin * 2, moBoxH, INK.panelDark);
  doc.roundedRect(PAGE.margin, y, PAGE_W - PAGE.margin * 2, moBoxH, 4).lineWidth(0.75).strokeColor(INK.border).stroke();
  drawMark(doc, { x: PAGE.margin + 24, y: y + 15, size: 100, colorway: markOnly });
  drawMarkCurrentColor(doc, { x: PAGE.margin + 24 + 100 + 60, y: y + 15, size: 100, color: INK.cyan });
  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor('#8f97ad')
    .text('Mark only (badgeFill="none")', PAGE.margin + 24, y + moBoxH - 18, { width: 140 });
  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor('#8f97ad')
    .text('currentColor variant (facets by fill-opacity)', PAGE.margin + 24 + 100 + 60, y + moBoxH - 18, { width: 180 });
  footer(doc, 'Page 5 - Color: light background and dynamic variants');

  // ---------------------------------------------------------------- PAGE 6: usage rules
  doc.addPage();
  eyebrow(doc, 'Guidelines', 60);
  heading(doc, 'Usage rules', 78);
  const rules = [
    ['Keep the aspect ratio', 'Always scale the 100 × 100 viewBox uniformly. Never stretch it non-uniformly.'],
    ['Do not distort the geometry', 'The facets, their points and the badge radius are fixed. Do not add, remove or reshape them.'],
    ['Recolor through the documented roles only', 'Retint via colorLight / colorMid / colorDark / colorAccent (and badgeFill / badgeBorder), matching one of the colorways in this document or a new one recorded the same way. Do not recolor individual facets ad hoc.'],
    ['Pick the variant that fits the background', 'Use a dark-background colorway (reference or portfolio) on dark surfaces, the light-background variant on light surfaces, or the currentColor variant when the mark should simply inherit the surrounding text color.'],
    ['Minimum size', 'Below roughly 20px the facets and the nose accent lose legibility; prefer the mark-only variant (no badge) at very small sizes.'],
    ['Clear space', 'Leave at least the badge’s own margin (the gap between the fox’s facets and the badge ring) clear of surrounding text or UI chrome.'],
    ['It is a signature, not a button', 'No link, no interactive affordance beyond the resting/hover opacity change already built into the component.'],
  ];
  y = 108;
  for (const [label, val] of rules) {
    doc.font('Helvetica-Bold').fontSize(10.5).fillColor(INK.text).text('• ' + label, PAGE.margin, y, { width: PAGE_W - PAGE.margin * 2 });
    y = paragraph(doc, val, PAGE.margin + 14, doc.y + 2, PAGE_W - PAGE.margin * 2 - 14) + 10;
  }
  footer(doc, 'Page 6 - Guidelines');

  // ---------------------------------------------------------------- PAGE 7: copyright
  doc.addPage();
  panel(doc, 0, 0, PAGE_W, PAGE_H, INK.panelDark);
  drawMark(doc, { x: (PAGE_W - 90) / 2, y: 90, size: 90, colorway: ref, opacity: 0.9 });
  eyebrowCentered(doc, 'Ownership', 210);
  doc
    .font('Helvetica-Bold')
    .fontSize(18)
    .fillColor('#ffffff')
    .text('Copyright', 0, 230, { width: PAGE_W, align: 'center' });

  const copy = [
    '© 2026 Samuel Sulo.',
    '',
    'The Kitsune mark, its graphic design, visual structure, and the color variants documented here are original creative assets associated with Samuel Sulo.',
    '',
    'Unauthorized reproduction, redistribution, modification, or use as a personal or commercial identity is not permitted without authorization.',
    '',
    'This statement declares authorship and sets terms for authorized use; it is not a trademark registration or a legal certification.',
  ];
  let cy = 270;
  for (const line of copy) {
    doc
      .font(line.startsWith('This statement') ? 'Helvetica-Oblique' : 'Helvetica')
      .fontSize(10.5)
      .fillColor('#c7cbdb')
      .text(line, PAGE_W / 2 - 190, cy, { width: 380, align: 'center', lineGap: 4 });
    cy = doc.y + (line === '' ? 4 : 10);
  }
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor('#6b7186')
    .text('See docs/logo/README.md and docs/logo/versions/ for the full design and naming history.', 0, PAGE_H - 60, {
      width: PAGE_W,
      align: 'center',
    });

  doc.end();
  writeStream.on('finish', () => {
    console.log('PDF written to', OUT_FILE);
    fs.mkdirSync(path.dirname(SITE_COPY), { recursive: true });
    fs.copyFileSync(OUT_FILE, SITE_COPY);
    console.log('Copied to', SITE_COPY);
  });
}

function eyebrowCentered(doc, text, y) {
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(INK.cyan)
    .text(text.toUpperCase(), 0, y, { width: PAGE_W, align: 'center', characterSpacing: 1.2 });
}

main();

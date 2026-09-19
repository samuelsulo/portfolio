// Regenerates docs/logo/assets/*.svg from the geometry and colorways in
// palette.js. Run with: node build-svgs.js
'use strict';

const fs = require('fs');
const path = require('path');
const { VIEWBOX, BADGE, FACETS, COLORWAYS, CURRENT_COLOR } = require('./palette');

const OUT = path.resolve(__dirname, '../assets');

const COPYRIGHT = '© 2026 Samuel Sulo';
const CREATOR = 'Samuel Sulo';

function metadataComment(title) {
  return `<!--
  ${title}
  Creator: ${CREATOR}
  Copyright: ${COPYRIGHT}
  Asset: Personal Logo (docs/logo)
  Source geometry: website/src/components/ui/Kitsune.vue
-->`;
}

function polygon(points, attrs) {
  const pts = points.map(([x, y]) => `${x},${y}`).join(' ');
  return `      <polygon points="${pts}" ${attrs} />`;
}

function svgWrapper({ title, desc, metadataTitle, body }) {
  return `${metadataComment(metadataTitle)}
<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="${VIEWBOX.x} ${VIEWBOX.y} ${VIEWBOX.w} ${VIEWBOX.h}"
  role="img"
>
  <title>${title}</title>
  <desc>${desc}</desc>
  <metadata>Creator: ${CREATOR}; Copyright: ${COPYRIGHT}; Asset: Personal Logo</metadata>
${body}
</svg>
`;
}

function buildColorway(cw) {
  const lines = [];
  if (cw.badge) {
    lines.push(
      `      <circle cx="${BADGE.cx}" cy="${BADGE.cy}" r="${BADGE.r}" fill="${cw.badgeFill}" stroke="${cw.badgeBorder}" stroke-width="${BADGE.strokeWidth}" />`,
    );
  }
  for (const facet of FACETS) {
    lines.push(polygon(facet.points, `fill="${cw.colors[facet.role]}"`));
  }
  return svgWrapper({
    title: cw.title,
    desc: `${cw.status}. ${cw.source}`,
    metadataTitle: cw.title,
    body: lines.join('\n'),
  });
}

function buildCurrentColor(cc) {
  const lines = [];
  for (const facet of FACETS) {
    const opacity = cc.opacities[facet.name];
    lines.push(polygon(facet.points, `fill="currentColor" fill-opacity="${opacity}"`));
  }
  return svgWrapper({
    title: cc.title,
    desc: `${cc.status}. Inherits color from the surrounding context via currentColor; facets are distinguished by fill-opacity only, so any single foreground color reproduces the mark's shading.`,
    metadataTitle: cc.title,
    body: lines.join('\n'),
  });
}

function main() {
  fs.mkdirSync(OUT, { recursive: true });

  for (const cw of COLORWAYS) {
    const svg = buildColorway(cw);
    fs.writeFileSync(path.join(OUT, `${cw.file}.svg`), svg, 'utf8');
    console.log('wrote', cw.file + '.svg');
  }

  const cc = buildCurrentColor(CURRENT_COLOR);
  fs.writeFileSync(path.join(OUT, `${CURRENT_COLOR.file}.svg`), cc, 'utf8');
  console.log('wrote', CURRENT_COLOR.file + '.svg');
}

main();

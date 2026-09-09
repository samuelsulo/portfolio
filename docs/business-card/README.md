# Business card

Print-ready business card design, built directly on the portfolio's own
design tokens (`website/src/styles/tokens.css`): the same near-black
surfaces, cyan/purple neon accents, Space Grotesk and JetBrains Mono
pairing, glow treatment, and the site footer's low-poly SignatureFox mark,
here promoted to the front's badge. The goal is that the card reads as the
portfolio translated into a physical object, not a generic developer
business card.

See [CHANGELOG.md](./CHANGELOG.md) for the version history.

## What is here

```
docs/business-card/
├── source/     editable source: HTML/CSS + generation scripts
└── export/     print-ready and preview files, generated from source/
```

### source/

- `front.html`, `back.html`: the actual card designs, plain HTML/CSS at
  true physical size (`89mm x 59mm`, CSS mm units). Open either directly
  in a browser to view or edit them; no build step is required for basic
  edits (text, colors, spacing).
- `back.template.html`: same as `back.html` but with a `__QR_SVG__`
  placeholder instead of the embedded QR code markup. Edit this file (not
  `back.html`) if you touch anything back-side, then rebuild (see below).
- `shared.css`: design tokens and card shell, copied from the portfolio's
  `tokens.css` (colors, radii, glow) and adapted with `@font-face` rules
  pointing at `fonts/`.
- `fonts/`: Space Grotesk and JetBrains Mono, static TTF weights (the
  portfolio itself uses the variable-font builds via `@fontsource-variable`
  for the web; a print PDF needs concrete outlines, so static weights are
  vendored here instead).
- `mockup.html`: front and back side by side, for a presentation screenshot.
- `qr-matrix.json`: the QR code's module grid, currently encoding
  `https://samuelsulo.it`.
- `generate-qr.js`, `build-back.js`, `render-previews.js`,
  `render-mockup.js`, `generate-pdf.js`: the regeneration pipeline (see
  below).

### export/

- `business-card-front.pdf`, `business-card-back.pdf`: single-page,
  print-ready PDFs, one per side.
- `business-card-print-ready.pdf`: both sides combined, front on page 1,
  back on page 2. This is the file to send to a printing service unless
  they explicitly ask for front/back as separate files.
- `business-card-front-preview.png`, `business-card-back-preview.png`:
  high-resolution (300 DPI) screen previews of each side.
- `business-card-mockup.png`: both sides side by side, for a quick visual
  reference.
- `qa-front-guides.png`, `qa-back-guides.png`: the same previews with the
  trim line and safe-area boundary overlaid, kept for reference only (not
  for print or presentation).

## Print specification

- Finished (trim) size: **85 x 55 mm**.
- Bleed: **2 mm** on every edge, so the artboard is **89 x 59 mm** (matches
  Pixartprinting's exact template for this product). All background art
  (the near-black fill, grid texture, glow) extends to the full artboard
  edge.
- Safe area: all text, the monogram, the QR code and the icons sit at
  least **4.5 mm inside the trim line** (6.5 mm from the artboard edge),
  comfortably inside Pixartprinting's required 3 mm minimum.
- Color: the PDFs in `export/` use true `DeviceCMYK` fills throughout, not
  RGB converted at export time. The near-black background uses a
  hand-tuned "rich black" recipe (C60 M45 Y35 K100) rather than a flat
  K-only black, which is standard practice for a large solid dark area in
  offset print. The neon cyan and purple are approximated with their
  closest CMYK equivalents; process CMYK printing cannot reproduce an
  actual glow, so they render as a strong, saturated cyan/violet rather
  than literally luminous. No ICC profile is embedded (the toolchain used
  to build this doesn't support it), so as with any CMYK file, do a quick
  soft-proof with the print shop before a full run, especially if they
  use a specific paper/profile combination.
- Resolution: the PDFs are vector (fonts and shapes, not a raster image),
  so they are resolution-independent. The PNG previews are rasterized at
  a true 300 DPI for the full 89 x 59 mm artboard (1050 x 697 px).

## QR code

Encodes `https://samuelsulo.it` at error-correction level M, rendered as
crisp 1mm modules (25 x 25 modules for this URL) with a generous quiet
zone inside its rounded frame. It uses light modules on a dark frame to
stay consistent with the card's dark theme; contrast and quiet zone were
kept well above typical scan thresholds specifically because of that
inversion. It has been round-tripped and verified: decoded correctly both
from the 300 DPI PNG render and from a raster of the actual print PDF.

## Placeholder contact info

Pulled from the portfolio's own `website/src/data/site-config.json` where
available:

- Website: `samuelsulo.it` (real)
- Email: `work.samuelsulo@gmail.com` (real, from site config)
- Phone: `+39 345 955 1342` (real)
- LinkedIn: `/in/work-samuelsulo` (real, from site config)

## Regenerating the deliverables

If you change the QR target, the contact info, or any layout detail:

```
cd docs/business-card/source
npm install
npm run build
```

This runs the full pipeline in order: rebuilds `back.html` from
`back.template.html` and `qr-matrix.json`, re-renders the PNG previews and
mockup with headless Chromium, and regenerates the three PDFs into
`export/`. Individual steps are also available as separate npm scripts
(`npm run qr`, `build:back`, `preview`, `mockup`, `pdf`); see
`source/package.json`.

To point the QR at a different URL first, run
`node generate-qr.js https://example.com` before `npm run build`.

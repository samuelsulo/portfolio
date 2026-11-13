# Samuel Sulo - palette

The colors of the brand, defined once in [`samuelsulo-palette.json`](./samuelsulo-palette.json).
The logo, the manual and the business card read them from this file. The
portfolio uses the same values as design tokens in `apps/web/src/styles/tokens.css`:
a dark theme (neon on near-black) and a light theme with deeper tones.

| Role | Name | HEX | CMYK (print recipe) |
|---|---|---|---|
| Primary, on light surfaces | Deep cyan | `#006D85` | 100 · 35 · 25 · 35 |
| Dark, background | Void | `#05060A` | 60 · 45 · 35 · 100 |
| Accent, on dark | Neon cyan | `#35E6FF` | 70 · 0 · 8 · 0 |
| Light, background | Mist | `#E6EBF3` | 8 · 4 · 2 · 0 |
| Secondary | Neon violet | `#B24BF3` | 60 · 75 · 0 · 0 |

The palette also holds the tones of the Kitsune mark (light cyan, neon green on
dark; strong cyan, deep violet, deep green on light) and the support colors
for text and panels. See [`export/samuelsulo-palette-report.md`](./export/samuelsulo-palette-report.md)
for every value, the contrast matrix and the checks.

Neon cyan on Mist is 1.26:1: never use it for text or lines on light surfaces,
Deep cyan takes its place. Screen neons print duller in CMYK, nothing can change
that: soft-proof with the print shop.

## Index

| File | Description |
|---|---|
| `samuelsulo-palette.json` | The spec, the single source of truth |
| `export/samuelsulo-palette.css` | CSS custom properties |
| `export/samuelsulo-palette.tokens.json` | Design tokens, with the print recipes |
| `export/previews/` | Swatch sheet with HEX, RGB and CMYK |
| `export/samuelsulo-palette-report.md` | Values, ink totals, contrast matrix and checks |

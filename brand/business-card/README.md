# Business card

Print-ready business card of Samuel Sulo, built on the portfolio's own
design: near-black surface, neon cyan and violet accents, Space Grotesk and
JetBrains Mono, a faint grid and a soft glow, and the Kitsune mark on the
front. The card reads as the portfolio translated into a physical object.

The card is defined by a single spec ([`samuelsulo-business-card.json`](./samuelsulo-business-card.json)):
every file in `export/` is generated from it, so change the spec and rebuild
instead of editing the outputs. Format: EU 85 x 55 mm, 2 mm bleed, 4.5 mm safe
margin, CMYK. Colors come from the [palette](../palette/README.md).

- **Front**: the Kitsune mark, the name, the role and the website.
- **Back**: website, email, phone and LinkedIn, and a QR code to `https://samuelsulo.it`.

## Index

| File | Description |
|---|---|
| `samuelsulo-business-card.json` | Card spec, the single source of truth |
| `assets/` | Logo copy used by the spec (from `../logo/export/svg/`) |
| `../fonts/` | Space Grotesk and JetBrains Mono (SIL OFL), shared by every part |
| `export/pdf/samuelsulo-business-card-print-ready.pdf` | Two-page CMYK vector PDF for the printer |
| `export/pdf/samuelsulo-business-card-front.pdf`, `-back.pdf` | Single-side PDFs |
| `export/previews/` | 300 dpi previews and mockup |
| `export/qa/` | Trim and safe guides, for review only, never for print |
| `export/samuelsulo-business-card-verification-report.md` | Automated print checks and final CMYK values |

## Notes for the printer

No ICC profile is embedded: ask the print shop for a soft proof before the
final run. The neon colors print duller and darker than on screen, and the
glow is made of stepped vector discs, because blur does not exist in CMYK.

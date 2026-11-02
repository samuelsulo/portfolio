# Verification report: Samuel Sulo

Format: eu-iso 85 x 55 mm, bleed 2 mm, safe 4.5 mm, color cmyk.

Result: **PASSED**

| Status | Check | Detail |
|---|---|---|
| PASS | print-ready.pdf:pages | 2 page(s). |
| PASS | print-ready.pdf p.1:size | 89.00 x 59.00 mm = 85 x 55 trim + 2 mm bleed. |
| PASS | print-ready.pdf p.1:boxes | TrimBox 85 x 55 mm, bleed 2 mm. |
| PASS | print-ready.pdf p.1:fonts | 3 font(s) embedded: JetBrainsMono-Regular, SpaceGrotesk-Medium, SpaceGrotesk-Bold. |
| PASS | print-ready.pdf p.1:color | CMYK only (15 CMYK operators, 1 gray, no RGB). |
| PASS | print-ready.pdf p.1:ink | total ink within 300%. |
| PASS | print-ready.pdf p.2:size | 89.00 x 59.00 mm = 85 x 55 trim + 2 mm bleed. |
| PASS | print-ready.pdf p.2:boxes | TrimBox 85 x 55 mm, bleed 2 mm. |
| PASS | print-ready.pdf p.2:fonts | 2 font(s) embedded: JetBrainsMono-Medium, JetBrainsMono-Regular. |
| PASS | print-ready.pdf p.2:color | CMYK only (20 CMYK operators, 1 gray, no RGB). |
| PASS | print-ready.pdf p.2:ink | total ink within 300%. |
| PASS | front.pdf:pages | 1 page(s). |
| PASS | front.pdf p.1:size | 89.00 x 59.00 mm = 85 x 55 trim + 2 mm bleed. |
| PASS | front.pdf p.1:boxes | TrimBox 85 x 55 mm, bleed 2 mm. |
| PASS | front.pdf p.1:fonts | 3 font(s) embedded: JetBrainsMono-Regular, SpaceGrotesk-Medium, SpaceGrotesk-Bold. |
| PASS | front.pdf p.1:color | CMYK only (15 CMYK operators, 1 gray, no RGB). |
| PASS | front.pdf p.1:ink | total ink within 300%. |
| PASS | back.pdf:pages | 1 page(s). |
| PASS | back.pdf p.1:size | 89.00 x 59.00 mm = 85 x 55 trim + 2 mm bleed. |
| PASS | back.pdf p.1:boxes | TrimBox 85 x 55 mm, bleed 2 mm. |
| PASS | back.pdf p.1:fonts | 2 font(s) embedded: JetBrainsMono-Medium, JetBrainsMono-Regular. |
| PASS | back.pdf p.1:color | CMYK only (20 CMYK operators, 1 gray, no RGB). |
| PASS | back.pdf p.1:ink | total ink within 300%. |
| PASS | safe-area | all text sits inside the safe area. |
| PASS | layout | no text overflow, no unusable raster images. |
| PASS | front (pdf):bleed | artwork continues into the bleed on all four edges. |
| PASS | back (pdf):bleed | artwork continues into the bleed on all four edges. |
| PASS | back (pdf):qr-site | decoded from the PDF raster: https://samuelsulo.it |
| PASS | front:preview-size | 1051 x 696 px (300 dpi). |
| PASS | back:preview-size | 1051 x 696 px (300 dpi). |
| PASS | back (png):qr-site | decoded from the 300 dpi preview: https://samuelsulo.it |

## Color tokens (final CMYK, percent)

| Token | Hex | C | M | Y | K | Total | Source |
|---|---|---|---|---|---|---|---|
| deep-cyan | #006d85 | 100 | 35 | 25 | 35 | 195 | explicit |
| void | #05060a | 60 | 45 | 35 | 100 | 240 | explicit |
| neon-cyan | #35e6ff | 70 | 0 | 8 | 0 | 78 | explicit |
| mist | #e6ebf3 | 8 | 4 | 2 | 0 | 14 | explicit |
| neon-violet | #b24bf3 | 60 | 75 | 0 | 0 | 135 | explicit |
| neon-cyan-light | #7df3ff | 45 | 0 | 5 | 0 | 50 | explicit |
| neon-green | #45f0a6 | 60 | 0 | 55 | 0 | 115 | explicit |
| deep-cyan-strong | #005568 | 100 | 40 | 30 | 50 | 220 | explicit |
| deep-violet | #7a2bc0 | 75 | 90 | 0 | 0 | 165 | explicit |
| deep-green | #067650 | 85 | 20 | 75 | 25 | 205 | explicit |
| surface | #10131c | 62 | 48 | 38 | 94 | 242 | explicit |
| snow | #e9ebf3 | 8 | 5 | 3 | 0 | 16 | explicit |
| slate | #a3a9bd | 40 | 28 | 15 | 5 | 88 | explicit |
| graphite | #7b8197 | 50 | 38 | 25 | 15 | 128 | explicit |
| ink | #0b1220 | 90 | 75 | 50 | 70 | 285 | explicit |

## Warnings and notes

- WARN [ink-coverage] theme.colors.ink: token "ink" cmyk total 285% is above 280% for a non-black color.
- INFO [text-small] front: text "samuelsulo.it": 6.0 pt is under the recommended 7 pt.
- INFO [text-small] back: text "Get in touch": 6.0 pt is under the recommended 7 pt.
- INFO [text-small] back: text "https://samuelsulo.it": 6.7 pt is under the recommended 7 pt.
- INFO [text-small] back: text "work.samuelsulo@gmail.com": 6.7 pt is under the recommended 7 pt.
- INFO [text-small] back: text "+39 345 955 1342": 6.7 pt is under the recommended 7 pt.
- INFO [text-small] back: text "/in/work-samuelsulo": 6.7 pt is under the recommended 7 pt.
- INFO [text-small] back: text "Scan > portfolio": 6.0 pt is under the recommended 7 pt.
- INFO [qr-inverted] back: qr #site: light-on-dark code (contrast 15.6:1). Verified by decoding, but keep a dark-on-light alternative if the audience uses old scanners.

## Before sending to print

- No ICC profile is embedded unless pdfx and print.icc were set. Ask the print shop for a soft proof, especially for saturated brand colors and dark backgrounds.
- Glows, neon and screen-only colors do not exist in process CMYK; compare the PDF on a calibrated monitor or a printed proof.
- Check the shop template for bleed and safe margins; this file uses the values listed above.
- Crop marks are not included.

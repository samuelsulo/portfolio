# Changelog

All notable changes to the business card design are documented in this
file. Versions are tagged in the repository as `business-card/vX.Y.Z`.

## [1.1.0] - 2026-09-07

### Changed

- Front badge: replaced the "SS" monogram with the SignatureFox mark. The
  name is already spelled out in full right below it, so the badge no
  longer needs to repeat the initials, and the fox reads as a more
  distinctive, ownable mark than initials-in-a-circle.

### Removed

- Back: dropped the SignatureFox mark from under the contact list, where
  it crowded the LinkedIn row.

## [1.0.0] - 2026-09-07

### Added

- First print-ready version of the business card, built on the
  portfolio's own design tokens (near-black surfaces, cyan/purple neon
  accents, Space Grotesk and JetBrains Mono, glow treatment).
- Front: circular "SS" monogram (the navbar's brand mark), name, role,
  and a small `samuelsulo.it` watermark.
- Back: contact rows (website, email, Instagram, LinkedIn) with custom
  line icons, a QR code to `https://samuelsulo.it` in a bordered frame,
  and the SignatureFox mark.
- Print-ready CMYK PDFs (front, back, and combined) at 85x55mm trim /
  91x61mm bleed, with a 4.5mm safe margin from the trim line.
- 300 DPI PNG previews and a side-by-side mockup image.
- Editable HTML/CSS source with a regeneration pipeline (QR, previews,
  mockup, PDFs).

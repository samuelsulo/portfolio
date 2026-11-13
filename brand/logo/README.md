# Kitsune - logo

Kitsune is Samuel Sulo's personal mark: a small, original low-poly fox that
identifies work as his own. It is a signature, not a company logo: purely
decorative, with no link and no action. The wordmark in the lockups is the
name and the descriptor of the portfolio.

The mark is drawn as seven flat facets, each with a tone (light, mid, dark,
accent). The shape never changes between projects or themes: only the colors
do. On dark surfaces the tones are the neon cyan, violet and green; on light
surfaces the same tones deepen. A color variation is a colorway of the same
sign, not a different logo. The full manual is
[`samuelsulo-brand-guidelines.pdf`](../samuelsulo-brand-guidelines.pdf).

The logo is defined by [`samuelsulo-logo.json`](./samuelsulo-logo.json) and the
drawing in [`assets/mark.py`](./assets/mark.py). Every file in `export/` is
generated from them, so change the source and rebuild instead of editing the
outputs. The colors come from the [palette](../palette/README.md) and the fonts
from [`../fonts/`](../fonts).

The mark is implemented in the site as a Vue component, a snapshot of which is
kept in [`component/`](./component), and its history is in
[`versions/`](./versions/README.md).

## Where it is used

- **The portfolio** (`samuelsulo.it`): the navigation bar mark and the footer
  signature, and the "Brand guidelines" link next to it that opens the manual.
  The PDF is published as a static asset at
  `apps/web/public/brand/kitsune-brand-guidelines.pdf`, a copy of the manual
  that must be updated whenever the manual changes.
- **Websites developed for clients**: shipped as a standard component by the
  `vue-webapp-standard` skill, retinted to each client's palette, as a quiet
  "built by" mark and never as the client's own branding.
- **Printed material**: the [business card](../business-card/README.md).

## `export/svg/` and `export/png/`

| File | Use |
|---|---|
| `samuelsulo-logo-horizontal.svg` | Lockup for light backgrounds. |
| `samuelsulo-logo-horizontal-negative.svg` | Lockup for dark backgrounds. |
| `samuelsulo-logo-vertical*.svg` | Same, stacked, for narrow or square spaces. |
| `samuelsulo-symbol*.svg` | The fox alone: the signature, avatars, stamps. |
| `samuelsulo-badge-square.svg`, `-badge-circular.svg`, `-monogram-badge.svg` | App icons and social avatars. |
| `*-mono-black.svg`, `*-mono-white.svg` | One-color printing and engraving: facets are told apart by opacity. |
| `*.png` | Transparent raster exports of every variant. |

**Minimum size.** Symbol alone 8 mm and 32 px; in one color keep it above 12 mm
in print so that the lighter facets do not disappear. **Clear space.** A quarter
of the height of the symbol on every side.

## `export/web/`

Favicons, Apple and PWA icons, the 1200 x 630 social image and the web manifest.
Copy the content of the folder to the site root and paste `head-snippet.html`
inside the `<head>`.

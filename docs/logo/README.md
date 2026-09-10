# Kitsune - personal brand mark

Kitsune is Samuel Sulo's personal logo/signature: a small, original low-poly
fox mark used to identify work as his own. It is implemented as a
self-contained Vue component
([`website/src/components/ui/Kitsune.vue`](../../website/src/components/ui/Kitsune.vue),
snapshot kept in [`component/Kitsune.vue`](component/Kitsune.vue)) and this
folder documents it as a graphic design, independently of any one place it
happens to be displayed.

Until 2026-09-10 the component was named `SignatureFox.vue`; see
[versions/](versions/README.md) for the naming history. Nothing about the
graphic changed with the rename.

## Purpose

- It is a **personal signature/mark**, not a company or product logo: it
  identifies work as built by Samuel Sulo, the way a signature identifies a
  document's author.
- It is purely decorative: no link, no click target, no action beyond a
  resting/hover opacity change. It asks nothing of the visitor; it just
  marks the work.

## Where it is used

- **Samuel Sulo's own portfolio** (`samuelsulo.it`): the navigation bar
  brand mark ([`NavBar.vue`](../../website/src/components/layout/NavBar.vue))
  and the footer signature
  ([`AppFooter.vue`](../../website/src/components/layout/AppFooter.vue)).
- **Websites and applications developed for clients**: shipped as a
  standard component (see the `vue-webapp-standard` skill), retinted to
  each client's own palette, used as an unobtrusive "built by" /
  "developed by" mark rather than as the client's own branding.
- **Printed material**: the [business card](../business-card/README.md)
  promotes it to the front badge.
- Anywhere else a quiet mark of authorship is wanted, in a light, dark, or
  custom-themed context, per the coloring model below.

This document (`logo-design.pdf`) is itself linked from the portfolio: a
"Logo design" link next to the footer signature opens it in an in-page
preview (`website/src/components/ui/LogoDesignModal.vue`), the same modal
pattern used for the Cookie/Privacy Policy. The PDF is published as a static
site asset at `website/public/brand/kitsune-logo-design.pdf`, a byte-for-byte
copy of this folder's `logo-design.pdf` kept in sync by
`source/generate-pdf.js` (see "Regenerating the assets" below); it is not a
separate, hand-maintained copy.

## Graphic structure

The mark is a low-poly fox head, drawn as seven flat-shaded polygons
(facets) inside a square SVG `viewBox="0 0 100 100"`, optionally framed by a
circular badge. See [assets/logo.svg](assets/logo.svg) for the reference
rendering and [logo-design.pdf](logo-design.pdf) (page 3) for an annotated
grid.

| Element | Geometry | Color role |
|---|---|---|
| Badge (optional) | circle, center `(50, 52)`, radius `44`, `1.5`-unit stroke | `badgeFill` / `badgeBorder` |
| Ear, left | polygon `22,22 27,46 41,40` | `colorLight` |
| Ear, right | polygon `78,22 73,46 59,40` | `colorDark` |
| Forehead | polygon `41,40 50,30 59,40 50,55` | `colorMid` |
| Cheek, left | polygon `27,46 41,40 50,55 38,78 24,60` | `colorMid` |
| Cheek, right | polygon `73,46 59,40 50,55 62,78 76,60` | `colorDark` |
| Muzzle (over the cheeks) | polygon `50,55 38,78 50,86 62,78` | `colorLight` |
| Nose | polygon `46,80 54,80 50,88` | `colorAccent` |

The canvas is square, so the mark is always used at a strict **1:1 aspect
ratio**; it scales losslessly to any size. This geometry has not changed
since the component was created (2026-09-03) - see
[versions/](versions/README.md).

## Color variants are not different logos

The component takes every color as a prop (`colorLight`, `colorMid`,
`colorDark`, `colorAccent`, `badgeFill`, `badgeBorder`): the markup and
geometry above never change between projects or themes, only these six
values do. This is a deliberate, load-bearing design decision, not an
accident of implementation, and it is the reason this documentation treats
"the logo" as the geometry above, independent of any single coloring:

> **A color variation is not a different logo.** It is a colorway of the
> same graphic sign. The design is the shape; the color is a parameter of
> where it is displayed.

Two colorways below are **implemented and verified against the current
code**; one is a **proposed adaptation**, not shipped anywhere, offered as a
starting point. A fourth "variant" is not a fixed color at all but a
technique (`currentColor`) for letting the mark inherit whatever color the
surrounding context provides.

### Reference colorway (main asset - [`assets/logo.svg`](assets/logo.svg))

Status: **implemented**, the component's own default prop values.

| Role | Hex | RGB | CSS variable |
|---|---|---|---|
| `colorLight` | `#CDB8FF` | `rgb(205, 184, 255)` | n/a (literal default) |
| `colorMid` | `#A374FF` | `rgb(163, 116, 255)` | n/a |
| `colorDark` | `#7952D1` | `rgb(121, 82, 209)` | n/a |
| `colorAccent` | `#5BE3D9` | `rgb(91, 227, 217)` | n/a |
| `badgeFill` | n/a | `rgba(163, 116, 255, 0.12)` | n/a |
| `badgeBorder` | n/a | `rgba(163, 116, 255, 0.35)` | n/a |

Context: this is the mark's own identity, independent of any host site - a
violet/lavender palette that reads well on a dark background. It is what
you get if you drop the component into a page without passing any color
props, and what the `vue-webapp-standard` skill ships before a project
retints it.

### Portfolio dark-theme variant ([`assets/logo-dark.svg`](assets/logo-dark.svg))

Status: **implemented**, actually used today in `NavBar.vue` and
`AppFooter.vue`.

| Role | Hex | RGB | CSS variable (`website/src/styles/tokens.css`) |
|---|---|---|---|
| `colorLight` | `#7DF3FF` | `rgb(125, 243, 255)` | `--color-neon-primary-strong` |
| `colorMid` | `#35E6FF` | `rgb(53, 230, 255)` | `--color-neon-primary` |
| `colorDark` | `#B24BF3` | `rgb(178, 75, 243)` | `--color-neon-secondary` |
| `colorAccent` | `#45F0A6` | `rgb(69, 240, 166)` | `--color-neon-success` |
| `badgeFill` | n/a | `rgba(53, 230, 255, 0.1)` | derived from `--color-neon-primary-rgb` |
| `badgeBorder` | n/a | `rgba(53, 230, 255, 0.35)` | derived from `--color-neon-primary-rgb` |

Context: the portfolio itself only ships a single, dark "cyberpunk"
theme (no light theme exists in `website/src/styles/`), so this is the dark
variant actually rendered in production, retinted from the reference
colorway to the site's own cyan/purple/green tokens.

### Proposed light-background adaptation ([`assets/logo-light.svg`](assets/logo-light.svg))

Status: **proposed - not implemented in any shipped code.** No project in
this repository currently displays Kitsune on a light background. The
values below were derived for this documentation by darkening the reference
colorway's hues enough to read on white/light surfaces, keeping the same
role structure (lightest → darkest) and hue family. Treat this as a
starting point to evaluate, not a certified deliverable - if it is ever
actually used, verify contrast against the real background it will sit on
and record the confirmed values as a new entry in
[versions/](versions/README.md).

| Role | Hex | RGB |
|---|---|---|
| `colorLight` | `#7C3AED` | `rgb(124, 58, 237)` |
| `colorMid` | `#5B21B6` | `rgb(91, 33, 182)` |
| `colorDark` | `#3B0764` | `rgb(59, 7, 100)` |
| `colorAccent` | `#0D9488` | `rgb(13, 148, 136)` |
| `badgeFill` | n/a | `rgba(91, 33, 182, 0.06)` |
| `badgeBorder` | n/a | `rgba(91, 33, 182, 0.35)` |

### Mark only, no badge ([`assets/logo-mark-only.svg`](assets/logo-mark-only.svg))

Status: **implemented** - an already-supported structural option, not a new
color. Setting `badgeFill="none"` renders the fox alone, for contexts that
already provide their own backdrop (a button, an avatar frame). Shown here
with the reference colorway; any colorway can drop the badge the same way.

### Dynamic / `currentColor` variant ([`assets/logo-currentcolor.svg`](assets/logo-currentcolor.svg))

Status: derived for this documentation to demonstrate the technique, not a
fixed color.

The component's coloring model is fundamentally dynamic - every color is a
prop, commonly passed as a CSS custom property so the mark tracks a host
site's theme automatically (as `NavBar.vue`/`AppFooter.vue` do today with
`var(--color-neon-primary)` etc.). This SVG variant takes that to its
logical conclusion for contexts outside the Vue component: every facet
fills with `currentColor`, and shading between facets comes only from
`fill-opacity`, so a single foreground color (inherited from surrounding
text, or set via CSS `color`) reproduces the mark's full shading:

| Facet | `fill-opacity` |
|---|---|
| Ear, left | `1` |
| Muzzle | `1` |
| Forehead | `0.8` |
| Cheek, left | `0.8` |
| Ear, right | `0.55` |
| Cheek, right | `0.55` |
| Nose | `0.7` |

The badge is omitted in this variant (a `currentColor` badge fill would
compete visually with whatever surrounds it); add one back with a
`stroke="currentColor"` circle at reduced opacity if a specific use case
needs it.

## Files in this folder

```
docs/logo/
├── README.md                    this file
├── logo-design.pdf              design presentation (7 pages: cover,
│                                 overview, geometry, colorways, light/dynamic
│                                 variants, usage rules, copyright)
├── component/
│   ├── Kitsune.vue               read-only snapshot of the live component
│   └── README.md                 what the snapshot is and how it relates
│                                 to the real source
├── assets/
│   ├── logo.svg                  reference colorway (main asset)
│   ├── logo-dark.svg             portfolio dark-theme variant (implemented)
│   ├── logo-light.svg            proposed light-background adaptation
│   ├── logo-mark-only.svg        mark without the badge (badgeFill="none")
│   └── logo-currentcolor.svg     dynamic, currentColor-driven variant
├── source/
│   ├── palette.js                single source of truth: geometry + colorways
│   ├── build-svgs.js             regenerates assets/*.svg from palette.js
│   ├── generate-pdf.js           regenerates logo-design.pdf from palette.js
│   └── package.json              `npm install && npm run build`
└── versions/
    └── README.md                naming/adoption history, from git log
```

Every SVG and the PDF carry the same plain-text metadata (as an SVG comment
and `<metadata>` element, and as PDF document info):

```
Creator: Samuel Sulo
Copyright: © 2026 Samuel Sulo
Asset: Personal Logo
```

## Regenerating the assets

The SVGs and the PDF are generated from one shared geometry/color source
(`source/palette.js`), so they cannot drift apart from each other:

```
cd docs/logo/source
npm install
npm run build   # runs build-svgs.js then generate-pdf.js
```

`generate-pdf.js` also copies the finished PDF to
`website/public/brand/kitsune-logo-design.pdf` once writing finishes, so the
in-site preview always matches this folder's copy; there is nothing to sync
by hand.

Regenerate after editing `palette.js` (e.g. to record a newly-verified
colorway) rather than hand-editing the SVGs or the PDF. If the component's
own geometry ever changes, update the polygon points in `palette.js` (and
in `component/Kitsune.vue`, see [component/README.md](component/README.md))
in the same change, and add an entry to [versions/](versions/README.md).

## Copyright

© 2026 Samuel Sulo.

The logo, its graphic design, visual structure, and documented
color variants are original creative assets associated with
Samuel Sulo.

Unauthorized reproduction, redistribution, modification,
or use as a personal or commercial identity is not permitted
without authorization.

This is a statement of authorship and of the terms under which the mark may
be used, not a trademark registration or a legal certification.

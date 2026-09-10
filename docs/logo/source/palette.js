// Single source of truth for the Kitsune mark's geometry and documented
// colorways, shared by build-svgs.js and generate-pdf.js so the two outputs
// (assets/*.svg and logo-design.pdf) can never drift apart.
//
// Geometry is copied verbatim from the component's <template> (see
// ../component/Kitsune.vue / website/src/components/ui/Kitsune.vue):
// viewBox "0 0 100 100", same polygon point lists, same badge circle.
'use strict';

const VIEWBOX = { x: 0, y: 0, w: 100, h: 100 };

const BADGE = { cx: 50, cy: 52, r: 44, strokeWidth: 1.5 };

// facet name -> polygon points, plus which color role fills it.
const FACETS = [
  { name: 'ear-left', points: [[22, 22], [27, 46], [41, 40]], role: 'colorLight' },
  { name: 'ear-right', points: [[78, 22], [73, 46], [59, 40]], role: 'colorDark' },
  { name: 'forehead', points: [[41, 40], [50, 30], [59, 40], [50, 55]], role: 'colorMid' },
  { name: 'cheek-left', points: [[27, 46], [41, 40], [50, 55], [38, 78], [24, 60]], role: 'colorMid' },
  { name: 'cheek-right', points: [[73, 46], [59, 40], [50, 55], [62, 78], [76, 60]], role: 'colorDark' },
  { name: 'muzzle', points: [[50, 55], [38, 78], [50, 86], [62, 78]], role: 'colorLight' },
  { name: 'nose', points: [[46, 80], [54, 80], [50, 88]], role: 'colorAccent' },
];

// Documented colorways. Each entry states plainly whether it is verified
// against real code (the component's own defaults, or an actual retint used
// in website/src) or a derived/proposed adaptation.
const COLORWAYS = [
  {
    id: 'reference',
    file: 'logo',
    title: 'Kitsune - reference colorway (main asset)',
    status: 'Implemented (component defaults)',
    source: 'Default prop values in Kitsune.vue, unchanged since the component was introduced.',
    colors: {
      colorLight: '#cdb8ff',
      colorMid: '#a374ff',
      colorDark: '#7952d1',
      colorAccent: '#5be3d9',
    },
    badgeFill: 'rgba(163, 116, 255, 0.12)',
    badgeBorder: 'rgba(163, 116, 255, 0.35)',
    badge: true,
    background: '#0c0716',
  },
  {
    id: 'dark-portfolio',
    file: 'logo-dark',
    title: 'Kitsune - portfolio dark-theme variant',
    status: 'Implemented (samuelsulo.it navbar and footer)',
    source: 'website/src/components/layout/NavBar.vue and AppFooter.vue, retinted via props to the site’s own design tokens (website/src/styles/tokens.css).',
    colors: {
      colorLight: '#7df3ff',
      colorMid: '#35e6ff',
      colorDark: '#b24bf3',
      colorAccent: '#45f0a6',
    },
    badgeFill: 'rgba(53, 230, 255, 0.1)',
    badgeBorder: 'rgba(53, 230, 255, 0.35)',
    badge: true,
    background: '#05060a',
  },
  {
    id: 'light-proposed',
    file: 'logo-light',
    title: 'Kitsune - proposed light-background adaptation',
    status: 'Proposed, not implemented in shipped code',
    source: 'Derived for this documentation by darkening the reference colorway’s hues for adequate contrast on a light/white background. No project currently passes these values as props.',
    colors: {
      colorLight: '#7c3aed',
      colorMid: '#5b21b6',
      colorDark: '#3b0764',
      colorAccent: '#0d9488',
    },
    badgeFill: 'rgba(91, 33, 182, 0.06)',
    badgeBorder: 'rgba(91, 33, 182, 0.35)',
    badge: true,
    background: '#ffffff',
  },
  {
    id: 'mark-only',
    file: 'logo-mark-only',
    title: 'Kitsune - mark only (badge omitted)',
    status: 'Implemented (badgeFill="none" prop path)',
    source: 'Same reference colorway, with the badge circle disabled via the component’s own badgeFill="none" prop, an already-supported structural option.',
    colors: {
      colorLight: '#cdb8ff',
      colorMid: '#a374ff',
      colorDark: '#7952d1',
      colorAccent: '#5be3d9',
    },
    badgeFill: 'none',
    badgeBorder: null,
    badge: false,
    background: '#0c0716',
  },
];

// currentColor variant: one dynamic color, facets distinguished by opacity
// only (documented separately from COLORWAYS since it has no fixed hex).
const CURRENT_COLOR = {
  id: 'current-color',
  file: 'logo-currentcolor',
  title: 'Kitsune - monochrome, currentColor-driven variant',
  status: 'Derived for documentation (technique, not a fixed color)',
  opacities: {
    'ear-left': 1,
    'ear-right': 0.55,
    forehead: 0.8,
    'cheek-left': 0.8,
    'cheek-right': 0.55,
    muzzle: 1,
    nose: 0.7,
  },
};

module.exports = { VIEWBOX, BADGE, FACETS, COLORWAYS, CURRENT_COLOR };

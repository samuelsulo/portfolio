# Application

Technical map of [`application/`](../../application). Commands, scripts and the content
editing rules are in its [README](../../application/README.md); this page explains how the
parts fit together.

## Stack

Vue 3 (Composition API, `<script setup>`) with TypeScript in strict mode, built with Vite.
Routing with Vue Router, translations with vue-i18n, plain CSS with shared design tokens (no
CSS framework). Tests: Vitest for units, Playwright for end to end. Quality gates: ESLint,
Prettier and `vue-tsc`.

## Content is separate from the code

The prose, the data files, the images, the CV and the documents are not bundled. They live in
`application/public/` (`content/data/*.json`, `content/locales/{it,en}.json`, `images/`, `cv/`,
`documents/`, `brand/`) and the browser fetches them at startup (`src/content/index.ts`)
before mounting the app.

Consequences:

- A text, a project, a stack item or a certification changes with a content deploy, with no
  application release.
- The two sides agree on a shape, `CONTENT_SCHEMA_VERSION` in the code and `schemaVersion` in
  `site-config.json`. If they differ the app shows a "could not be loaded" message instead
  of a broken page. Change the shape (a new data file, a new required field) and both must be
  bumped together, which forces an application release.

### Data-driven sections

| Section                     | Data                                                      | Texts                   |
| --------------------------- | --------------------------------------------------------- | ----------------------- |
| Work                        | `projects.json`, `cases.json`                             | `projects.*`, `cases.*` |
| Stack                       | `stack.json`                                              | `stack.*`               |
| Certifications              | `certifications.json`, badges in `images/certifications/` | `certifications.*`      |
| Hero, contact, legal values | `site-config.json`                                        | `hero.*`, `legal.*`     |

Each data entry points to its texts through a `translationKey`. A unit test
(`tests/unit/i18n-parity.spec.ts`) fails when a key is missing in one language or a data entry
points to a key that does not exist.

## Contact form

The form calls `POST {VITE_CONTACT_API_URL}/email`. The URL is injected at build time by the
deploy script from the infrastructure outputs. When it is not set, the service returns an
explicit error and the form shows the error state. The backend is described in
[`../architecture/system-architecture.md`](../architecture/system-architecture.md).

## Navigation and scrolling

Sections are reached through hash links handled by the router's `scrollBehavior`. The
navigation bar is sticky and sits above the hero in the page flow, so `#hero` is a special
case that scrolls to the top: lining the hero up with the viewport would slide it under the
bar and cover the portrait. End to end tests (`tests/e2e/scroll.spec.ts`) cover every
section, a direct load of `/#hero` and `/#projects`, and the back button.

## CV

Two PDFs (Italian and English) generated from a single JSON source with `npm run cv`. They
are content: published by the content deploy. See [`application/cv/`](../../application/cv).

## Quality gates

CI on every pull request ([`.github/workflows/`](../../.github/workflows)): lint, format
check, type check, unit tests, build and end to end tests. Locally, `lefthook` checks commits
and `cocogitto` enforces Conventional Commits.

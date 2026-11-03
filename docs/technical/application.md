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
`documents/`, `brand/`) and the browser fetches them (`src/content/index.ts`), what every page needs before mounting
the app and the rest when it is needed (see [Loading and caching](#loading-and-caching)).

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
| Work                        | `projects.json`, `cases/<id>.json`                        | `projects.*`, `cases.*` |
| Stack                       | `stack.json`                                              | `stack.*`               |
| Certifications              | `certifications.json`, badges in `images/certifications/` | `certifications.*`      |
| Hero, contact, legal values | `site-config.json`                                        | `hero.*`, `legal.*`     |

Each data entry points to its texts through a `translationKey`. A unit test
(`tests/unit/i18n-parity.spec.ts`) fails when a key is missing in one language or a data entry
points to a key that does not exist.

## Loading and caching

The rule: nothing is downloaded before it is needed, or likely to be. A visit to the home page
fetches the site configuration, the lists (projects, stack, certifications) and the translations
of the language in use, plus the images in view. Everything else waits:

| What                                   | When it is fetched                                                                                                                                                                              |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The other language                     | When the visitor switches to it (`switchLocale`)                                                                                                                                                |
| The data of a work (`cases/<id>.json`) | When the work is opened, or earlier when a pointer, a focus or a touch rests on its card, or the 3D player walks up to it (`prefetchWork`); the work page code and the first image come with it |
| The images of a work                   | When its viewer shows them (`loading="lazy"`)                                                                                                                                                   |
| The logos of the stack                 | One sprite file (`images/stack/sprite.svg`), when the section is within 600px of the viewport (`useNearViewport`), or when the 3D stack room is entered                                         |
| The 3D engine                          | Only when `/3d` is opened, never preloaded (see below)                                                                                                                                          |
| The images of a 3D room                | The first time the player enters the room; the CV in the language not in use only when the player walks up to it (`isDeferred`)                                                                 |
| The pages of the CV                    | When the CV is opened over the 3D scene                                                                                                                                                         |

Caching is built on versioned URLs. The deploy of the content (`scripts/deploy-content.sh`,
with `scripts/content-manifest.mjs`) writes `content/manifest.json`, a short hash of the bytes of
every published file. The application reads it first (the only file revalidated on every visit)
and requests everything else as `/path?v=<hash>` (`assetUrl`), so:

| Files                                                      | `Cache-Control`                       | Why                                                                                                                    |
| ---------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Build assets (`assets/*`, hashed names)                    | `public, max-age=31536000, immutable` | The name changes with the content                                                                                      |
| `index.html`, `content/manifest.json`                      | `public, max-age=0, must-revalidate`  | They are what points to the current versions                                                                           |
| Content, images, CV, documents, brand                      | `public, max-age=31536000, immutable` | The URL changes when the file does: a year in the browser and at the CloudFront edge, downloaded again only if changed |
| Root files of `public/` (`theme-init.js`, icons, og image) | `public, max-age=86400`               | Their name is fixed, so they cannot be immutable                                                                       |

Without a manifest (the development server, or if it fails to load) the version is the current
hour, so what is cached under those URLs expires within the hour.

CloudFront ignores the query string in its cache key, so a deploy must not show a new version
while an edge still holds the old bytes: they would then stay in browsers for a year. The
deploy therefore publishes the files, invalidates CloudFront and waits for it to complete, and
only then publishes the manifest. Do not reorder those steps. Compression (Brotli and gzip) is
done by CloudFront.

## 3D performance

Checked in Chrome (JavaScript is about 2% of the time, the heap stays near 9 MB and does not
grow over repeated visits) and kept by these rules, in `src/scene3d/`:

- **One room at a time.** Only the room the player is in is drawn, and the textures of the
  others are freed from video memory (`enter`), to be uploaded again if the player returns. The
  resident textures are at most about 18 MB, against 54 MB with every room kept.
- **Few draw calls.** The static parts of the props are merged into one object each (`mergedBoxes`
  in `props.ts`) and the blinking lights of a rack are one instanced mesh: the hub draws about 75
  objects, from 137.
- **A frame budget.** One frame for every refresh of the screen while the visitor plays (so 120
  or 144Hz where the screen has it, the scene is light enough), and 30 a second once there has
  been no input for 8 seconds. The loop stops when the tab is hidden, when the canvas is scrolled
  out of view and while a sheet covers the scene (`refreshLoop`).
- **Cheap on battery.** `powerPreference: 'low-power'`, no antialiasing on screens with a pixel
  ratio of 2 or more (where it adds little), pixel ratio capped at 2.
- **Cards** are drawn at 80% of their layout size (`CARD_SCALE`), and the room items and the
  labels are only handled for the current room, with unchanged label styles not written again.

New props should follow the same rules: merge static outlines, instance repeated parts, and keep
the number of objects of a room low.

## Stack logos and badges

The logos of the stack are authored as separate SVGs in `application/stack-icons/` (the file name
is the `icon` of `stack.json`) and built into one sprite, `public/images/stack/sprite.svg`, with
`npm run stack-sprite`: the site then downloads all of them in one request instead of about
thirty. The sprite is committed, and a unit test fails when it is out of date or misses an icon.
The home page draws them with `<use>`, the 3D cards read the same sprite (`stackIconHref`).

The certification badges are 256px WebP files (about 10 kB each, they are shown at 80px or less).
Resize a new badge to that size before adding it.

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

## 3D view

`/3d` (`src/views/ExploreView.vue`) is a lazy route, like the work pages. The engine
(three.js and `src/scene3d/explorer.ts`) is a further dynamic import started by the view
itself, so it is a separate chunk that the browser only downloads once the visitor opens the
3D view (nothing is preloaded, and `tests/e2e/explore.spec.ts` checks that the home page does
not request it). Nothing is downloaded beyond the images the site already publishes: the
stickman, the rooms and the decorations are generated from primitives.

- `src/scene3d/world.ts`: the layout (rooms, decorations, where items stand and where the
  portals lead), collisions, spawn points and proximity. It has no three.js dependency, which
  is why it is covered by unit tests (`tests/unit/world.spec.ts`).
- `src/scene3d/explorer.ts`: the rendering and the loop. All rooms are centred on the origin
  and only one is visible; a room is built (and its images loaded) the first time the visitor
  enters it. The camera is allowed outside the room because the walls are see-through.
- `src/scene3d/cards.ts`: draws on a canvas the wall card of what has no picture (a stack
  group with its logos, the contact details), in the colors of the current theme and in the
  language of the visitor. Works, certifications and CVs show their image instead: the CV
  previews are `public/images/cv/*.jpg`, produced by `npm run cv` together with the PDFs.
- `src/scene3d/props.ts`: the decorations, the portal and the pedestal, with
  their small animations. `stickman.ts`: the player, a jointed figure that takes a `Pose`.
  `dances.ts`: the poses (rest, walk and the dances) as plain numbers, so they are unit tested;
  a new dance is a function in that file and an `explore.dance.names.<id>` translation.
  `session.ts`: the player's room, position and camera, saved in `sessionStorage` when the
  view is left so that it resumes there. `input.ts`: keyboard, mouse, trackpad and
  touch (joystick, drag, pinch). With a mouse the camera uses the Pointer Lock API (a click
  captures it, `setEnabled(false)` releases it for panels and menus); where it is refused,
  dragging still turns the camera.
- What has a page of its own (works, contact, about, CV) opens in a sheet (`AppModal`) over
  the scene, reusing the page components: `WorkDetail` (shared with `WorkView`), the about and
  contact sections and `CvViewer`, which shows `public/images/cv/samuelsulo-cv-<lang>-<n>.jpg`
  (`CV_PAGES` in `src/utils/cv.ts` must match the pages of the PDF). The open item is the
  `open` query parameter, so Back closes it; while it is open the scene stops listening and
  stops drawing (`Explorer.suspend`), and the shortcuts ignore the keys typed in the form.
- Colors are read from the design tokens, so the world follows the light and dark themes.
- Items are placed from the same data files as the classic view (projects, stack groups,
  certifications, CV files), and the labels and panels use the same translations plus the
  `explore.*` keys, so new content shows up in both views.

To add a decoration, add its kind and a builder in `props.ts` and list it in `DECOR` in
`world.ts` (with a footprint if the player must not walk through it).

## CV

Two PDFs (Italian and English) generated from a single JSON source with `npm run cv`. They
are content: published by the content deploy. See [`application/cv/`](../../application/cv).

## Quality gates

CI on every pull request ([`.github/workflows/`](../../.github/workflows)): lint, format
check, type check, unit tests, build and end to end tests. Locally, `lefthook` checks commits
and `cocogitto` enforces Conventional Commits.

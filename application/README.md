# Portfolio

Showcase site for the professional presentation of Samuel Sulo as Cloud Engineer & Web Developer: a home page with About, Work, Stack and Contact sections plus a dedicated page for each work (`/work/<id>`), with a cyberpunk/neon visual identity in a dark and a light theme and bilingual Italian/English support.

## Technology stack

- Vue 3 (Composition API, `<script setup>`) + TypeScript in strict mode
- Vite as the build tool
- vue-i18n for internationalization (Italian as default, English as second language)
- CSS scoped in components + shared design tokens in `src/styles/` (no CSS framework)
- Self-hosted fonts (`@fontsource-variable`), no calls to external services at runtime
- Vitest + Vue Test Utils for unit tests
- ESLint + Prettier for code quality

## Themes

The site has a dark theme (default) and a light theme, both defined as design tokens in `src/styles/tokens.css`: the dark palette on `:root`, the light one under `:root[data-theme='light']` and, when no explicit choice is stored, under `prefers-color-scheme: light`. Components only use the tokens, never literal colors. The toggle (`ThemeToggle.vue`, state in `src/composables/useTheme.ts`) offers light, system and dark; an explicit choice is stored in `localStorage` (`samuelsulo-portfolio:theme`), "system" stores nothing. `public/theme-init.js` applies the stored choice before the first paint to avoid a flash. The Cookie Policy lists this entry, keep it in sync if the storage changes.

## Requirements

Tool versions are managed via `mise` (see `mise.toml` at the repository root). From this folder:

```bash
mise exec -- npm install
```

Deploying additionally requires the AWS CLI (installed by `mise`, like Node.js, OpenTofu and Terragrunt) and AWS credentials for the production account: the `AWS_PROFILE` active in the terminal, or the profile named in [`../infrastructure/live/production/account.hcl`](../infrastructure/live/production/account.hcl) (see [`scripts/deploy.sh`](./scripts/deploy.sh)).

## Available scripts

```bash
npm run dev          # dev server with hot reload
npm run build         # type-check + production build into dist/
npm run preview       # preview of the production build
npm run test          # unit tests (single run)
npm run test:watch    # unit tests in watch mode
npm run type-check    # type-check only (vue-tsc)
npm run lint          # ESLint with --fix
npm run format         # Prettier on src/
```

All commands must be run through `mise exec --` (or in a shell where `mise` has already activated the versions from `mise.toml`).

## Versioning and deploys

- Every notable change is recorded in [`CHANGELOG.md`](./CHANGELOG.md), in [Keep a Changelog](https://keepachangelog.com/) format.
- Production releases are tracked with `application/vX.Y.Z` git tags, created with `cog bump --package application --version X.Y.Z` (see the root [`README.md`](../README.md) for cocogitto conventions), not branches or a deploy log.
- Deploys are run from the terminal with [`scripts/deploy.sh`](./scripts/deploy.sh) (`npm run deploy --`), never from CI: build, tests, S3 sync and CloudFront invalidation all happen locally, against the AWS credentials of that terminal. Bucket name, CloudFront distribution ID and the contact API's URL are read from the outputs of the website stack (`infrastructure/live/production/eu-south-1/website`) via `terragrunt stack output`, never guessed or hardcoded.
- Production is the only environment: only an explicit `application/vX.Y.Z` tag can be deployed, passed with `--version` (never the currently checked-out commit): `npm run deploy -- --version application/vX.Y.Z`.
- The resolved version is injected into the build as the `VITE_APP_VERSION` env var and shown in the footer by `src/components/ui/SiteVersion.vue`.
- To release to production: `cog bump --package application --version X.Y.Z` (updates `CHANGELOG.md`, commits, tags `application/vX.Y.Z`, pushes, creates the GitHub Release), then `npm run deploy -- --version application/vX.Y.Z`.
- Content-only deploys skip the build and the release: `npm run deploy:content` ([`scripts/deploy-content.sh`](./scripts/deploy-content.sh)) runs the tests on `origin/main` (or `--ref <git-ref>`), syncs `public/content`, `images`, `cv`, `documents` and `brand` to the bucket and invalidates those paths in CloudFront. The deployed commit is recorded in a `_content_version` object. `deploy.sh` never touches these paths, so an application deploy does not revert the content; it refuses to run if the bucket has no content yet. Caching: the JSON files are revalidated on every visit (`max-age=0, must-revalidate`, fetched with `cache: 'no-cache'`), the media files are cached for 5 minutes.
- The currently live version is recorded as the plain-text content of a single `_version` object in the bucket (readable with `aws s3 cp s3://<bucket>/_version -`). It is only a snapshot of what is live now, not a deploy history: history lives in GitHub Releases instead.

## Project structure

```text
application/
├── public/                  # static assets served as-is (favicon, placeholder images)
├── src/
│   ├── components/
│   │   ├── layout/          # NavBar, AppFooter
│   │   ├── sections/        # Hero, About, Projects (work), Stack, Contact
│   ├── work/             # work page: tabbed viewer and its blocks (images, devices, design, diagram, cards)
│   │   ├── cookies/          # LegalPolicyView (Cookie Policy / Privacy Policy modal)
│   │   └── ui/               # reusable components (cards, buttons, icons, etc.)
│   ├── composables/          # reusable logic (scroll spy, contact form, etc.)
│   ├── content/              # loader that fetches the content from /content/ at startup
│   ├── i18n/                 # vue-i18n configuration (the it/en messages are loaded by src/content)
│   ├── services/              # integration layer with external services (contact form API)
│   ├── styles/                # shared design tokens and reset
│   ├── types/                  # shared TypeScript types
│   └── utils/                  # pure functions (form validation, etc.)
├── tests/
│   ├── unit/                 # Vitest specs
│   └── e2e/                  # Playwright specs (scrolling between sections and pages)
└── vite.config.ts / vitest.config.ts / tsconfig*.json
```

Unit tests live in the `tests/unit/` folder; `vitest.config.ts` is
configured to discover them there.

## Content: how to edit it

The content is **not part of the application bundle**. It lives in `public/content/` (`data/*.json` and `locales/{it,en}.json`), together with the media folders `public/images/`, `public/cv/`, `public/documents/` and `public/brand/`, and the application fetches it from `/content/` when it starts (see `src/content/index.ts`). Changing a text, a translation, a project, the CV or an image therefore needs **no application release**: edit, commit and run `npm run deploy:content` (see "Versioning and deploys").

If a change to the content files needs a change to the application (a new field, a renamed key), bump `CONTENT_SCHEMA_VERSION` in `src/content/index.ts` and `schemaVersion` in `public/content/data/site-config.json` together, and release the application as well: an application that finds a different schema shows a "could not be loaded" message instead of a broken page.

- **Prose text (bio, projects, UI labels)**: lives in the translation files `public/content/locales/it.json` and `public/content/locales/en.json`. Every key must be updated in both files.
- **Works**: `projects.json` drives the cards on the home page, `cases.json` the materials of each work page (tabs and their blocks). Every case needs its prose under `cases.items.<id>` in both languages and its images under `public/images/cases/<id>/`; `tests/unit/cases.spec.ts` fails if a translation or an image is missing. Architecture diagrams are public, simplified drawings: never put account ids, resource names or configuration details in them.
- **Non-translatable data for Projects and Stack** (kind, materials, technologies, images, URLs): lives in `public/content/data/projects.json` and `public/content/data/stack.json`. Each entry references a `translationKey` pointing to the corresponding block in the translation files.
- **Contact/social data** (email, social links, the public CV link `cvUrl`, the technical readouts next to the portrait): `public/content/data/site-config.json`. The CV button stays hidden while `cvUrl` is `null`.

The content currently in place (bio, service list, projects, email, social links) is **placeholder** content meant to be replaced with real content without modifying any Vue component.

## CV

The CV is published as two PDFs, one per language, under `/cv/`. The "CV" links
follow the active language. The PDFs are generated from `cv/samuelsulo-cv.json` with
`npm run cv`, see [`cv/README.md`](./cv/README.md).

## Contact form: backend

The contact form is wired to the `contact_api` module (API Gateway + SES) described in [`../infrastructure/`](../infrastructure). The frontend calls `POST {VITE_CONTACT_API_URL}/email`, where `VITE_CONTACT_API_URL` is the module's custom domain (e.g. `https://contact.samuelsulo.it`).

In production this variable is injected automatically by [`scripts/deploy.sh`](./scripts/deploy.sh), which reads it from the outputs of the website stack in `infrastructure/live` instead of having it hardcoded. For local development (`npm run dev`) against an already-applied environment, copy `.env.example` to `.env.local` and set it by hand; `.env.local` must never be committed.

If `VITE_CONTACT_API_URL` isn't set (e.g. the `contact_api` module hasn't been applied yet in that environment), `src/services/contactService.ts` returns an explicit error (`ContactApiNotConfiguredError`) and the form correctly shows the error state instead of a false success.

## Cookies and legal pages

This site sets no analytics, marketing or profiling cookies, and embeds no third-party content: the only browser storage in use is the technical, strictly necessary `samuelsulo-portfolio:locale` local storage entry that remembers the chosen language (see `src/i18n/index.ts`). Because there is nothing non-essential to consent to, no cookie banner is shown; the Cookie Policy states this explicitly.

The Cookie Policy and Privacy Policy are both rendered by the single `src/components/cookies/LegalPolicyView.vue` component (`documentKey: 'cookiePolicy' | 'privacyPolicy'`), opened as a modal from the footer's legal links, so they work from any page. Their prose lives in the `legal.*` namespace of `public/content/locales/{it,en}.json`, following the same content rule as the rest of the site; the handful of values the Privacy Policy needs that are identical in every language (the privacy contact email, the business details, the AWS processing region, the last-updated date) instead live in `public/content/data/site-config.json` under `legal`, typed as `SiteLegalConfig` in `src/types/content.ts`, and are interpolated into the `legal.privacyPolicy.content` message as named params (`{privacyContactEmail}`, `{businessDetails}`, `{dataProcessingRegion}`, `{privacyPolicyLastUpdated}`) by `LegalPolicyView.vue`.

The contact-form retention period is the one exception: `legal.contactFormRetentionMonths` in `site-config.json` is a plain number, kept language-neutral on purpose (never a sentence, and never `null`: the real figure is determined by auditing how the backend actually works, not left undecided). `LegalPolicyView.vue` turns it into the actual sentence by calling the translated `legal.privacyPolicy.retentionPeriodKnown` message (`{months}` interpolated) when it's greater than zero, or `retentionPeriodNone` when it's `0`, so the wording itself stays correctly localized in each locale file instead of being duplicated as one shared string.

All `legal.*` fields in `site-config.json` are filled in with real, confirmed values for this site: `dataProcessingRegion` is `AWS eu-south-1 (Milan, Italy)` (confirmed from `infrastructure/live/production/eu-south-1/region.hcl`); `contactFormRetentionMonths` is `0`, because the contact form's backend (`infrastructure/modules/vendor/contact-api`) has API Gateway call Amazon SES directly, with no Lambda or database in between, so no submission is ever stored by the site itself; `businessDetails` is an empty string, since the controller is an individual with no registered business/VAT/address to disclose (the message template is written so an empty value degrades to a clean sentence, not a dangling placeholder); `privacyPolicyLastUpdated` is an ISO date (`2026-09-05`), kept unambiguous and locale-neutral on purpose (never a worded date like "5 September 2026", which would carry an English month name into the Italian text verbatim).

If this site ever adds analytics, a Maps/YouTube embed, or any other non-essential tracker, it must be gated behind a proper consent banner (accept/reject/customize, equal prominence, granular per category) before it loads, not added silently under this current "necessary only" setup — see the `vue-webapp-standard` skill's cookie-consent reference for the full mechanism to add at that point.

## Accessibility and responsiveness

- Skip link, semantic markup, visible focus, `aria-*` on interactive elements, forms with associated labels and errors that aren't color-only.
- Respects `prefers-reduced-motion` both in CSS and in animations/transitions handled via JavaScript.
- Mobile-first responsive layout; the Projects section uses a touch-friendly horizontal scroll with navigation arrows on desktop.

## Next steps (out of scope for this iteration)

- E2E tests (Playwright) in `tests/e2e/`: only the scrolling between sections and pages is covered so far. Run them with `npm run test:e2e`; they build the site, serve it with `vite preview` and use the Google Chrome installed on the machine, so no browser download is needed.
- Replacement of the placeholder content (bio, projects, images, real contacts).

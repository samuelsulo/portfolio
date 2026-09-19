# Portfolio Website

Single-page showcase site for the professional presentation of Samuel Sulo as Cloud Engineer & Web Developer: About, Services, Projects and Contact sections, with a dark cyberpunk/neon visual identity and bilingual Italian/English support.

## Technology stack

- Vue 3 (Composition API, `<script setup>`) + TypeScript in strict mode
- Vite as the build tool
- vue-i18n for internationalization (Italian as default, English as second language)
- CSS scoped in components + shared design tokens in `src/styles/` (no CSS framework)
- Self-hosted fonts (`@fontsource-variable`), no calls to external services at runtime
- Vitest + Vue Test Utils for unit tests
- ESLint + Prettier for code quality

## Requirements

Tool versions are managed via `mise` (see `mise.toml` at the repository root). From this folder:

```bash
mise exec -- npm install
```

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
- Production releases are tracked with `website/vX.Y.Z` git tags, not branches or a deploy log: [kitsu](https://github.com/samuelsulo/kitsu) (`kitsu website deploy`) deploys the commit pointed at by the `website/vX.Y.Z` tag given explicitly via `--tag` (never auto-selected) to production, and whatever commit is currently checked out (its short SHA as version) to every other environment.
- The resolved version is injected into the build as the `VITE_APP_VERSION` env var and shown in the footer by `src/components/ui/SiteVersion.vue`.
- To release to production: update `CHANGELOG.md`, commit, tag the release commit `website/vX.Y.Z`, push the tag, then run `kitsu website deploy --env production --tag website/vX.Y.Z`. Deploying the same tag twice is a no-op: the command checks a marker recorded in S3 and skips with a warning instead of redeploying.
- The currently live release is also recorded in S3, at `_deploy-versions/current` (its content is the deployed tag name). Deploying a tag older than that one is refused: it would silently downgrade production, so the command errors out unless it's a deliberate rollback (see below).
- Two situations require the `--force` flag: redeploying a tag that already has its marker (`kitsu website deploy --env production --tag website/vX.Y.Z --force`), or deploying an older tag than the currently live one, i.e. a rollback. Either way, `--force` only skips that specific check; everything else (build, tests, sync, invalidation) runs as normal, and `_deploy-versions/current` is updated to the tag just deployed.

## Project structure

```text
website/
├── public/                  # static assets served as-is (favicon, placeholder images)
├── src/
│   ├── components/
│   │   ├── layout/          # NavBar, AppFooter
│   │   ├── sections/        # Hero/About, Services, Projects, Contact
│   │   ├── cookies/          # LegalPolicyView (Cookie Policy / Privacy Policy modal)
│   │   └── ui/               # reusable components (cards, buttons, icons, etc.)
│   ├── composables/          # reusable logic (scroll spy, contact form, etc.)
│   ├── data/                 # data-driven content (services.json, projects.json, site-config.json)
│   ├── i18n/                 # vue-i18n configuration + it/en translation files
│   ├── services/              # integration layer with external services (contact form API)
│   ├── styles/                # shared design tokens and reset
│   ├── types/                  # shared TypeScript types
│   └── utils/                  # pure functions (form validation, etc.)
└── vite.config.ts / vitest.config.ts / tsconfig*.json
```

Unit tests live in the `tests/unit/` folder at the repository root (not inside `website/`), per the standard project structure described in `CLAUDE.md`; `vitest.config.ts` is configured to discover them there.

## Content: how to edit it

- **Prose text (bio, services, projects, UI labels)**: lives in the translation files `src/i18n/locales/it.json` and `src/i18n/locales/en.json`. Every key must be updated in both files.
- **Non-translatable data for Services and Projects** (icon, technologies, images, URLs): lives in `src/data/services.json` and `src/data/projects.json`. Each entry references a `translationKey` pointing to the corresponding block in the translation files.
- **Contact/social data** (email, social links): `src/data/site-config.json`.

The content currently in place (bio, service list, projects, email, social links) is **placeholder** content meant to be replaced with real content without modifying any Vue component.

## Contact form: backend

The contact form is wired to the `contact_api` module (API Gateway + SES) described in [`../infrastructure/`](../infrastructure). The frontend calls `POST {VITE_CONTACT_API_URL}/email`, where `VITE_CONTACT_API_URL` is the module's custom domain (e.g. `https://contact.samuelsulo.it`).

In sandbox/production this variable is injected automatically by `kitsu website deploy`, which reads it from `infrastructure/live`'s Terraform state instead of having it hardcoded. For local development (`npm run dev`) against an already-applied environment, copy `.env.example` to `.env.local` and set it by hand; `.env.local` must never be committed.

If `VITE_CONTACT_API_URL` isn't set (e.g. the `contact_api` module hasn't been applied yet in that environment), `src/services/contactService.ts` returns an explicit error (`ContactApiNotConfiguredError`) and the form correctly shows the error state instead of a false success.

## Cookies and legal pages

This site sets no analytics, marketing or profiling cookies, and embeds no third-party content: the only browser storage in use is the technical, strictly necessary `samuelsulo-portfolio:locale` local storage entry that remembers the chosen language (see `src/i18n/index.ts`). Because there is nothing non-essential to consent to, no cookie banner is shown; the Cookie Policy states this explicitly.

The Cookie Policy and Privacy Policy are both rendered by the single `src/components/cookies/LegalPolicyView.vue` component (`documentKey: 'cookiePolicy' | 'privacyPolicy'`), opened as a modal from the footer's legal links since this single-page site has no router. Their prose lives in the `legal.*` namespace of `src/i18n/locales/{it,en}.json`, following the same content rule as the rest of the site; the handful of values the Privacy Policy needs that are identical in every language (the privacy contact email, the business details, the AWS processing region, the last-updated date) instead live in `src/data/site-config.json` under `legal`, typed as `SiteLegalConfig` in `src/types/content.ts`, and are interpolated into the `legal.privacyPolicy.content` message as named params (`{privacyContactEmail}`, `{businessDetails}`, `{dataProcessingRegion}`, `{privacyPolicyLastUpdated}`) by `LegalPolicyView.vue`.

The contact-form retention period is the one exception: `legal.contactFormRetentionMonths` in `site-config.json` is a plain number, kept language-neutral on purpose (never a sentence, and never `null`: the real figure is determined by auditing how the backend actually works, not left undecided). `LegalPolicyView.vue` turns it into the actual sentence by calling the translated `legal.privacyPolicy.retentionPeriodKnown` message (`{months}` interpolated) when it's greater than zero, or `retentionPeriodNone` when it's `0`, so the wording itself stays correctly localized in each locale file instead of being duplicated as one shared string.

All `legal.*` fields in `site-config.json` are filled in with real, confirmed values for this site: `dataProcessingRegion` is `AWS eu-south-1 (Milan, Italy)` (confirmed from `infrastructure/live/project.auto.tfvars`); `contactFormRetentionMonths` is `0`, because the contact form's backend (`infrastructure/modules/vendor/contact-api`) has API Gateway call Amazon SES directly, with no Lambda or database in between, so no submission is ever stored by the site itself; `businessDetails` is an empty string, since the controller is an individual with no registered business/VAT/address to disclose (the message template is written so an empty value degrades to a clean sentence, not a dangling placeholder); `privacyPolicyLastUpdated` is an ISO date (`2026-09-05`), kept unambiguous and locale-neutral on purpose (never a worded date like "5 September 2026", which would carry an English month name into the Italian text verbatim).

If this site ever adds analytics, a Maps/YouTube embed, or any other non-essential tracker, it must be gated behind a proper consent banner (accept/reject/customize, equal prominence, granular per category) before it loads, not added silently under this current "necessary only" setup — see the `vue-webapp-standard` skill's cookie-consent reference for the full mechanism to add at that point.

## Accessibility and responsiveness

- Skip link, semantic markup, visible focus, `aria-*` on interactive elements, forms with associated labels and errors that aren't color-only.
- Respects `prefers-reduced-motion` both in CSS and in animations/transitions handled via JavaScript.
- Mobile-first responsive layout; the Projects section uses a touch-friendly horizontal scroll with navigation arrows on desktop.

## Next steps (out of scope for this iteration)

- E2E test suite (Playwright) in `tests/e2e/`.
- Replacement of the placeholder content (bio, projects, images, real contacts).

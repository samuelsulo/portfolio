# Changelog

All notable changes to this project are documented in this file, in
[Keep a Changelog](https://keepachangelog.com/) format.

## [1.2.0] - 2026-09-09

### Changed

- Replaced the "SS" initials mark in the navbar brand with the
  `SignatureFox` mark, shown larger than its footer instance so it reads
  as the actual portfolio/brand logo.

## [1.1.2] - 2026-09-06

### Fixed

- Mobile navbar now hides on scroll down and reappears on scroll up,
  instead of staying permanently fixed, to maximize screen space on small
  screens.

## [1.1.1] - 2026-09-06

### Added

- New project in the Projects section: Noir 27 Cocktail Bar, a fictional
  premium cocktail bar in Milan, with venue, menu, events and reservation
  flow (Vue.js, AWS, S3, CloudFront, Route53, Terraform).

### Removed

- Lake Maggiore Venue Showcase Site project (client project, no longer
  featured on the portfolio).

## [1.1.0] - 2026-09-05

### Added

- Cookie Policy and Privacy Policy, rendered as a footer-accessible modal
  (`LegalPolicyView.vue`, no router on this single-page site). The site
  sets no analytics, marketing or profiling cookies and embeds no
  third-party content, so no consent banner is shown; the Cookie Policy
  states this explicitly. The Privacy Policy's non-translatable data
  (privacy contact email, business details, AWS data processing region,
  last-updated date) is data-driven from `site-config.json`'s new `legal`
  section, interpolated into the `it`/`en` policy text. The contact-form
  retention period is instead a plain, language-neutral number
  (`legal.contactFormRetentionMonths`), turned into the actual sentence by
  a translated message per locale (`retentionPeriodKnown`/`retentionPeriodNone`)
  so the wording stays correctly localized. All `legal.*` fields are
  populated with real, confirmed values: no contact-form submission is
  stored in any database (API Gateway calls Amazon SES directly, no
  Lambda in between), data is processed in AWS eu-south-1 (Milan), and
  there is no registered business entity to disclose.

## [1.0.2] - 2026-09-04

### Added

- New project in the Projects section: Pulse Project Management, a
  project operations and team management workspace with projects, tasks,
  a team directory, analytics and an activity feed (Vue.js, Vuetify,
  TypeScript, Pinia, ApexCharts, AWS, Terraform).

### Removed

- Placeholder "Infrastructure CI/CD Pipeline" entry, replaced by the
  Pulse project above.

## [1.0.1] - 2026-09-03

### Added

- New project in the Projects section: Nexus E-commerce Webapp, an
  e-commerce web application for next-generation gaming peripherals
  (Vue.js, TypeScript, Pinia, AWS, Terraform).

### Changed

- Replaced the placeholder "Multi-Account Cloud Platform" entry with the
  Nexus project above.
- Simplified the technology tags shown on the Lake Maggiore Venue
  Showcase project card.

## [1.0.0] - 2026-09-03

### Added

- Initial release: single-page showcase site for the professional
  presentation of Samuel Sulo as Cloud Engineer & Web Developer, with
  About, Services, Projects and Contact sections and a dark
  cyberpunk/neon visual identity.
- Bilingual Italian (default) / English support via `vue-i18n`, with a
  keyboard-accessible language switcher in the main navigation bar whose
  choice is remembered across visits.
- Contact form wired to the `contact_api` backend (API Gateway + SES),
  with explicit error handling when the API endpoint isn't configured.
- Responsive, mobile-first layout; Projects section with touch-friendly
  horizontal scroll and desktop navigation arrows.
- Accessibility baseline: skip link, semantic markup, visible focus,
  `aria-*` on interactive elements, labeled forms with non-color-only
  errors, and respect for `prefers-reduced-motion`.
- Footer with deployed site version (`SiteVersion`) and company signature
  (`SignatureFox`).

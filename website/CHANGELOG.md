# Changelog

All notable changes to this project are documented in this file, in
[Keep a Changelog](https://keepachangelog.com/) format.

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

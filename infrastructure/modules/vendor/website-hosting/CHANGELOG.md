# Changelog

All notable changes to this module are documented in this file, in
[Keep a Changelog](https://keepachangelog.com/) format.

## [1.0.1] - 2026-08-31

### Changed

- Translated `README.md` and this changelog to English (CLAUDE.md §7 now
  requires English throughout the repository, with no `.md`-in-Italian
  exception). No functional change: no `.tf` file was touched.

## [1.0.0] - 2026-08-30

### Added

- First standardized version of the module: private S3 bucket, CloudFront
  distribution with Origin Access Control, ACM certificate validated via
  DNS, and a Route 53 alias record pointing at an existing hosted zone.

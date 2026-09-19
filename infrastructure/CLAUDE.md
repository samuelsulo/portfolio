# CLAUDE.md: Project Guardrails

## Purpose

This repository holds the Terraform-managed AWS infrastructure layer for a
client project (reusable modules, root composition, per-environment
configuration). It is meant to be embedded inside a larger per-client
repository, which handles project-level concerns (documentation, tooling,
git hooks, etc.) that are out of scope here. See [README.md](./README.md)
for the full structure and workflow.

## Structure

The layout (`modules/`, `live/`, `environments/`) is fixed and should not
be reorganized. Conventions for each folder live in its own README, not
duplicated here:

- [`modules/README.md`](./modules/README.md),
  [`modules/local/README.md`](./modules/local/README.md),
  [`modules/vendor/README.md`](./modules/vendor/README.md)
- [`live/README.md`](./live/README.md)
- [`environments/README.md`](./environments/README.md)

Read the relevant README before touching a folder.

## Hard rules

- Never modify anything under `modules/vendor/`: those are byte-for-byte
  copies from `terraform-aws-catalog`. A needed change means either
  combining modules in `live/`, writing a new module under
  `modules/local/`, or updating the catalog itself, never editing the
  vendored copy.
- Never run `terraform` directly. Every workflow command (`init`, `plan`,
  `apply`, `fmt`, `validate`, scaffolding, vendoring, ...) goes through
  `kitsu terraform ...`.
- Never `apply` to the `production` environment without a manually
  reviewed `plan` first. Treat any change touching
  `environments/production/` or cross-account `AssumeRole` behavior with
  extra care.
- Don't create AWS resources directly in `live/` or `environments/` if a
  module already covers, or should cover, that competency.
- Every module keeps the same file set (`main.tf`, `variables.tf`,
  `outputs.tf`, `versions.tf`, `README.md`), and every variable/output
  has a `description`.
- Don't add local scripts, a Makefile, or other ad hoc automation: all
  workflow automation lives in `kitsu`.

## Language and style

- English only: code, comments, commit messages, and all documentation
  (including this file).
- Plain, standard punctuation. No em dashes, no smart/curly quotes, no
  decorative Unicode symbols (arrows, emoji-as-bullets, etc.) in code,
  docs, or commit messages.
- Commit messages follow Conventional Commits (`type(scope): summary`),
  matching the existing history (`git log`).

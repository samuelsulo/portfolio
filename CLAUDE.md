# CLAUDE.md: Project Guardrails

This file instructs whoever works on this repository (human or AI assistant)
on how to operate within this project. The structure, conventions and rules
below are fixed and are not to be reinvented. If a request seems to require
deviating from them, stop and flag the deviation instead of proceeding
autonomously (see "Changes that require manual review").

This file covers only what is cross-cutting. Terraform and AWS rules live in
`infrastructure/CLAUDE.md`, brought in by the infrastructure scaffold itself
(see [`infrastructure/README.md`](./infrastructure/README.md)). Application
conventions live in [`application/README.md`](./application/README.md). Do not
duplicate rules already defined there into this file, or vice versa: each
concept has a single place it is documented, and everything else refers to it
instead of repeating it.

## 1. Repository Structure

Top-level folders are fixed and must never be renamed or moved:
`infrastructure/`, `application/`, `brand/`, `docs/`, `.github/`.
The tooling and documentation across the repository assume this
structure. The internal structure of `docs/` (its subfolders) is
likewise fixed: add content inside the existing subfolders, do not
introduce new top-level documentation categories without flagging it
first.

`brand/` holds the brand assets (palette, logo, business card, fonts, the brand manual);
it is not documentation, which is why it lives outside `docs/`.

Issue templates in `.github/ISSUE_TEMPLATE/` come from the project template
and must not be modified.

## 2. Hosting and Data

- Production lives in the owner's own AWS account.
- No permanent credentials are stored in the repository or in CI: AWS access
  comes from the profile in the owner's terminal.
- No personal data of visitors (email, contact form submissions, ...) is
  stored or processed outside the owner's own infrastructure.

## 3. Component Versioning

`application/`, `infrastructure/` and `brand/` (as a whole: palette, logo,
business card, fonts and the guidelines) are versioned independently from
one another, each with its own git tags in the form
`application/vX.Y.Z`, `infrastructure/vX.Y.Z` and `brand/vX.Y.Z` (the same tagging pattern used by the
infrastructure catalog for its own modules). These tags, the changelog
and commit message validation are managed with
[cocogitto](https://docs.cocogitto.io) (see [`cog.toml`](./cog.toml)
and [`README.md`](./README.md)).

## 4. Required Documentation

The project must have in `docs/`: functional
documentation, technical documentation, architecture documentation,
a deployment guide, an operations guide, and handover documentation.
Keep documentation up to date whenever a change to the code or the
infrastructure makes it outdated, not only at the end of the project.

## 5. Changes That Require Manual Review

Stop the work and explicitly flag it before proceeding if a request
implies any of the following:

- Introducing user authentication, restricted areas, e-commerce/payments,
  analytics or any tracking, where not already part of the project scope.
- Deploying from CI, or storing any credential for production outside the
  owner's terminal.

In these cases: propose the solution, explain why it falls outside the
current scope, and wait for explicit confirmation before implementing.

## 6. General Conventions

- **Language**: English is used for everything in this repository, no
  exceptions: source code, comments, configuration files, commit
  messages, and every Markdown file published or delivered to the
  client. Technical terms without a natural translation are always kept
  as-is regardless of context.
- **No reference to the generative AI tool used for development**, in
  code, comments, configuration, commit messages, or any content
  delivered to the client, unless I explicitly ask for it in a specific
  case. The only technical exception is the name of this file
  (`CLAUDE.md`), imposed by the tooling itself.
- **Punctuation**: never use the em dash in any text in the repository.
  Prefer standard punctuation instead: comma, period, colon, semicolon,
  parentheses, or a short dash with spaces (` - `) for asides.
- Commit messages in English, imperative mood, conforming to
  [Conventional Commits](https://www.conventionalcommits.org/)
  (`feat(application): add contact form validation`, not `added stuff`).
- File and folder names in kebab-case.
- Do not restate the same concept in more than one place in the
  documentation: document it once, in the file and section it belongs
  to, and link or refer to it from everywhere else.
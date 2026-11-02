# CLAUDE.md: Project Guardrails

This file instructs whoever works on this repository (human or AI assistant)
on how to operate within this project. It applies to **every client**:
the structure, conventions and rules are standard and are not to be
reinvented project by project. If a client request seems to require
deviating from these rules, stop and flag the deviation instead of
proceeding autonomously (see "Changes that require manual review").

This file covers only what is cross-cutting across every client project,
regardless of cloud provider or application type. Provider-specific and
Terraform-specific rules live in `infrastructure/CLAUDE.md`, brought in
by the infrastructure scaffold itself (see
[`infrastructure/README.md`](./infrastructure/README.md)). Application
stack-specific conventions live wherever that stack's convention defines
them (see [`application/README.md`](./application/README.md)). Do not
duplicate rules already defined there into this file, or vice versa:
each concept has a single place it is documented, and everything else
refers to it instead of repeating it.

## 1. Repository Structure

Top-level folders are fixed and must never be renamed or moved:
`infrastructure/`, `application/`, `brand/`, `docs/`, `.github/`.
The tooling and documentation across the repository assume this
structure. The internal structure of `docs/` (its subfolders) is
likewise fixed: add content inside the existing subfolders, do not
introduce new top-level documentation categories without flagging it
first.

`brand/` holds the client's brand assets (palette, logo, business card, fonts, the brand manual);
it is not documentation, which is why it lives outside `docs/`.

Issue templates in `.github/ISSUE_TEMPLATE/` are standard across every
client project and must not be modified.

## 2. Client Engagement Model

Regardless of which cloud provider or application stack a project uses:

- Production lives exclusively in the client's own cloud account/tenant,
  never in mine.
- Access to the client's environment is granted through a role or
  mechanism the client can revoke autonomously at any time; no permanent
  or shared credentials.
- No personal client data (email, contact form submissions, customer
  data, ...) is stored or processed outside the client's own
  infrastructure without their explicit consent.

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

Every project, before closure, must have in `docs/`: functional
documentation, technical documentation, architecture documentation,
a deployment guide, an operations guide, and handover documentation.
Keep documentation up to date whenever a change to the code or the
infrastructure makes it outdated, not only at the end of the project.

## 5. Changes That Require Manual Review

Stop the work and explicitly flag it before proceeding if a request
implies any of the following:

- Introducing user authentication, restricted areas, e-commerce/payments,
  where not already part of the agreed project scope.
- Anything that moves the project closer to a SaaS/multi-tenant model,
  with centralized management of multiple clients in the same account or
  stack.

In these cases: propose the solution, explain why it falls outside the
standard scope, and wait for explicit confirmation before implementing.

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
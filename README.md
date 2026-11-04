# Samuel Sulo, Cloud Engineer & Web Developer

**Live at [samuelsulo.it](https://samuelsulo.it)**

This is my portfolio and the whole system behind it: the website, the AWS
infrastructure it runs on, my brand and my CV. Everything is in this
repository, versioned and reproducible. If you are a client, a company or a
recruiter, this README is the short tour of what I build and how I work.

## What makes it different

- **A portfolio you can walk through.** Besides the classic page, `/3d` is the
  same content as a 3D world built with Three.js: a neon hub with portals to
  the work gallery, the stack room, the certifications, the CV and the
  contact room. A stickman walks (keyboard, mouse look or touch joystick) and
  can dance. Every work and certification is on the walls, and walking up to
  one opens it. It degrades gracefully without WebGL, stays fully usable by
  keyboard and screen readers, and the 3D engine is only downloaded when
  the visitor asks for it.
- **Real works with case studies.** Each project has its own page with a tabbed
  viewer: logo, business card, website, design, online presence and
  architecture, for both real client work and labelled demos.
- **Content is data, not code.** Texts, projects, stack, certifications and CV
  are JSON files fetched at runtime, so I can update them without rebuilding
  the application. A schema version protects against a mismatch.
- **Bilingual and themed.** Italian and English, dark and light themes (plus
  "system"), a CV in both languages generated as a PDF from a single source
  file with my brand applied.
- **Private by design.** No analytics, no tracking cookies, no third-party
  content, so no cookie banner is needed. The contact form is stored nowhere:
  nothing a visitor writes is kept by the site.
- **Accessible.** Skip link, keyboard navigation, visible focus, reduced
  motion respected.

## Engineering highlights

- **Serverless and cheap to run.** A static site on private S3 behind
  CloudFront (HTTPS, security headers, origin access control) with Route 53
  and ACM. The contact API is API Gateway calling Amazon SES directly: no
  Lambda, no database, nothing to patch.
- **Everything as code.** OpenTofu modules and Terragrunt units and stacks, with
  a production and a sandbox environment, remote state and pinned tool
  versions with `mise`.
- **Quality gates.** Strict TypeScript, ESLint, Prettier, unit tests with
  Vitest and end-to-end tests with Playwright. On every pull request CI runs
  them plus Conventional Commits checks, `tflint`, `trivy` and a `gitleaks`
  secret scan over the whole history.
- **Disciplined releases.** `application`, `infrastructure` and `brand` are
  versioned independently with git tags, changelogs and GitHub Releases
  managed by cocogitto. Deploys name an exact tag and record what is live.
- **Safe access to production.** No credentials stored in the repository or in
  CI: deploys run from the owner's terminal with their own AWS profile.
- **A complete brand.** Palette, logo (the Kitsune fox), business card, fonts
  and a brand manual, in `brand/` and reused by the site and the CV.
- **Documented.** Functional, technical, architecture, deployment and
  operations documentation in [`docs/`](./docs), with a README for every
  module and unit.

## Stack

| Area | Tools |
| --- | --- |
| Frontend | Vue 3, TypeScript, Vite, Vue Router, vue-i18n, Three.js |
| Cloud | AWS: S3, CloudFront, Route 53, ACM, API Gateway, SES |
| Infrastructure as code | OpenTofu, Terragrunt, tflint, trivy |
| Quality and delivery | Vitest, Playwright, ESLint, GitHub Actions, gitleaks, cocogitto, lefthook, mise |

## Project Structure

```
portfolio/
├── infrastructure/   # AWS infrastructure as code (OpenTofu + Terragrunt)
├── application/      # the website (Vue 3 + TypeScript), content and CV source
├── brand/            # palette, logo, business card, fonts, brand manual
├── docs/             # functional, technical, architecture, deployment, operations
├── .github/          # issue templates and CI workflows
├── README.md         # this file
├── CLAUDE.md         # project guardrails
├── cog.toml          # cocogitto configuration (commit checks, changelog, version tags)
├── lefthook.yml      # git hooks configuration
└── mise.toml         # tools required by the project
```

See each subfolder's README for details:
- [`infrastructure/`](./infrastructure)
- [`application/`](./application)
- [`brand/`](./brand)
- [`docs/`](./docs)

Where to start: the [site overview](./docs/functional/site-overview.md) for what
it does, the [system architecture](./docs/architecture/system-architecture.md)
for how it is put together.

## Contact

Reach me through the form on [samuelsulo.it](https://samuelsulo.it), or on
GitHub and LinkedIn from the links there.

## Getting Started

Tools are managed by [`mise`](https://mise.jdx.dev) (see
[`mise.toml`](./mise.toml)), including
[`lefthook`](https://lefthook.dev), which manages git hooks,
[`cocogitto`](https://docs.cocogitto.io), which enforces Conventional
Commits and manages the changelog and version tags of `application/`,
`infrastructure/` and `brand/`, and the
[GitHub CLI](https://cli.github.com)
(`gh`), used to publish GitHub releases on bump, and the
[AWS CLI](https://aws.amazon.com/cli/) (`aws`). The infrastructure
tools (OpenTofu, Terragrunt) and tasks are pinned separately in
[`infrastructure/mise.toml`](./infrastructure/mise.toml) (see
[`infrastructure/README.md`](./infrastructure/README.md)).

After cloning, install once the git hooks defined in
[`lefthook.yml`](./lefthook.yml):

```
lefthook install
```

To release a new version of `application/`, `infrastructure/` or
`brand/` once it contains code or
assets, from the repository root:

```
cog bump --package application --auto
cog bump --package infrastructure --auto
cog bump --package brand --auto
```

This updates the `CHANGELOG.md` inside the corresponding folder
(`application/CHANGELOG.md`, `infrastructure/CHANGELOG.md` or
`brand/CHANGELOG.md`),
creates the bump commit and tags it `application/vX.Y.Z`,
`infrastructure/vX.Y.Z` or `brand/vX.Y.Z`, per
the versioning convention in [`CLAUDE.md`](./CLAUDE.md). It then
pushes the commit and the tag, and creates the corresponding GitHub
release with the [`gh` CLI](https://cli.github.com) (must be
authenticated beforehand with `gh auth login`), using that version's
changelog entry as the release notes.

## License

All rights reserved: this is a personal portfolio, public to be read and not
to be reused. The code, content and brand may not be copied or reused without
permission. See [`LICENSE`](./LICENSE) for the exceptions (fonts, the materials
of the clients shown in the case studies, dependencies).

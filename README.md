# Portfolio for Samuel Sulo

This repository manages the AWS infrastructure and the portfolio of Samuel Sulo.

## Project Structure

```
client-project/
├── infrastructure/   # Infrastructure
├── application/      # client application code (website, webapp, e-commerce,
│                     # mobile app, ...), per the client's project type
├── brand/            # client's brand assets (palette, logo, business card, ...)
├── docs/             # project documentation
├── .github/          # issue templates and CI workflows
├── README.md         # project README
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
permission. See [`LICENSE`](./LICENSE) for the exceptions (fonts, clients'
materials, dependencies).

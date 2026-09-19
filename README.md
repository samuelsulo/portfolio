# Portfolio for Samuel Sulo

This repository manages the AWS infrastructure and the portfolio of Samuel Sulo.

## Project Structure

```
client-project/
├── infrastructure/   # Infrastructure
├── application/      # client application code (website, webapp, e-commerce,
│                     # mobile app, ...), per the client's project type
├── docs/             # project documentation
├── .github/          # issue templates and CI workflows
├── README.md         # project README
├── CLAUDE.md         # project guardrails
├── cog.toml          # cocogitto configuration (commit checks, changelog, version tags)
├── lefthook.yml      # git hooks configuration
└── mise.toml         # tools required by the project, including kitsu
```

See each subfolder's README for details:
- [`infrastructure/`](./infrastructure)
- [`application/`](./application)
- [`docs/`](./docs)

## Getting Started

Tools are managed by [`mise`](https://mise.jdx.dev) (see
[`mise.toml`](./mise.toml)), including
[`kitsu`](https://github.com/samuelsulo/kitsu), which provides the
Terraform workflow and repository automations,
[`lefthook`](https://lefthook.dev), which manages git hooks,
[`cocogitto`](https://docs.cocogitto.io), which enforces Conventional
Commits and manages the changelog and version tags of `application/`
and `infrastructure/`, and the [GitHub CLI](https://cli.github.com)
(`gh`), used to publish GitHub releases on bump. There is no local
`scripts/` folder or Makefile.

After cloning, install once the git hooks defined in
[`lefthook.yml`](./lefthook.yml):

```
lefthook install
```

To release a new version of `application/` or `infrastructure/` once
it contains code, from the repository root:

```
cog bump --package application --auto
cog bump --package infrastructure --auto
```

This updates the `CHANGELOG.md` inside the corresponding folder
(`application/CHANGELOG.md` or `infrastructure/CHANGELOG.md`), creates
the bump commit and tags it `application/vX.Y.Z` or
`infrastructure/vX.Y.Z`, per the versioning convention in
[`CLAUDE.md`](./CLAUDE.md). It then pushes the commit and the tag, and
creates the corresponding GitHub release with the [`gh`
CLI](https://cli.github.com) (must be authenticated beforehand with
`gh auth login`), using that version's changelog entry as the release
notes.


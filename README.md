# Portfolio for Samuel Sulo

This repository manages the AWS infrastructure and the showcase website of Samuel Sulo. The binding rules for whoever works on a project born
from this template (structure, stack, security, delivery flow) are
defined in [`CLAUDE.md`](./CLAUDE.md) and apply to every client.

## Model

```
client -> project -> development -> delivery -> closure
```

Development and testing happen in a sandbox environment isolated in my AWS
account, deletable after delivery. Production lives exclusively in the
client's AWS account, reached only via cross-account `AssumeRole`, never
with permanent credentials in my possession.

## Structure

```
client-project/
├── infrastructure/   # AWS infrastructure in Terraform
├── docs/             # project documentation
├── .githooks/        # versioned git hooks (commit-msg, pre-commit)
├── README.md         # project README
└── CLAUDE.md         # project guardrails
├── website/          # Vue.js/TypeScript/Vite source of the site
├── tests/            # unit tests (Vitest) and e2e tests (Playwright)
```

See the README of each subfolder for details:
 - [`docs/`](./docs)
 - [`infrastructure/`](./infrastructure)
 - [`website/`](./website)

Terraform workflow, module vendoring, environment scaffolding, git hooks
installation and website deployment are handled by
[kitsu](https://github.com/samuelsulo/kitsu), installed via `mise` (see
[`mise.toml`](./mise.toml)): see its README for the full command
reference.

After cloning, install once the hook that checks commits and formats
Terraform before every commit:

```
kitsu hooks install
```

## Technology stack

- **Infrastructure**: Terraform and the official AWS provider.

## Documentation

The documentation of every client project lives in `docs/` and must be kept
up to date on every relevant change to the code or infrastructure.
The complete rules on what it must contain are in
[`CLAUDE.md`](./CLAUDE.md#8-mandatory-documentation).

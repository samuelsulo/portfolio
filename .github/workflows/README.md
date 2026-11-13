# Workflows

GitHub Actions workflows of this project. CI runs static checks only: no cloud credentials, no
plan or apply. Every workflow runs on every pull request, with no `paths` filter, so that a required
check is never skipped.

## Available workflows

| Workflow | File | Runs on | Purpose |
|---|---|---|---|
| Commits | [`commits.yml`](./commits.yml) | pull requests | `cog check` on the commits of the pull request: Conventional Commits and allowed scopes |
| Infrastructure CI | [`infrastructure-ci.yml`](./infrastructure-ci.yml) | pull requests | format checks, tflint and trivy on `infrastructure/` |
| Secrets scan | [`secrets-scan.yml`](./secrets-scan.yml) | pull requests, pushes to `main` | gitleaks |
| Web CI | [`web-ci.yml`](./web-ci.yml) | pull requests | checks, unit tests and build of `apps/web` |

## Conventions

- List every workflow in the table above in the same change that adds it.
- Runners are pinned to `ubuntu-24.04` and third-party actions to a major version.
- A component adds its own workflow when it is created: see the `repo-standard` skill.

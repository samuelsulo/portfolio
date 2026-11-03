# Workflows

GitHub Actions workflows for this project's CI.

Most workflows here are stack- and provider-specific: they are added
project by project as `application/` and `infrastructure/` are
scaffolded (build/test/deploy pipeline for the chosen application
stack, Terragrunt plan/apply for the chosen cloud provider).

## Available Workflows

| Workflow | File | Runs on | Purpose |
|---|---|---|---|
| Application CI | [`application-ci.yml`](./application-ci.yml) | Pull requests | Lint, format check, type check, unit tests, production build and end-to-end tests |
| Commits | [`commits.yml`](./commits.yml) | Pull requests | `cog check`: Conventional Commits and allowed scopes |
| Infrastructure CI | [`infrastructure-ci.yml`](./infrastructure-ci.yml) | Pull requests | `tofu fmt` and `terragrunt hcl fmt` checks, then `tflint` and `trivy` (no plan or apply in CI) |
| Secrets scan | [`secrets-scan.yml`](./secrets-scan.yml) | Pull requests and pushes to `main` | gitleaks over the full git history |

## Conventions

- List every workflow in the table above as soon as it is added: do
  not leave a workflow undocumented.
- Commit conventions (Conventional Commits, allowed scopes) are
  enforced locally via [`lefthook`](../../lefthook.yml) and
  [`cocogitto`](../../cog.toml) (see the root
  [`README.md`](../../README.md)). Since local hooks can be bypassed,
  add a workflow that runs `cog check` on pull requests to enforce the
  same rule in CI.
- Third-party actions are referenced by major version (`@v7`); Dependabot
  (see [`dependabot.yml`](../dependabot.yml)) keeps them and the npm
  dependencies up to date.
- Runners are pinned to `ubuntu-24.04`, not `ubuntu-latest`, so the image
  changes only when this repository decides to move to a newer one.
- Every workflow runs on every pull request, with no `paths` filter: the
  checks are required by the branch protection of `main`, and a required
  check that is skipped would block the merge forever.

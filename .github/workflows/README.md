# Workflows

GitHub Actions workflows for this project's CI.

Most workflows here are stack- and provider-specific: they are added
project by project as `application/` and `infrastructure/` are
scaffolded (build/test/deploy pipeline for the chosen application
stack, Terragrunt plan/apply for the chosen cloud provider).

## Available Workflows

| Workflow | File | Runs on | Purpose |
|---|---|---|---|

## Conventions

- List every workflow in the table above as soon as it is added: do
  not leave a workflow undocumented.
- Commit conventions (Conventional Commits, allowed scopes) are
  enforced locally via [`lefthook`](../../lefthook.yml) and
  [`cocogitto`](../../cog.toml) (see the root
  [`README.md`](../../README.md)). Since local hooks can be bypassed,
  add a workflow that runs `cog check` on pull requests to enforce the
  same rule in CI.

# CLAUDE.md: Infrastructure Guardrails

Rules for the Terragrunt/OpenTofu infrastructure layer. They add to the
repository-wide rules in the root `CLAUDE.md` (language, punctuation,
commit messages), which are not repeated here. See
[`README.md`](./README.md) for the structure and workflow.

## Structure

The layout (`live/`, `units/`, `modules/`, `templates/`, `scripts/`) is
fixed and must not be reorganized. Conventions for each folder live in
its own README, not duplicated here. Read the relevant README before
touching a folder.

## Hard rules

- Never modify anything under `modules/vendor/`: those are byte-for-byte
  copies from the catalog. A needed change means either combining modules
  in a stack, writing a new module under `modules/local/`, or updating
  the catalog itself, never editing the vendored copy.
- Never run `terraform` or `tofu` directly, except where a README says
  so. Workflow commands go through `terragrunt`, with tools and tasks
  from `mise` (`mise run catalog:vendor`, `mise run state:create-bucket`).
- Run Terragrunt from a stack's own directory, never from the repository
  root.
- Never `apply` to `production` without a manually reviewed `plan`
  first. Treat any change touching `live/production/` or cross-account
  role behavior with extra care.
- Don't create AWS resources directly in a stack if a unit already
  covers, or should cover, that competency.
- Every module keeps the same file set (`main.tf`, `variables.tf`,
  `outputs.tf`, `versions.tf`, `README.md`), every variable and output
  has a `description`, and every unit keeps `terragrunt.hcl` and
  `README.md`.
- Don't add ad hoc automation: workflow scripts live in `scripts/` and
  are exposed as `mise` tasks.

# CLAUDE.md: Infrastructure Guardrails

Rules for the Terragrunt/OpenTofu layer. They add to the repository-wide rules in the root
[`CLAUDE.md`](../CLAUDE.md) and to the `aws-terragrunt-standard` skill, which are not repeated
here. See [`README.md`](./README.md) for the structure and the workflow.

- Never run `terraform` or `tofu` directly, except `tofu fmt` and the module tests.
  Workflow commands go through `terragrunt`, tasks through `mise`.
- Run Terragrunt from `live/<account>/<region>` (or `_global`), never from the repository root.
- Never `apply` without a manually reviewed `plan`. Plan and apply run from the owner's
  terminal only. Treat `live/workload-prod/` and the cross-account DNS role with extra care.
- Never modify anything under `catalog/modules/vendor/`: combine modules in a stack, write a
  module in `catalog/modules/local/`, or change the module catalog.
- One unit per competency, one stack per deployable, defined in `catalog/stacks/` and
  instantiated with a `stack` block in `live/`. Never create a resource directly in `live/`.
- The repository is public: account IDs come from the environment
  (`mise.local.toml`, see `mise.local.example.toml`), never committed.
- DNS lives in the network-hub account and the state in the organization's bucket: both
  belong to the `aws-landing-zone` repository, never change them from here.

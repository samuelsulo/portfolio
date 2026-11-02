# Modules

Reusable OpenTofu modules, one per AWS competency, wrapped by the
Terragrunt units in [`../units/`](../units) and instantiated by the
stacks in [`../live/`](../live).

## Structure

```
modules/
├── vendor/     # 1:1 copies from a catalog, never modified
└── local/      # modules written for this project
```

See [`vendor/README.md`](./vendor/README.md) and [`local/README.md`](./local/README.md)
for the provenance and rules of each of the two subfolders.

## Common Conventions

Apply to modules in both subfolders:

- One AWS competency per module; no resource is created directly in a
  stack if a module already exists (or it makes sense to create one) for
  that purpose.
- Every module has the same file structure: `main.tf`, `variables.tf`,
  `outputs.tf`, `versions.tf`, `README.md`.
- Every variable and output has a `description`: each module's README
  Input/Output tables mirror them.
- Modules do not configure the backend or the AWS provider itself:
  that is [`../live/root.hcl`](../live/root.hcl)'s responsibility, so the same module works unchanged in
  every environment.


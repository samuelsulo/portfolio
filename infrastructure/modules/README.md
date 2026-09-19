# Modules

Reusable Terraform modules, one per AWS competency, composed together in
[`../live/main.tf`](../live/main.tf): the same set for every `environment`.

## Structure

```
modules/
├── vendor/     # 1:1 copies from terraform-aws-catalog, never modified
└── local/      # modules written for this project
```

See [`vendor/README.md`](./vendor/README.md) and [`local/README.md`](./local/README.md)
for the provenance and rules of each of the two subfolders.

## Common Conventions

Apply to modules in both subfolders:

- One AWS competency per module; no resource is created directly in
  `environments/` or `live/` if a module already exists (or it makes
  sense to create one) for that purpose.
- Every module has the same file structure: `main.tf`, `variables.tf`,
  `outputs.tf`, `versions.tf`, `README.md`.
- Every variable and output has a `description`: each module's README
  Input/Output tables mirror them.
- Modules do not configure the backend or the AWS provider itself:
  that is `live/`'s responsibility, so the same module works unchanged in
  every environment.


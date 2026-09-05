# Modules

Reusable Terraform modules, one per AWS concern, composed together in
[`../live/main.tf`](../live/main.tf): the same set for every `environment`
(CLAUDE.md §5: environments stay symmetric).

## Structure

```
modules/
├── vendor/     # 1:1 copies from terraform-aws-catalog, never modified
└── local/      # modules written for this project
```

See [`vendor/README.md`](./vendor/README.md) and [`local/README.md`](./local/README.md)
for the provenance and rules of each of the two subfolders
(CLAUDE.md §5).

## Common conventions

Apply to modules in both subfolders:

- One AWS concern per module; no resource is created directly in
  `environments/` or `live/` if a module for that purpose already exists
  (or it makes sense to create one).
- Every module has the same file structure: `main.tf`, `variables.tf`,
  `outputs.tf`, `versions.tf`, `README.md`.
- Every variable and output has a `description`: each module's README
  Input/Output tables mirror them.
- Modules don't configure the backend or the AWS provider itself (aside
  from the `aws.us_east_1` alias required by `website` for ACM/CloudFront):
  that's `live/`'s responsibility, so the same module works unchanged in
  every environment.
- Tags (`Project`, `Environment`, `ManagedBy`) are applied once
  via `default_tags` on the provider in `live/providers.tf`, not repeated
  in every module.

# Local

Terraform modules written specifically for this project: this folder is
used only when no `terraform-aws-catalog` module covers the required
scope and the need is not generic enough to justify adding a new module
to the catalog. Unlike [`../vendor/`](../vendor), these modules are owned by the
project and can be modified freely.

## Available Modules

| Module | Purpose |
|---|---|

## Adding a Module

```
kitsu terraform scaffold module <name>
```

Creates `modules/local/<name>/{main,variables,outputs,versions}.tf` + `README.md`.
After filling it in, wire it up in [`../../live/main.tf`](../../live/main.tf)
and add a row to the table above.

# Local

Terraform modules written specifically for this project: this folder is
used only when no module from `terraform-aws-catalog` covers the needed
scope and the need isn't generic enough to justify adding a new module to
the catalog (CLAUDE.md §5). Unlike [`../vendor/`](../vendor), these
modules are owned by the project and can be modified freely.

## Available modules

| Module | Purpose |
|---|---|

## Adding a module

```
make scaffold-module MODULE=<name>
```

Creates `modules/local/<name>/{main,variables,outputs,versions}.tf` + `README.md`.
After filling it in, wire it into [`../../live/main.tf`](../../live/main.tf)
and add a row to the table above.

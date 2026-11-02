# Local

Terraform modules written specifically for this project: this folder is
used only when no catalog module covers the required
scope and the need is not generic enough to justify adding a new module
to the catalog. Unlike [`../vendor/`](../vendor), these modules are owned by the
project and can be modified freely.

## Adding a Module

Create `modules/local/<name>/{main,variables,outputs,versions}.tf` +
`README.md` by hand, matching the file set of the other modules. After
filling it in, wrap it in a unit under [`../../units/`](../../units).

# Vendor

1:1 copies of modules taken from the catalog.

## Rules

- The code is **copied here** at the moment the project needs it. Never a
  remote Git `source` pointing to the catalog, not even in development:
  the project must be self-sufficient from the start, not just at
  delivery.
- A module copied here **must never be modified**: it stays a 1:1 copy,
  byte for byte, of the one in the catalog, to remain traceable and
  aligned with its version.
- Provenance lives in a `VENDORED.md` file alongside the module's files
  (source, module name, tag, commit, date), generated automatically by
  the copy command. Never a comment tucked into the Terraform code: that
  would make the module differ, byte for byte, from the original in the
  catalog.
- If a catalog module does not exactly cover the scope required by the
  project, it must not be adapted here: either multiple modules are
  combined in a stack under [`../../live/`](../../live), or (if the scope is generic) a new module is added
  to the catalog itself. If instead the need is genuinely specific to
  this client, the module must be written in [`../local/`](../local), not
  here.

## Adding a Module

```
mise run catalog:list                      # list tags available in the catalog
mise run catalog:vendor <name>/<tag>
```

`catalog:vendor` copies `modules/<name>/` from the catalog, at the given
tag, into `modules/vendor/<name>/` and writes
`modules/vendor/<name>/VENDORED.md` with the provenance (source, module
name, tag, commit, date). After copying, wrap the module in a unit under
[`../../units/`](../../units).

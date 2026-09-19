# Vendor

1:1 copies of modules taken from `terraform-aws-catalog` (a separate repo
with Terraform modules reused across all client projects).

## Available Modules

| Module | Purpose |
|---|---|

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
  combined in `live/`, or (if the scope is generic) a new module is added
  to the catalog itself. If instead the need is genuinely specific to
  this client, the module must be written in [`../local/`](../local), not
  here.

## Versioning

The catalog is a monorepo with multiple modules: a single tag for the
whole repo (e.g. `v2.0.0`) would confuse the versioning of unrelated
modules (a breaking change in module A would bump the major version for
B too, even if B did not change). For this reason each module is tagged
**individually**, with tags of the form `<module-name>/vX.Y.Z` (e.g.
`s3-static-site/v1.3.0`, `budgets/v2.0.0`): a bump only concerns the
module it belongs to.

## Adding a Module

```
kitsu terraform catalog list                  # list modules available in the catalog
kitsu terraform catalog versions <name>       # list available versions of a module
kitsu terraform catalog vendor <name> <tag>   # copy that version into modules/vendor/<name>/
```

`catalog vendor` clones `terraform-aws-catalog` at the given tag, copies
`modules/<name>/` from the catalog into `modules/vendor/<name>/` and
writes `modules/vendor/<name>/VENDORED.md` with the provenance. The
catalog's Git URL defaults to `terraform.catalog_repo` in kitsu's config
file, or can be passed inline with `--catalog-repo` on each of these
commands. After copying, wire the module up in
[`../../live/main.tf`](../../live/main.tf) and add a row to the table
above.

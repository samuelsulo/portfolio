# Vendor

1:1 copies of modules taken from `terraform-aws-catalog` (a separate repo
with the Terraform modules reused across all client projects).

## Available modules

| Module | Purpose |
|---|---|

## Rules (CLAUDE.md §5)

- The code is **copied here** the moment the project needs it. Never a
  remote Git `source` pointing at the catalog, not even in development:
  the project must be self-sufficient right away, not only at delivery.
- A module copied here **must never be modified**: it stays a 1:1,
  byte-for-byte copy of the one in the catalog, to remain traceable and
  aligned with its version.
- Provenance lives in a `VENDORED.md` file next to the module's files
  (source, module name, tag, commit, date), generated automatically by
  the copy command. Never a comment stuffed into the Terraform code: that
  would make the module differ, byte for byte, from the original in the
  catalog.
- If a catalog module doesn't cover exactly the scope required by the
  project, it must not be adapted here: multiple modules are combined in
  `live/`, or (if the scope is generic) a new module is added to the
  catalog itself. If instead the need is truly specific to this client,
  the module must be written in [`../local/`](../local), not here.

## Versioning

The catalog is a monorepo with multiple modules: a single tag for the
whole repo (e.g. `v2.0.0`) would conflate the versioning of unrelated
modules (a breaking change in module A would bump the major version for B
too, even though it may not have changed). That's why each module is
tagged **individually**, with tags of the form `<module-name>/vX.Y.Z`
(e.g. `s3-static-site/v1.3.0`, `budgets/v2.0.0`): a bump only concerns the
module it belongs to.

## Adding a module

```
make catalog-modules                        # list the modules available in the catalog
make catalog-versions MODULE=<name>         # list the available versions of a module
make vendor-module REF=<name>/<tag>         # copy that version into modules/vendor/<name>/
```

`vendor-module` derives the module name directly from `REF` (the tag is
always in the form `<name>/<tag>`), clones `terraform-aws-catalog` at the
given tag, copies `modules/<name>/` from the catalog into
`modules/vendor/<name>/` and writes `modules/vendor/<name>/VENDORED.md`
with the provenance. `CATALOG_REPO` must be set once in
[`../../Makefile`](../../Makefile) (or passed inline to each of these
commands). After copying, wire the module into
[`../../live/main.tf`](../../live/main.tf) and add a row to the table
above.

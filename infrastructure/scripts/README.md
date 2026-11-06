# Scripts

Helper scripts backing the `mise` tasks: vendoring code from a catalog
into [`../modules/vendor/`](../modules/vendor), and linting the code.

Not called directly day to day: use the `mise` tasks in
[`../mise.toml`](../mise.toml), which pass `$CATALOG_REPO` for you.

## Files

- [`catalog-list.sh`](./catalog-list.sh) (`mise run catalog:list`): lists
  the `<module>/<version>` tags available in the catalog repo, via
  `git ls-remote --tags`.
- [`catalog-vendor.sh`](./catalog-vendor.sh) (`mise run catalog:vendor
  <module>/<version>`): shallow-clones the catalog at that tag, copies
  `modules/<module>` into `modules/vendor/<module>` (replacing anything
  already there), and writes a `VENDORED.md` provenance file (source,
  name, ref, commit, date) alongside it.

- [`lint.sh`](./lint.sh) (`mise run lint`): runs `tflint` ([`.tflint.hcl`](../.tflint.hcl))
  and `trivy` (HIGH and CRITICAL only; the findings accepted on purpose
  are listed with their reason in [`.trivyignore.yaml`](../.trivyignore.yaml)).
  Also run by the pre-commit hook and by CI.

## Conventions

- Plain bash (`set -euo pipefail`), no other runtime dependency beyond
  `git`.
- Idempotent: re-running `catalog-vendor.sh` for the same `<module>/<version>`
  overwrites the destination with the same content and the same
  `VENDORED.md`.

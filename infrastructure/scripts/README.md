# Scripts

Helper scripts backing the `mise` tasks: vendoring code from a catalog
into [`../modules/vendor/`](../modules/vendor), and bootstrapping the
state bucket.

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
- [`state-create-bucket.sh`](./state-create-bucket.sh) (`mise run
  state:create-bucket <aws-profile> [region]`): creates, once per
  account, the shared state bucket `tfstate-<account-id>-<region>-an`
  (the `state_bucket` of [`../live/root.hcl`](../live/root.hcl)) in the
  account-regional namespace. It blocks public access, enables
  versioning and SSE-S3 encryption, denies non-TLS requests, expires
  noncurrent versions after 90 days (keeping the 5 most recent) and tags
  the bucket. Requires the `aws` CLI. The region defaults to `eu-south-1`.

## Conventions

- Plain bash (`set -euo pipefail`), no other runtime dependency beyond
  `git` (and the `aws` CLI for `state-create-bucket.sh`).
- Idempotent: re-running `catalog-vendor.sh` for the same `<module>/<version>`
  overwrites the destination with the same content and the same
  `VENDORED.md`; `state-create-bucket.sh` does nothing if the bucket already
  exists, and never modifies an existing one.

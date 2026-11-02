#!/usr/bin/env bash
#
# catalog-vendor.sh — vendors a module from a catalog repo tag into a local
# infrastructure directory, in plain bash.
#
# Usage: catalog-vendor.sh <catalog-repo-owner/repo> <module>/<version>
#
#   catalog-repo    GitHub "owner/repo" of the catalog
#   module/version  tag to vendor, e.g. "contact-api/v1.0.0" (as listed by
#                    `git ls-remote --tags`)
#
# Copies modules/<module> from the catalog tag "<module>/<version>" into
# modules/vendor/<module>, replacing anything already there, and writes a
# VENDORED.md provenance file alongside it.

set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "usage: $0 <owner/repo> <module>/<version>" >&2
  exit 1
fi

owner_repo=$1
ref=$2
module=${ref%/*}

repo="https://github.com/${owner_repo}.git"

tmp_dir=$(mktemp -d "${TMPDIR:-/tmp}/vendor-XXXXXX")
trap 'rm -rf "$tmp_dir"' EXIT

git -c advice.detachedHead=false clone --quiet --depth 1 --branch "$ref" "$repo" "$tmp_dir"

commit=$(git -C "$tmp_dir" rev-parse HEAD)
vendored_on=$(date -u +%Y-%m-%d)

src_dir="$tmp_dir/modules/$module"
dest_dir="modules/vendor/$module"

if [[ ! -d "$src_dir" ]]; then
  echo "Module \"$module\" not found in catalog at ref \"$ref\"" >&2
  exit 1
fi

rm -rf "$dest_dir"
mkdir -p "$(dirname "$dest_dir")"
cp -R "$src_dir" "$dest_dir"
# Defensive: shouldn't carry a nested .git, but strip one if it somehow
# does (e.g. vendored from a submodule).
rm -rf "$dest_dir/.git"

cat > "$dest_dir/VENDORED.md" <<EOF
# Vendored module

Copied verbatim from the catalog. Do not modify directly: re-run
\`scripts/catalog-vendor.sh\` instead.

| | |
|---|---|
| Source | $repo |
| Module | $module |
| Ref | $ref |
| Commit | $commit |
| Vendored on | $vendored_on |
EOF

echo "✓ $dest_dir/ vendored from $ref (commit $commit)"

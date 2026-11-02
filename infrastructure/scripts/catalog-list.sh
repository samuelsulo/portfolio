#!/usr/bin/env bash
#
# catalog-list.sh — lists module/version tags available in a catalog repo.
#
# Usage: catalog-list.sh <catalog-repo-owner/repo>

set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "usage: $0 <owner/repo>" >&2
  exit 1
fi

owner_repo=$1
repo="https://github.com/${owner_repo}.git"

git ls-remote --tags "$repo" | grep -v '\^{}' | sed 's#.*refs/tags/##'

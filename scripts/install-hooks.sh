#!/usr/bin/env bash
#
# One-time setup after cloning: point Git at the hooks tracked in
# .githooks/, so they're versioned with the repo instead of living only in
# .git/hooks/ (which git never tracks). See CLAUDE.md §10.
#
# Usage:
#   ./scripts/install-hooks.sh

set -euo pipefail

repo_root=$(git rev-parse --show-toplevel)

git -C "$repo_root" config core.hooksPath .githooks
chmod +x "$repo_root"/.githooks/*

echo "✓ Git hooks installed (core.hooksPath -> .githooks/)."

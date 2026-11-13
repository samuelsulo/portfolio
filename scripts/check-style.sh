#!/usr/bin/env bash
# Style checks for the universal rules that a tool can verify.
#   1. No em dash (U+2014) in any text file.
#   2. New files and folders are named in kebab-case, with the exceptions listed below.
#
# Usage:
#   scripts/check-style.sh --staged   staged files (em dash) and files being added or renamed (names)
#   scripts/check-style.sh --all      every tracked file (for audits: reports legacy names too)
#
# Exit code 0 when everything passes, 1 when something is reported.

set -euo pipefail

mode="${1:-}"
case "$mode" in
  --staged)
    text_files="$(git diff --cached --name-only --diff-filter=ACMR)"
    name_files="$(git diff --cached --name-only --diff-filter=AR)"
    ;;
  --all)
    text_files="$(git ls-files)"
    name_files="$text_files"
    ;;
  *)
    echo "Usage: $0 --staged | --all" >&2
    exit 2
    ;;
esac

# The em dash is written as bytes so that this script does not contain it.
em_dash="$(printf '\342\200\224')"

status=0
count=0

# Vendored copies are byte-for-byte copies of another repo and are never edited; dependencies and
# build output are not ours either.
excluded() {
  case "/$1" in
    */modules/vendor/*|*/node_modules/*|*/dist/*|*/.plans/*|*/.terraform/*) return 0 ;;
  esac
  return 1
}

# 1. Em dash.
while IFS= read -r file; do
  [[ -n "$file" && -f "$file" ]] || continue
  excluded "$file" && continue
  if hits="$(LC_ALL=C grep -InF -- "$em_dash" "$file")"; then
    while IFS= read -r line; do
      echo "em dash: $file:${line:0:110}" >&2
      count=$((count + 1))
    done <<<"$hits"
    status=1
  fi
done <<<"$text_files"

# 2. kebab-case names.
kebab='^[a-z0-9]+([.-][a-z0-9]+)*$'
upper_doc='^[A-Z][A-Z0-9_]*(\.[a-z]+)*$'
pascal_component='^[A-Z][A-Za-z0-9]*(\.[a-z]+)*\.(vue|ts)$'
composable='^use[A-Z][A-Za-z0-9]*(\.[a-z]+)*\.(ts|js)$'
# Font files and their licenses keep the name given by the font project.
font_file='\.(ttf|otf|woff|woff2)$'
font_license='-OFL\.txt$'

segment_ok() {
  local s="$1"
  [[ "$s" == .* ]] && return 0
  [[ "$s" == "_global" ]] && return 0
  [[ "$s" =~ $kebab ]] && return 0
  [[ "$s" =~ $upper_doc ]] && return 0
  [[ "$s" =~ $pascal_component ]] && return 0
  [[ "$s" =~ $composable ]] && return 0
  [[ "$s" =~ $font_file ]] && return 0
  [[ "$s" =~ $font_license ]] && return 0
  return 1
}

while IFS= read -r file; do
  [[ -n "$file" ]] || continue
  excluded "$file" && continue
  IFS='/' read -r -a segments <<<"$file"
  for s in "${segments[@]}"; do
    if ! segment_ok "$s"; then
      echo "name not kebab-case: $file (segment '$s')" >&2
      count=$((count + 1))
      status=1
      break
    fi
  done
done <<<"$name_files"

[[ $status -ne 0 ]] && echo "check-style: $count finding(s)" >&2
exit "$status"

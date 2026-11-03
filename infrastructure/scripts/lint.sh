#!/usr/bin/env bash
# lint.sh - static checks of the infrastructure code:
#   - tflint: Terraform and AWS rules (.tflint.hcl)
#   - trivy:  security misconfigurations, HIGH and CRITICAL only
#             (accepted findings, with the reason, in .trivyignore.yaml)
#
# Run from anywhere: it works on the infrastructure/ folder. Usage:
#   mise run lint
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

echo "==> tflint"
tflint --init >/dev/null
tflint --recursive

echo "==> trivy"
trivy config \
  --severity HIGH,CRITICAL \
  --ignorefile .trivyignore.yaml \
  --skip-dirs "**/.terragrunt-*" \
  --exit-code 1 \
  --quiet \
  .

terraform {
  # use_lockfile in the S3 backend (native locking, no DynamoDB) requires
  # Terraform >= 1.10, see infrastructure/environments/*/backend.hcl.
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

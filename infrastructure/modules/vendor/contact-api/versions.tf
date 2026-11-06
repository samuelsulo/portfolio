terraform {
  required_version = ">= 1.9.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"

      # The Route 53 records are created with an "aws.dns" alias provider, so
      # the hosted zone can live in another account. To use a zone of the same
      # account, pass the default provider for it: `aws.dns = aws`.
      configuration_aliases = [aws.dns]
    }
  }
}

terraform {
  required_version = ">= 1.9.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 6.37.0, < 7.0.0"

      # ACM certificates for CloudFront must be requested in us-east-1
      # regardless of the stack's region: the caller must pass a second
      # "aws.us_east_1" alias provider in the module's `providers` block.
      #
      # The Route 53 records are created with an "aws.dns" alias provider, so
      # the hosted zone can live in another account. To use a zone of the same
      # account, pass the default provider for it: `aws.dns = aws`.
      configuration_aliases = [aws.us_east_1, aws.dns]
    }
  }
}

terraform {
  required_version = ">= 1.9.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 6.37.0, < 7.0.0"

      # ACM certificates for CloudFront must be requested in us-east-1
      # regardless of the stack's region: the caller must pass a second
      # "aws.us_east_1" alias provider in the module's `providers` block.
      configuration_aliases = [aws.us_east_1]
    }
  }
}

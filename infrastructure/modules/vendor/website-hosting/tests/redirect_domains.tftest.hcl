mock_provider "aws" {
  mock_resource "aws_cloudfront_function" {
    defaults = {
      arn = "arn:aws:cloudfront::123456789012:function/example"
    }
  }
}

mock_provider "aws" {
  alias = "us_east_1"

  mock_resource "aws_acm_certificate" {
    defaults = {
      arn = "arn:aws:acm:us-east-1:123456789012:certificate/00000000-0000-0000-0000-000000000000"
    }
  }
}

variables {
  s3_bucket_name                        = "example-website"
  s3_bucket_namespace                   = "global"
  cloudfront_distribution_name          = "example-website"
  cloudfront_origin_access_control_name = "example-website-oac"
  s3_bucket_force_destroy               = false
  s3_bucket_versioning_enabled          = true
  domain_name                           = "example.it"
  route53_zone_id                       = "Z0123456789ABCDEFGHIJ"
  redirect_domain_names                 = ["www.example.it"]
  cloudfront_function_name              = "example-website-redirect"
}

run "redirect_domain_is_wired_everywhere" {
  command = plan

  assert {
    condition     = aws_cloudfront_distribution.this.aliases == toset(["example.it", "www.example.it"])
    error_message = "The distribution must answer to the primary and the redirect domains."
  }

  assert {
    condition     = aws_acm_certificate.this.subject_alternative_names == toset(["www.example.it"])
    error_message = "The redirect domain must be a SAN of the certificate."
  }

  assert {
    condition     = length(aws_cloudfront_function.viewer_request) == 1 && aws_cloudfront_function.viewer_request[0].name == "example-website-redirect"
    error_message = "The CloudFront Function must be created with the given name."
  }

  assert {
    condition     = contains(keys(aws_route53_record.redirect_alias), "www.example.it")
    error_message = "The redirect domain must get its own alias record."
  }

  assert {
    condition     = strcontains(aws_cloudfront_function.viewer_request[0].code, "const PRIMARY_DOMAIN = \"example.it\";")
    error_message = "The function must redirect to the primary domain."
  }
}

run "redirect_domain_cannot_be_the_primary_domain" {
  command = plan

  variables {
    redirect_domain_names = ["example.it"]
  }

  expect_failures = [var.redirect_domain_names]
}

run "redirect_domain_cannot_be_a_wildcard" {
  command = plan

  variables {
    redirect_domain_names = ["*.example.it"]
  }

  expect_failures = [var.redirect_domain_names]
}

run "redirect_function_name_is_required_with_redirect_domains" {
  command = plan

  variables {
    cloudfront_function_name = null
  }

  expect_failures = [var.cloudfront_function_name]
}

run "deprecated_function_name_is_still_honored" {
  command = plan

  variables {
    cloudfront_function_name          = null
    cloudfront_redirect_function_name = "legacy-name"
  }

  assert {
    condition     = aws_cloudfront_function.viewer_request[0].name == "legacy-name"
    error_message = "cloudfront_redirect_function_name must keep working."
  }
}

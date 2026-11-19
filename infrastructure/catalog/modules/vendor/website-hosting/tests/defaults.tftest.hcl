mock_provider "aws" {
  mock_resource "aws_cloudfront_function" {
    defaults = {
      arn = "arn:aws:cloudfront::123456789012:function/example"
    }
  }
}

mock_provider "aws" {
  alias = "dns"
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
}

run "defaults_serve_only_the_primary_domain" {
  command = plan

  assert {
    condition     = length(aws_cloudfront_function.viewer_request) == 0
    error_message = "No CloudFront Function must be created without redirect_domain_names."
  }

  assert {
    condition     = length(aws_route53_record.redirect_alias) == 0
    error_message = "No redirect alias record must be created without redirect_domain_names."
  }

  assert {
    condition     = aws_cloudfront_distribution.this.aliases == toset(["example.it"])
    error_message = "The distribution must only answer to the primary domain."
  }

  assert {
    condition     = length(aws_acm_certificate.this.subject_alternative_names) == 0
    error_message = "The certificate must not carry any SAN."
  }
}

run "defaults_keep_the_spa_behavior" {
  command = plan

  assert {
    condition = alltrue([
      for r in aws_cloudfront_distribution.this.custom_error_response :
      r.response_code == 200 && r.response_page_path == "/index.html"
    ]) && length(aws_cloudfront_distribution.this.custom_error_response) == 2
    error_message = "403 and 404 must be answered with /index.html and status 200 by default."
  }

  assert {
    condition     = length(aws_cloudfront_response_headers_policy.security) == 0
    error_message = "No response headers policy must be created by default."
  }

  assert {
    condition     = aws_cloudfront_distribution.this.default_cache_behavior[0].response_headers_policy_id == null
    error_message = "No response headers policy must be attached by default."
  }
}

run "defaults_lifecycle_rule" {
  command = plan

  assert {
    condition     = aws_s3_bucket_lifecycle_configuration.this.rule[0].noncurrent_version_expiration[0].noncurrent_days == 30
    error_message = "Noncurrent versions must expire after 30 days by default."
  }

  assert {
    condition     = aws_s3_bucket_lifecycle_configuration.this.rule[0].noncurrent_version_expiration[0].newer_noncurrent_versions == 3
    error_message = "The latest 3 noncurrent versions must be kept by default."
  }

  assert {
    condition     = aws_s3_bucket_lifecycle_configuration.this.rule[0].abort_incomplete_multipart_upload[0].days_after_initiation == 7
    error_message = "Incomplete multipart uploads must be aborted after 7 days by default."
  }
}

run "custom_lifecycle_rule" {
  command = plan

  variables {
    s3_noncurrent_version_expiration_days     = 90
    s3_noncurrent_versions_to_keep            = 5
    s3_abort_incomplete_multipart_upload_days = 1
  }

  assert {
    condition     = aws_s3_bucket_lifecycle_configuration.this.rule[0].noncurrent_version_expiration[0].noncurrent_days == 90
    error_message = "s3_noncurrent_version_expiration_days must be applied."
  }

  assert {
    condition     = aws_s3_bucket_lifecycle_configuration.this.rule[0].noncurrent_version_expiration[0].newer_noncurrent_versions == 5
    error_message = "s3_noncurrent_versions_to_keep must be applied."
  }

  assert {
    condition     = aws_s3_bucket_lifecycle_configuration.this.rule[0].abort_incomplete_multipart_upload[0].days_after_initiation == 1
    error_message = "s3_abort_incomplete_multipart_upload_days must be applied."
  }
}

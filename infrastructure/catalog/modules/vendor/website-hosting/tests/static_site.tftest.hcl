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
  spa_mode                              = false
}

run "error_page_answers_403_and_404" {
  command = plan

  variables {
    error_page_path = "/404.html"
  }

  assert {
    condition     = length(aws_cloudfront_distribution.this.custom_error_response) == 2
    error_message = "Both 403 and 404 must be mapped."
  }

  assert {
    condition = alltrue([
      for r in aws_cloudfront_distribution.this.custom_error_response :
      contains([403, 404], r.error_code) && r.response_code == 404 && r.response_page_path == "/404.html" && r.error_caching_min_ttl == 10
    ])
    error_message = "403 and 404 must be answered with /404.html, status 404 and a 10 seconds error caching."
  }
}

run "error_page_with_custom_status_and_ttl" {
  command = plan

  variables {
    error_page_path       = "/oops.html"
    error_response_code   = 410
    error_caching_min_ttl = 60
  }

  assert {
    condition = alltrue([
      for r in aws_cloudfront_distribution.this.custom_error_response :
      r.response_code == 410 && r.response_page_path == "/oops.html" && r.error_caching_min_ttl == 60
    ])
    error_message = "error_response_code and error_caching_min_ttl must be applied."
  }
}

run "no_error_responses_without_spa_mode_nor_error_page" {
  command = plan

  assert {
    condition     = length(aws_cloudfront_distribution.this.custom_error_response) == 0
    error_message = "No custom error response must be configured."
  }
}

run "error_page_cannot_be_combined_with_spa_mode" {
  command = plan

  variables {
    spa_mode        = true
    error_page_path = "/404.html"
  }

  expect_failures = [var.error_page_path]
}

run "error_page_must_start_with_a_slash" {
  command = plan

  variables {
    error_page_path = "404.html"
  }

  expect_failures = [var.error_page_path]
}

run "rewrite_creates_the_function" {
  command = plan

  variables {
    rewrite_html_pages       = true
    cloudfront_function_name = "example-website-viewer-request"
  }

  assert {
    condition     = length(aws_cloudfront_function.viewer_request) == 1 && aws_cloudfront_function.viewer_request[0].name == "example-website-viewer-request"
    error_message = "The function must be created with the given name."
  }

  assert {
    condition     = strcontains(aws_cloudfront_function.viewer_request[0].code, ".html")
    error_message = "The function must rewrite to .html."
  }

  assert {
    condition     = !strcontains(aws_cloudfront_function.viewer_request[0].code, "PRIMARY_DOMAIN")
    error_message = "Without redirect domains the function must not redirect."
  }

  assert {
    condition     = length(aws_cloudfront_distribution.this.default_cache_behavior[0].function_association) == 1
    error_message = "The function must be associated to the default cache behavior."
  }
}

run "rewrite_and_redirect_share_one_function" {
  command = plan

  variables {
    rewrite_html_pages       = true
    redirect_domain_names    = ["www.example.it"]
    cloudfront_function_name = "example-website-viewer-request"
  }

  assert {
    condition     = length(aws_cloudfront_function.viewer_request) == 1
    error_message = "Redirect and rewrite must share a single function."
  }

  assert {
    condition     = strcontains(aws_cloudfront_function.viewer_request[0].code, "const PRIMARY_DOMAIN = \"example.it\";") && strcontains(aws_cloudfront_function.viewer_request[0].code, "function rewrite(request)")
    error_message = "The function must contain both the redirect and the rewrite."
  }

  assert {
    condition     = length(aws_cloudfront_distribution.this.default_cache_behavior[0].function_association) == 1
    error_message = "Only one viewer-request association is allowed."
  }
}

run "function_name_is_required_with_rewrite" {
  command = plan

  variables {
    rewrite_html_pages = true
  }

  expect_failures = [var.cloudfront_function_name]
}

run "security_headers_are_attached" {
  command = plan

  variables {
    security_headers_enabled                = true
    cloudfront_response_headers_policy_name = "example-website-security"
    content_security_policy                 = "default-src 'self'"
    permissions_policy                      = "camera=()"
  }

  assert {
    condition     = length(aws_cloudfront_response_headers_policy.security) == 1 && aws_cloudfront_response_headers_policy.security[0].name == "example-website-security"
    error_message = "The response headers policy must be created."
  }

  assert {
    condition     = aws_cloudfront_response_headers_policy.security[0].security_headers_config[0].strict_transport_security[0].access_control_max_age_sec == 31536000 && aws_cloudfront_response_headers_policy.security[0].security_headers_config[0].strict_transport_security[0].preload == false
    error_message = "HSTS must last one year, without preload."
  }

  assert {
    condition     = aws_cloudfront_response_headers_policy.security[0].security_headers_config[0].content_security_policy[0].content_security_policy == "default-src 'self'"
    error_message = "The CSP must be applied."
  }

  assert {
    condition     = aws_cloudfront_response_headers_policy.security[0].custom_headers_config[0].items[*].header == tolist(["Permissions-Policy"])
    error_message = "The Permissions-Policy header must be sent."
  }
}

run "security_headers_attachment_is_checked_on_apply" {
  command = apply

  # The mocked policy document is not valid JSON, which S3 would reject
  override_data {
    target = data.aws_iam_policy_document.bucket_policy
    values = {
      json = "{}"
    }
  }

  variables {
    security_headers_enabled                = true
    cloudfront_response_headers_policy_name = "example-website-security"
  }

  assert {
    condition     = aws_cloudfront_distribution.this.default_cache_behavior[0].response_headers_policy_id == aws_cloudfront_response_headers_policy.security[0].id
    error_message = "The policy must be attached to the default cache behavior."
  }

  assert {
    condition     = length(aws_cloudfront_response_headers_policy.security[0].security_headers_config[0].content_security_policy) == 0
    error_message = "Without content_security_policy the header must not be sent."
  }
}

run "security_headers_name_is_required" {
  command = plan

  variables {
    security_headers_enabled = true
  }

  expect_failures = [var.cloudfront_response_headers_policy_name]
}

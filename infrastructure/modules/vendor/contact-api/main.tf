data "aws_region" "current" {}

locals {
  name = "${var.name_prefix}-contact"

  # OAS body handed to aws_api_gateway_rest_api. Defines the ContactViaEmail
  # operation (POST /email) and its CORS preflight (OPTIONS /email). Future
  # channels (phone, WhatsApp, Teams, Slack, ...) are meant to be added as
  # sibling paths (e.g. /phone) in this same document, each with its own
  # integration, next to this one.
  openapi_body = templatefile("${path.module}/openapi/openapi.yaml", {
    name_prefix         = var.name_prefix
    aws_region          = data.aws_region.current.region
    ses_role_arn        = aws_iam_role.ses_integration.arn
    recipient_email     = var.contact_via_email_recipient
    ses_template_name   = aws_ses_template.contact.name
    cors_allowed_origin = var.cors_allowed_origin
  })
}

# SES identity verified as both the Source and the Destination of every
# ContactViaEmail notification. AWS sends a confirmation link to this
# address; the identity stays unverified until it's opened.
resource "aws_ses_email_identity" "recipient" {
  email = var.contact_via_email_recipient
}

# Template rendered for the notification sent to contact_via_email_recipient.
# The html/text bodies are not read from a file in this module: they are
# real content that varies per client, so they arrive as variables (see
# contact_via_email_html_template/contact_via_email_text_template),
# typically the result of a file() call on a copy of the template living
# in the consumer project.
resource "aws_ses_template" "contact" {
  name    = local.name
  subject = var.contact_via_email_subject
  html    = var.contact_via_email_html_template
  text    = var.contact_via_email_text_template
}

# Role assumed by API Gateway (not by the caller of the API) to call SES on
# behalf of the ContactViaEmail integration. Scoped to the single action it
# needs, with a condition tying it to contact_via_email_recipient so it
# cannot be used to send as a different identity.
resource "aws_iam_role" "ses_integration" {
  name = "${local.name}-ses-integration"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "apigateway.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "ses_integration" {
  name = "${local.name}-ses-send-templated-email"
  role = aws_iam_role.ses_integration.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "ses:SendTemplatedEmail"
      Resource = "*"
      Condition = {
        StringEquals = {
          "ses:FromAddress" = var.contact_via_email_recipient
        }
      }
    }]
  })
}

resource "aws_api_gateway_rest_api" "this" {
  name = local.name
  body = local.openapi_body

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

# Forces a new deployment whenever the OAS body changes, so a `plan`/`apply`
# after editing the operation, integration or mapping templates actually
# rolls out, not just updates the imported definition.
resource "aws_api_gateway_deployment" "this" {
  rest_api_id = aws_api_gateway_rest_api.this.id

  triggers = {
    redeployment = sha1(local.openapi_body)
  }

  lifecycle {
    create_before_destroy = true
  }
}

# A single, fixed stage: a breaking change to the API's contract is
# already tracked by bumping this module's own major version (a new
# contact-api/vX.0.0 tag), so tying the stage name to that version too
# would be redundant, and would change the API's URL on every major
# release for no benefit (a major bump means redeploying this module, not
# running two stages side by side).
resource "aws_api_gateway_stage" "this" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  deployment_id = aws_api_gateway_deployment.this.id
  stage_name    = "default"
}

# The API is public and unauthenticated: throttling protects both the AWS
# bill and the SES sending reputation of contact_via_email_recipient from
# abuse (e.g. scripted spam submissions). "*/*" covers every operation and
# channel alike, current (POST/OPTIONS /email) and future.
resource "aws_api_gateway_method_settings" "this" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  stage_name  = aws_api_gateway_stage.this.stage_name
  method_path = "*/*"

  settings {
    throttling_rate_limit  = var.throttling_rate_limit
    throttling_burst_limit = var.throttling_burst_limit
  }
}

# ACM certificate for the custom domain. Regional (not us-east-1): unlike
# CloudFront, an API Gateway regional custom domain requires its certificate
# in the same region as the API itself, so no second provider alias is
# needed here.
resource "aws_acm_certificate" "this" {
  domain_name       = var.domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.this.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  zone_id = var.route53_zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = 300
  records = [each.value.record]
}

resource "aws_acm_certificate_validation" "this" {
  certificate_arn         = aws_acm_certificate.this.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

resource "aws_api_gateway_domain_name" "this" {
  domain_name              = var.domain_name
  regional_certificate_arn = aws_acm_certificate_validation.this.certificate_arn

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

# Maps the custom domain directly onto the stage with an empty base path,
# so the OAS paths (e.g. /email) show up unprefixed under the custom
# domain, exactly as defined in the OAS document.
resource "aws_api_gateway_base_path_mapping" "this" {
  api_id      = aws_api_gateway_rest_api.this.id
  stage_name  = aws_api_gateway_stage.this.stage_name
  domain_name = aws_api_gateway_domain_name.this.domain_name
}

resource "aws_route53_record" "api" {
  zone_id = var.route53_zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_api_gateway_domain_name.this.regional_domain_name
    zone_id                = aws_api_gateway_domain_name.this.regional_zone_id
    evaluate_target_health = true
  }
}

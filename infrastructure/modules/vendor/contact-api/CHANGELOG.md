# Changelog

All notable changes to this module are documented in this file, in
[Keep a Changelog](https://keepachangelog.com/) format.

## [1.0.1] - 2026-08-31

### Fixed

- The `POST /email` integration's service proxy URI used `ses` as the
  AWS service component (`arn:aws:apigateway:<region>:ses:path//`), which
  API Gateway rejects: `BadRequestException: AWS Service of type ses not
  supported`. API Gateway validates that component against the service's
  SDK endpoint prefix, which for SES is `email` (as in
  `email.<region>.amazonaws.com`), not its IAM/ARN prefix (`ses:...`).
  `terraform apply` now succeeds; a plan against an existing `v1.0.0`
  deployment recreates `aws_api_gateway_deployment`.

## [1.0.0] - 2026-08-31

### Added

- First version of the module: a REGIONAL API Gateway with a
  ContactViaEmail operation (`POST /email`, `OPTIONS /email` for CORS)
  defined via OpenAPI 3.0, a direct integration with Amazon SES via
  velocity templates, a regional custom domain with an ACM certificate
  and a Route 53 record pointing at an existing hosted zone, throttling
  on the whole API, and a single fixed `default` stage. Each contact
  channel gets its own path (`/email` today), so future channels (phone,
  WhatsApp, Teams, Slack, ...) can be added as sibling operations in the
  same module.
- The `phone` field of the request body is optional (`name`, `email`,
  `message` remain required).
- The HTML/text body of the email template arrives via variable
  (`contact_via_email_html_template`/`contact_via_email_text_template`),
  not from fixed files inside the module: it varies per client, so it
  lives in the consumer project.
- Channel-specific inputs are prefixed `contact_via_email_` (`recipient`,
  `subject`, `html_template`, `text_template`), to leave room for a
  future channel's own inputs (e.g. `contact_via_phone_*`) without
  ambiguity. Inputs that apply to the whole API regardless of channel
  (`domain_name`, `route53_zone_id`, `cors_allowed_origin`,
  `throttling_*`) are not prefixed.
- The success response of `POST /email` is `202 Accepted`, not `200 OK`:
  `SendTemplatedEmail` is asynchronous, so the response only confirms SES
  queued the message (and returned a `MessageId`), not that it reached
  the recipient's mailbox.

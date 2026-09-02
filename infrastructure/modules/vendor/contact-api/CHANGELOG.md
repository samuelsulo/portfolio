# Changelog

All notable changes to this module are documented in this file, in
[Keep a Changelog](https://keepachangelog.com/) format.

## [2.0.1] - 2026-09-01

### Fixed

- The `contact-via-email.req.vtl` request template: hand-assembling
  `TemplateData` as a single double-quoted `#set` string with
  backslash-escaped embedded quotes (`\"`) failed VTL execution outright
  on every request, regardless of body content
  (`Execution failed due to configuration error: Unable to transform
  request`), caught in a live test before it reached a client. Rebuilt
  as a sequence of single-quoted literals (not interpolated, so nested
  double quotes need no escaping at all) and formal `${...}` references
  (written `$${...}` so `templatefile()` leaves them as literal text for
  Velocity), concatenated by plain adjacency instead of one `#set`
  string.
- `$util.escapeJavaScript()` escapes a single quote as `\'`, a valid
  JavaScript string escape but not a valid JSON one: a field containing
  an apostrophe (e.g. a name like "O'Brien") produced invalid JSON in
  `TemplateData`. Fixed with `$templateData.replaceAll("\\\\'", "'")`,
  4 backslashes rather than the 2 that first went in: `#set`'s own
  string literal collapses `\\` to a single backslash before
  `replaceAll` ever sees the pattern, so 2 backslashes left it matching
  (and replacing with itself) a bare quote instead of the `\'` sequence
  it was meant to strip.
- A missing `phone` key was again resolved by interpolating
  `$body.phone` into a string and comparing it to `""`, unable to tell a
  genuinely missing key from an explicit `phone: ""` (both interpolate
  to an empty string), silently reintroducing the conflation `1.0.2`
  fixed. Restored the `$body.containsKey("phone")` check, resolving
  `phone` into its own variable without ever touching `$body` itself.

## [2.0.0] - 2026-09-01

### Added

- `contact_via_email_source` and `contact_via_email_to_addresses`: the
  notification's Source and Destination are now separate variables,
  `contact_via_email_to_addresses` accepting one or more addresses as a
  single comma-separated string. Both gained a `validation` block
  checking they look like one (or, for the latter, more than one
  comma-separated) email address.

### Changed

- The `DEFAULT_4XX`/`DEFAULT_5XX` Gateway Responses (a request that fails
  validation, or never reaches `POST /email`'s own integration at all)
  now also return the `ContactViaEmailError` shape (`{ "code", "message"
  }`), via a new shared `templates/gateway-error.vtl` (`code` from
  `$context.error.responseType`, `message` from
  `$context.error.messageString`), instead of API Gateway's own default
  `{"message": "..."}`.
- `ContactViaEmailError` (`400`/`500`) dropped its `detail` field:
  `detail`'s content now flows into `message` instead. `ContactViaEmailError`
  is now used consistently for both `400` and `500` (previously `500`
  only returned `{ "message" }`, no `code`): the `500` response now also
  carries a `code`, fixed to `"InternalError"` since it isn't tied to a
  specific SES error. `ContactViaEmailSuccess` (`202`) is unchanged,
  `{ "message", "messageId" }`.
- The request and response velocity templates moved out of
  `openapi/openapi.yaml` into their own files under `templates/`
  (`contact-via-email.req.vtl`, `.res.vtl`, `.res.4xx.vtl`,
  `.res.5xx.vtl`, `gateway-error.vtl`), spliced into the OAS body with
  `indent()`. Most are read with a plain `file()` (they take no Terraform
  variable); `contact-via-email.req.vtl` is read with `templatefile()`,
  interpolating `Source`/`Destination.ToAddresses`/`Template` directly
  (from `contact_via_email_source`, `contact_via_email_to_addresses` and
  the SES template's own name) the same way `cors_allowed_origin`/
  `aws_region` already were elsewhere in the OAS document. `phone`, when
  missing from the body or sent as an explicit empty string, now
  resolves to `"N/A"` (previously `""`), via its own `$phone` variable
  rather than mutating the parsed request body directly.
- The integration's ARN used path-style addressing
  (`arn:...:email:path//`), which turned out unable to execute its
  request template on a real deployment at all
  (`Execution failed due to configuration error: Unable to transform
  request`, independent of the template's own content, and still present
  after the `1.0.2` VTL fix below). Switched to action-style
  (`arn:...:email:action/SendTemplatedEmail`), confirmed working against
  a live test, with `passthroughBehavior` changed from `NEVER` to
  `when_no_templates` to match.

### Removed

- `contact_via_email_recipient`, the single address used as both Source
  and Destination of every notification. Split into
  `contact_via_email_source` (Source only) and
  `contact_via_email_to_addresses` (Destination), see Added above.

### Considered and reverted

- Migrating the integration to Amazon SES's **v2 API** (`SendEmail`, a
  real JSON REST operation, `Content.Template.TemplateName`/`TemplateData`
  for the templated case) instead of the classic **v1 Query API**
  (`SendTemplatedEmail`, `application/x-www-form-urlencoded`) used above:
  JSON would have meant no more `$util.urlEncode` per field, no more risk
  of a stray newline in the template corrupting the request (JSON ignores
  whitespace between tokens, unlike `application/x-www-form-urlencoded`,
  where `&` is the actual field separator), and JSON responses instead of
  XML regex parsing. Reverted after live-testing: API Gateway's `type:
  aws` integration signs the request with the wrong SigV4 service name
  for a v2 REST path (`InvalidSignatureException: Credential should be
  scoped to correct service: 'ses'`). The `email` service component
  required in the ARN (`ses` fails `CreateDeployment` outright, see the
  action-style fix above) only gets internally remapped to the correct
  signing name (`ses`) for the classic, recognized v1 Query API actions;
  an arbitrary v2 REST path doesn't get the same treatment. Making this
  work would need something other than a direct `type: aws` service
  integration (e.g. a Lambda calling SES v2 via the AWS SDK, which signs
  correctly on its own), a materially bigger change than this module's
  "no Lambda or other compute in between" design (see `README.md`) was
  meant to take on for this fix.

## [1.0.2] - 2026-08-31

### Fixed

- Requests that fail API Gateway's request validation (a body not
  conforming to `ContactViaEmailRequest`) hit a Gateway Response, not the
  `POST /email` integration: none of the `Access-Control-Allow-Origin`
  mapping configured on that integration applied, so the browser reported
  a bare CORS failure instead of the actual 4xx. Added
  `x-amazon-apigateway-gateway-responses` for `DEFAULT_4XX`/`DEFAULT_5XX`
  to set the header there too.
- Removed `minLength: 1` from the (optional) `phone` field: a real form
  typically submits `phone: ""` for a blank field rather than omitting
  the key, which failed validation and triggered the Gateway Response
  issue above on every submission without a phone number.
- The request velocity template resolved a missing `phone` with
  Velocity's quiet-reference notation (`$!inputRoot.phone`), inline
  inside a `#set` string. On API Gateway's actual VTL engine this failed
  every request, present phone value or not, with `Execution failed due
  to configuration error: Unable to transform request` (500), caught in
  a live test before it reached production. Replaced with an explicit
  `#if($inputRoot.phone) ... #else ... #end` resolving a plain `$phone`
  variable, which doesn't rely on that notation at all.

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

# contact-api

Creates an **Amazon API Gateway** (REST API, `REGIONAL` type) for a site's
contact form. Its first operation, **ContactViaEmail**, receives the
message and forwards it as an email via **Amazon SES**, with no Lambda or
other compute in between (direct API Gateway -> SES integration). Also
includes the SES template (HTML + text) for the notification and the
API's custom domain.

## One path per contact channel

Each way of getting in touch lives at its own path, under `/`:
`ContactViaEmail` at `/email` today, with room for `/phone`, `/whatsapp`,
`/teams`, `/slack`, etc. to be added later as sibling operations in the
same OAS document and the same REST API, each with its own integration
and request/response schemas (`ContactVia<Channel>Request/Success/Error`,
following the same naming as
`ContactViaEmailRequest`/`ContactViaEmailSuccess`/`ContactViaEmailError`).
Shared concerns (the custom domain, the single `default` stage,
throttling) already apply to the whole API, so a new channel only adds a
path and its integration, not a new module.

## What it creates

- A `REGIONAL` **REST API**, defined entirely through an **OpenAPI 3.0**
  document (see [`openapi/openapi.yaml`](./openapi/openapi.yaml)) passed
  as the `body` to `aws_api_gateway_rest_api`. No resource/method is
  declared "by hand": the whole API mirrors that document.
- The **`ContactViaEmail`** operation: `POST /email`, a direct integration
  with `SES:SendTemplatedEmail`, plus `OPTIONS /email` for the CORS
  preflight.
- An **SES email identity** and an **SES template** (`contact`), whose
  HTML and text body arrive via variable (see
  [Email template](#email-template-html--text-customizable-per-client)),
  not from fixed files inside the module.
- An **IAM role** that API Gateway assumes to call SES.
- A **regional custom domain**, with an ACM certificate and Route 53
  records managed by the module.
- **Throttling** on the whole API.

## The ContactViaEmail operation

`POST /email` (`operationId: ContactViaEmail`) accepts a JSON body with
four fields: `name`, `email`, `message` required, `phone` optional and
genuinely omittable (schema `ContactViaEmailRequest` in the OAS; the
body is validated by API Gateway itself before reaching SES, via
`x-amazon-apigateway-request-validator`). `phone` is optional because
always requiring it risks form abandonment from visitors who'd rather be
contacted only by email; if a specific client considers it indispensable
(e.g. for a lead that needs to be called back), make it required with an
OAS change in that deployment, not at the level of this shared module.
Whether `phone` is missing from the body entirely or sent as an explicit
empty string (which a real form typically does for a blank field instead
of omitting the key), the request template fills it in as `"N/A"` before
building `TemplateData` (see VTL below): SES raises an error rendering
the `{{phone}}` tag if `TemplateData` is missing it entirely, which is
why the module never just forwards the field as received.

Responses, based on the
[SES `SendTemplatedEmail` documentation](https://docs.aws.amazon.com/ses/latest/APIReference/API_SendTemplatedEmail.html):
success and error have two distinct shapes, rather than one shape with
fields left empty on outcomes they don't apply to. `ContactViaEmailError`
is loosely modeled after
[RFC 7807](https://www.rfc-editor.org/rfc/rfc7807) (Problem Details for
HTTP APIs): a machine-readable `code` plus a human-readable `message`,
used consistently for both `400` and `500`.

| Code | When | Body |
|---|---|---|
| `202` | SES accepted the request and returned a `MessageId`. `202 Accepted` rather than `200 OK`: `SendTemplatedEmail` is asynchronous, so this only confirms the message was queued for delivery, not that it reached the recipient's mailbox. | `ContactViaEmailSuccess`: `{ "message", "messageId" }` |
| `400` | One of the SES errors for this operation (`MessageRejected`, `TemplateDoesNotExist`, `MailFromDomainNotVerified`, `AccountSendingPaused`, `ConfigurationSetDoesNotExist`, `ConfigurationSetSendingPaused`). | `ContactViaEmailError`: `{ "code", "message" }`, both from SES. |
| `500` | Unexpected error communicating with SES. | `ContactViaEmailError`: `{ "code", "message" }`, `code` fixed to `"InternalError"` (not tied to a specific SES error). |

A request whose body doesn't conform to the schema never reaches this
table at all: API Gateway's request validator rejects it before the
integration runs, with one of its own **Gateway Responses** instead (see
CORS below), which does return the same `ContactViaEmailError` shape, but
built from `$context.error.*` rather than from anything SES ever sees.

`OPTIONS /email` responds with a mock integration, for the browser's CORS
preflight: it returns `Access-Control-Allow-Origin` (from
`cors_allowed_origin`), `Access-Control-Allow-Methods` (`POST,OPTIONS`)
and `Access-Control-Allow-Headers` (`Content-Type`). The same CORS
headers are also returned by the real `POST /email` responses
(202/400/500), not just by the preflight.

## CORS on Gateway Responses

A request that fails before reaching the `POST /email` integration (a
body that fails schema validation, an unknown path or method, being
throttled, ...) gets one of API Gateway's own **Gateway Responses**, a
separate mechanism from the `responses`/`x-amazon-apigateway-integration`
mapping above: none of the CORS headers configured there apply. Without
further configuration, such a response carries no
`Access-Control-Allow-Origin` header at all, which a browser reports as
a plain CORS failure (`No 'Access-Control-Allow-Origin' header is
present on the requested resource`), hiding the real 4xx/5xx status and
body from anyone debugging it from the frontend.

The OAS document adds `x-amazon-apigateway-gateway-responses` for
`DEFAULT_4XX` and `DEFAULT_5XX`, setting
`Access-Control-Allow-Origin` from `cors_allowed_origin` on every such
response, so the browser can surface the actual error instead of
blocking it as an opaque CORS issue. Both also carry a `responseTemplates`
built from [`templates/gateway-error.vtl`](./templates/gateway-error.vtl),
shaping the body as `ContactViaEmailError` (`{ "code", "message" }`, same
as the `400`/`500` from the `POST /email` integration itself, see above)
instead of API Gateway's own default `{"message": "..."}`: `code` is
`$context.error.responseType` (e.g. `BAD_REQUEST_BODY`, `THROTTLED`,
`MISSING_AUTHENTICATION_TOKEN`), `message` is
`$context.error.messageString`. This one template is shared by both
`DEFAULT_4XX` and `DEFAULT_5XX`, and isn't `contact_via_email_`-prefixed
like the others under `templates/`: it isn't channel-specific, it applies
to any request that never reaches an operation's own integration,
current or future.

## Integration via velocity templates (VTL)

SES exposes a classic "Query" API (form
`application/x-www-form-urlencoded`, an `Action` parameter), different
from the JSON sent by the site's client. The translation happens in both
directions with velocity templates, inside
`x-amazon-apigateway-integration`. Unlike the rest of the OAS document,
these templates are not inlined in `openapi.yaml`: they live as their own
files under [`templates/`](./templates), spliced into the OAS body with
`indent()` (so their indentation matches the YAML block they land in).
Most of them take no OpenTofu variable at all, and are read with a plain
`file()`; the one exception is the request template below, read with
`templatefile()` instead:

> An SES v2 (`SendEmail`, JSON REST) version of this integration was
> tried and reverted: see [CHANGELOG.md](./CHANGELOG.md) for why.

- [`contact-via-email.req.vtl`](./templates/contact-via-email.req.vtl)
  (request): converts the JSON body into the parameters
  `Action=SendTemplatedEmail`, `Source`, `Destination.ToAddresses`,
  `ReplyToAddresses`, `Template` and `TemplateData`. `Source` and
  `Template` are interpolated directly into the template at plan time via
  `templatefile()` (like `cors_allowed_origin`/`aws_region` elsewhere in
  this OAS document), from `contact_via_email_source` and the SES
  template's own name; `contact_via_email_to_addresses` is interpolated
  the same way as a single comma-separated string, then split into the
  SES `member.N` parameters it expects with `#foreach` at request time
  (note that `.split(",")` is called on the `$toAddresses` *reference*
  set from that string, not directly on the string literal: Velocity's
  parser on API Gateway rejects a method call chained straight off a
  literal). `ReplyToAddresses` is the visitor's own address, from the
  request body's `email` field, resolved purely at request time,
  independent of any of the above. `phone` is resolved into its own
  `$phone` variable, never by mutating the parsed request body (`$body`)
  itself: first set to the string interpolation of `$body.phone` (`""`
  whether the key is missing or explicitly empty, since Velocity renders
  a null property lookup as an empty string within a quoted string,
  unlike a genuinely undefined top-level reference), then defaulted to
  `"N/A"` if still empty at that point. `TemplateData` is then a
  hand-assembled JSON string (`$util.escapeJavaScript` on each of
  `name`/`email`/`$phone`/`message`), since SES raises an error rendering
  the `{{phone}}` tag in the template if `TemplateData` doesn't include
  the key at all.

  Several bugs were found live-testing this integration, each a reminder
  of just how restricted (and inconsistently documented) API Gateway's
  VTL engine is:
  - `TemplateData` rendered as an empty string when first written as
    `$util.toJson($inputRoot)`, re-serializing the already-parsed request
    body instead of hand-assembling the JSON string: `$util.toJson`
    turned out unreliable on the object returned by `$input.path('$')`
    once that object had been mutated by a `.put(...)` call (the `phone`
    default, at the time implemented by mutating `$inputRoot` directly
    rather than through its own `$phone` variable), silently producing an
    empty string rather than an error.
  - Reading that same mutated `phone` key back off `$inputRoot` with dot
    notation, inside the hand-assembled `TemplateData` string once
    `$util.toJson` was dropped, failed outright (`Execution failed due to
    configuration error: Unable to transform request`) instead of merely
    misbehaving. Resolving it into its own `$phone` variable instead
    (never touching `$inputRoot` at all, current behavior above) cleared
    that specific error.
  - Resolving a missing `phone` with Velocity's quiet-reference notation
    (`$!inputRoot.phone`) inline inside a `#set` string, independently of
    all of the above, also failed the same way, even with a valid,
    present `phone`.
  - The integration's ARN used path-style addressing
    (`arn:...:email:path//`) instead of action-style
    (`arn:...:email:action/SendTemplatedEmail`): path-style turned out
    unable to execute *any* request template on a real deployment,
    regardless of the template's own content, which is what the quiet-
    reference bug's symptom was actually caused by.
- **Response**: SES responds in XML. There's no native XML parser in
  VTL, so each response template extracts what it needs with a regex on
  `$input.body`, building the `ContactViaEmailSuccess`/`ContactViaEmailError`
  shape that matches its status code (see the table above):
  [`contact-via-email.res.vtl`](./templates/contact-via-email.res.vtl)
  (the `202` success case) extracts `MessageId`;
  [`contact-via-email.res.4xx.vtl`](./templates/contact-via-email.res.4xx.vtl)
  (`400`) extracts `Code` and `Message`;
  [`contact-via-email.res.5xx.vtl`](./templates/contact-via-email.res.5xx.vtl)
  (`500`) is a static message with a fixed `"InternalError"` code, no
  extraction needed.

## Sender, recipient and reply-to

Unlike a single `contact_via_email_recipient` used for everything, the
module takes the SES **Source** and **Destination** as separate
variables: `contact_via_email_source` (required, a single address) and
`contact_via_email_to_addresses` (required, one or more addresses
separated by a comma, no spaces). Only `contact_via_email_source` is
verified as an SES email identity (AWS sends it a confirmation link; it
stays unverified until opened): SES only requires the Source to be
verified, not the destinations, so the module never needs to verify a
separate "technical" sending address.

The **visitor's** address, taken from the `email` field of the request
body, is never used as the Source (SES would refuse to send from an
unverified address): it becomes the **`ReplyToAddresses`** of the email
instead. Whoever receives the notification can then hit "Reply" in their
own mail client and reach the visitor directly, without having to copy
the address by hand.

Both `contact_via_email_source` and `contact_via_email_to_addresses` have
a `validation` block checking they look like one (or, for the latter,
more than one comma-separated) email address, so a typo fails at `plan`
time with a clear message rather than surfacing later as an opaque SES
error.

## Email template (HTML + text), customizable per client

The module **does not contain** the `contact` SES template files: being
real content (read by a person, not configuration), and meant to change
from one client to another (logo, tone, colors), the HTML and text body
arrive at the module through two variables,
`contact_via_email_html_template` and `contact_via_email_text_template`,
as ready-made strings. In the project that consumes the module, these are
typically obtained with `file(...)` on a copy of the template living in
that project itself, not inside the vendored module:

```hcl
module "contact_api" {
  source = "./vendor/contact-api"
  # ...
  contact_via_email_html_template = file("${path.module}/templates/contact.html")
  contact_via_email_text_template = file("${path.module}/templates/contact.txt")
}
```

This way, changing the template for a specific client means editing a
file in that client's project, not in the vendored module (which should
be treated as third-party code, not modified in place).

Both bodies support the same four SES replacement tags: `{{name}}`,
`{{email}}`, `{{phone}}`, `{{message}}` (plus the subject,
`contact_via_email_subject`, which supports `{{name}}` the same way). If
a custom template omits the `{{phone}}` tag, remember that `TemplateData`
still always includes the `phone` key (possibly empty, see above): SES
doesn't require a template to use every available tag, but it rejects
the send if a tag *used* in the template is missing from `TemplateData`.

For the HTML body, keep in mind the general constraints of HTML email:
most mail clients ignore external `<style>` sheets or web fonts and
render only inline styles, so write the markup with tables and fully
inline styles, no external resources.

## Single, fixed stage

The API has a single deployment stage, always named `default`: there is
no `stage_name`/`stage_version` variable. A breaking change to the API's
contract is already tracked by bumping this module's own major version (a
new `contact-api/vX.0.0` tag): tying the stage name to
that version too would be redundant, and would change the API's URL on
every major release for no benefit, since a major bump means redeploying
this module, not running two stages side by side within the same
deployment. `aws_api_gateway_deployment` is still recreated on every
change to the OAS body (so a `patch`/`minor` release rolls out), it just
always redeploys the same `default` stage.

## Throttling

The API is public and unauthenticated: `throttling_rate_limit` and
`throttling_burst_limit` (via `aws_api_gateway_method_settings`, applied
to the whole API with `method_path = "*/*"`, i.e. every operation and
channel alike) are a minimal safeguard against cost and SES sending
reputation damage to `contact_via_email_source` in case of abuse, not
a complete anti-spam measure.

## Custom domain

The domain (`domain_name`) is **regional**, not edge/CloudFront: the
required ACM certificate must therefore exist in the same region as the
API, unlike the [`website-hosting`](../website-hosting) module (which uses
CloudFront and requires the certificate in `us-east-1`). Because of this,
the module doesn't need a second `aws` provider alias.

The module never creates a Route 53 hosted zone: it expects to receive an
existing one via `route53_zone_id`, used both for the ACM certificate's
DNS validation records and for the alias `A` record pointing the custom
domain at the API's regional domain. The `base_path_mapping` maps the
domain onto the stage with an empty base path, so each operation's public
URL matches its OAS path directly (e.g. `https://<domain_name>/email`),
with no stage prefix.

## Notes

- The module doesn't configure an `aws` provider: whoever consumes it
  passes their own default provider, with no need for extra aliases
  (unlike `website-hosting`, which requires `aws.us_east_1`).
- The mandatory tags (`Project`, `Owner`, `Environment`, `ManagedBy`) come
  automatically from the `default_tags` of the provider in the project
  that consumes the module: the module doesn't declare its own `tags`
  variable (none of the SES/API Gateway/ACM resources created here
  support tags applicable in a uniform way anyway).
- **SES sandbox**: while the SES account remains in the sending sandbox
  (the default for every new AWS account), sending is only possible to
  verified addresses. Each address in `contact_via_email_to_addresses`
  must be a verified SES identity too until production access is
  requested; only `contact_via_email_source` is verified by the module
  itself.

## Reference

<!-- BEGIN_TF_DOCS -->
### Requirements

| Name | Version |
| ---- | ------- |
| terraform | >= 1.9.0 |
| aws | ~> 6.0 |

### Providers

| Name | Version |
| ---- | ------- |
| aws | 6.68.0 |

### Inputs

| Name | Description | Type | Default | Required |
| ---- | ----------- | ---- | ------- | :------: |
| api_gateway_name | Name of the API Gateway REST API (also used as the title of the OAS document). | `string` | n/a | yes |
| contact_via_email_html_template | Content of the HTML body of the ContactViaEmail notification email, as a string. This module never bakes in a fixed template: the content varies per client, so it's passed in, typically via a `file(...)` call in the project that consumes this module (e.g. `file("${path.module}/templates/contact.html")`, pointing at a template file that lives in the consumer project, not in this module). Supports the SES replacement tags {{name}}, {{email}}, {{phone}}, {{message}}. | `string` | n/a | yes |
| contact_via_email_source | Verified SES sending identity used as the Source of every ContactViaEmail notification. AWS sends a confirmation link to this address; the identity stays unverified until it's opened. | `string` | n/a | yes |
| contact_via_email_text_template | Content of the plain-text body of the ContactViaEmail notification email, as a string, passed in the same way as contact_via_email_html_template (typically via a `file(...)` call in the consumer project). Supports the same replacement tags. | `string` | n/a | yes |
| contact_via_email_to_addresses | Mailbox(es) that receive every ContactViaEmail submission, as a single string with addresses separated by a comma, no spaces (e.g. "a@example.com,b@example.com"). | `string` | n/a | yes |
| domain_name | Custom domain of the API (e.g. "contact.trattoriadamario.it"). | `string` | n/a | yes |
| route53_zone_id | ID of an existing Route 53 hosted zone for domain_name, used to validate the ACM certificate and to create the DNS alias record pointing to the API. This module never creates a hosted zone: pass in one that already exists. | `string` | n/a | yes |
| ses_integration_role_name | Name of the IAM role assumed by API Gateway to call SES. | `string` | n/a | yes |
| ses_integration_role_policy_name | Name of the inline IAM policy attached to the SES integration role. | `string` | n/a | yes |
| ses_template_name | Name of the SES template rendered for every ContactViaEmail notification. | `string` | n/a | yes |
| contact_via_email_subject | Subject line of the notification email. Supports the same {{name}}/{{email}}/{{phone}}/{{message}} replacement tags as the template body. | `string` | `"New message from the website - {{name}}"` | no |
| cors_allowed_origin | Value of the Access-Control-Allow-Origin header returned by the API, including its CORS preflight response. Set it to the exact website origin (e.g. "https://trattoriadamario.it") once known; the wildcard default only unblocks local development. | `string` | `"*"` | no |
| throttling_burst_limit | Burst request limit (concurrent requests) applied to the whole API. | `number` | `10` | no |
| throttling_rate_limit | Steady-state request rate limit (requests per second) applied to the whole API, to protect the SES sending reputation of contact_via_email_source and the AWS bill from this unauthenticated public endpoint. | `number` | `5` | no |

### Outputs

| Name | Description |
| ---- | ----------- |
| contact_email_url | Public URL of the ContactViaEmail operation (POST /email). |
| custom_domain_name | Custom domain configured for the API. |
| execution_arn | Execution ARN of the REST API, needed to grant other AWS services permission to invoke it. |
| invoke_url | Default execute-api.amazonaws.com invoke URL of the deployed stage (always available, independent of the custom domain). |
| rest_api_id | ID of the API Gateway REST API. |
| ses_identity_arn | ARN of the verified SES email identity (contact_via_email_source), used as the Source of every notification. |
| ses_template_name | Name of the SES template used to render the ContactViaEmail notification. |
<!-- END_TF_DOCS -->

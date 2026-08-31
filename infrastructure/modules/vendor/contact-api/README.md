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
following the same naming as `ContactViaEmailRequest/Success/Error`).
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
four fields: `name`, `email`, `message` required, `phone` optional
(schema `ContactViaEmailRequest` in the OAS, with length constraints and
an email pattern; the body is validated by API Gateway itself before
reaching SES, via `x-amazon-apigateway-request-validator`). `phone` is
optional because always requiring it risks form abandonment from
visitors who'd rather be contacted only by email; if a specific client
considers it indispensable (e.g. for a lead that needs to be called
back), make it required with an OAS change in that deployment, not at the
level of this shared module. When omitted, the email template still
receives an empty `{{phone}}` tag (see the "quiet" reference
`$!inputRoot.phone` in the request velocity template): SES raises an
error if a template tag has no matching value in `TemplateData`, which is
why the `phone` key is always present, even when empty.

Responses, based on the
[SES `SendTemplatedEmail` documentation](https://docs.aws.amazon.com/ses/latest/APIReference/API_SendTemplatedEmail.html):

| Code | When | Body |
|---|---|---|
| `202` | SES accepted the request and returned a `MessageId`. `202 Accepted` rather than `200 OK`: `SendTemplatedEmail` is asynchronous, so this only confirms the message was queued for delivery, not that it reached the recipient's mailbox. | `ContactViaEmailSuccess`: `{ "message", "messageId" }` |
| `400` | Body doesn't conform to the schema, or one of the SES errors for this operation (`MessageRejected`, `TemplateDoesNotExist`, `MailFromDomainNotVerified`, `AccountSendingPaused`, `ConfigurationSetDoesNotExist`, `ConfigurationSetSendingPaused`). | `ContactViaEmailError`: `{ "message", "code", "detail" }` |
| `500` | Unexpected error communicating with SES. | `ContactViaEmailError`: `{ "message" }` |

`OPTIONS /email` responds with a mock integration, for the browser's CORS
preflight: it returns `Access-Control-Allow-Origin` (from
`cors_allowed_origin`), `Access-Control-Allow-Methods` (`POST,OPTIONS`)
and `Access-Control-Allow-Headers` (`Content-Type`). The same CORS
headers are also returned by the real `POST /email` responses
(202/400/500), not just by the preflight.

## Integration via velocity templates (VTL)

SES exposes a classic "Query" API (form
`application/x-www-form-urlencoded`, an `Action` parameter), different
from the JSON sent by the site's client. The translation happens in both
directions with velocity templates, inside
`x-amazon-apigateway-integration`:

- **Request**: converts the JSON body (`name`, `email`, `phone`,
  `message`) into the parameters `Action=SendTemplatedEmail`, `Source`,
  `Destination`, `ReplyToAddresses`, `Template` and `TemplateData` (the
  four fields, wrapped in JSON and then url-encoded, as required by SES
  for templates). `phone`, being optional in the schema, is read with
  Velocity's "quiet" reference (`$!inputRoot.phone`) instead of the plain
  `$inputRoot.phone`: if the field is missing from the body, a plain
  reference would print the literal text `$inputRoot.phone` into the
  generated JSON instead of an empty string.
- **Response**: SES responds in XML. The success template extracts the
  `MessageId` with a regex (`$input.body.replaceAll(...)`: there's no
  native XML parser in VTL) and returns it in a clean JSON body; the
  error templates extract `Code` and `Message` the same way.

## Sender, recipient and reply-to

The module uses a single address, `contact_via_email_recipient` (a
Terraform variable), as both the **Source** and the **Destination** of
the notification: the module verifies it as an SES email identity and
sends the email to itself. This avoids having to verify a second,
separate "technical" sending address in SES.

The **visitor's** address, taken from the `email` field of the request
body, is never used as the Source (SES would refuse to send from an
unverified address): it becomes the **`ReplyToAddresses`** of the email
instead. Whoever receives the notification
(`contact_via_email_recipient`) can then hit "Reply" in their own mail
client and reach the visitor directly, without having to copy the
address by hand.

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
new `contact-api/vX.0.0` tag, see
[CLAUDE.md §3](../../CLAUDE.md#3-versioning)): tying the stage name to
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
reputation damage to `contact_via_email_recipient` in case of abuse, not
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

## Input

| Name | Description | Required |
| --- | --- | --- |
| `name_prefix` | Prefix applied to the name of every resource created by the module. | Yes |
| `contact_via_email_recipient` | Mailbox that receives every ContactViaEmail submission; verified as an SES identity and used as both Source and Destination. | Yes |
| `contact_via_email_subject` | Subject line of the notification email. Supports `{{name}}`. Default `New message from the website - {{name}}`. | No |
| `contact_via_email_html_template` | HTML body of the notification email, as a string (typically from `file(...)` in the consumer project). | Yes |
| `contact_via_email_text_template` | Text body of the notification email, as a string (typically from `file(...)` in the consumer project). | Yes |
| `domain_name` | Custom domain of the API. | Yes |
| `route53_zone_id` | ID of an existing Route 53 hosted zone for `domain_name`. | Yes |
| `cors_allowed_origin` | Value of `Access-Control-Allow-Origin`. Default `*`. | No |
| `throttling_rate_limit` | Requests-per-second limit on the whole API. Default `5`. | No |
| `throttling_burst_limit` | Burst limit on the whole API. Default `10`. | No |

## Output

| Name | Description |
| --- | --- |
| `rest_api_id` | ID of the REST API. |
| `execution_arn` | Execution ARN of the REST API. |
| `invoke_url` | Default (`execute-api.amazonaws.com`) invoke URL of the stage. |
| `custom_domain_name` | Custom domain configured for the API. |
| `contact_email_url` | Public URL of the ContactViaEmail operation (`POST /email`). |
| `ses_template_name` | Name of the SES template used for the notification. |
| `ses_identity_arn` | ARN of the verified SES email identity (`contact_via_email_recipient`). |

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
  verified addresses. Since `contact_via_email_recipient` is both Source
  and Destination, the module works in sandbox too without requiring
  production access; it still needs to be requested if sending to
  addresses other than `contact_via_email_recipient` is needed in the
  future.

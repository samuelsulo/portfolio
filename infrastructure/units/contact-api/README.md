# contact-api

Contact form backend: API Gateway calling Amazon SES directly (no Lambda
or database), behind a custom domain with an ACM certificate. Wraps
[`modules/vendor/contact-api`](../../modules/vendor/contact-api).

Resource names derive from `name_prefix` in
[`root.hcl`](../../live/root.hcl). The email bodies are
[`templates/contact.html`](./templates/contact.html) and
[`templates/contact.txt`](./templates/contact.txt).

The unit also generates an `aws.dns` alias provider, used only for the Route 53
records: the hosted zone is in the network-hub account of the organization, so
the provider assumes the role `awslz-dns-<account name>` of that account, which
the landing zone gives to the account the project is deployed to.

## Values

| Value | Required | Description |
|---|---|---|
| `email` | yes | Mailbox that receives every submission, also the verified SES sending identity. |
| `website_domain_name` | yes | Domain of the website: sets the CORS allowed origin and the email subject. |
| `domain_name` | yes | Custom domain of the API (e.g. `contact.<website domain>`). |
| `route53_zone_id` | yes | ID of the existing Route 53 hosted zone for `domain_name`. |

## Outputs

`custom_domain_name`, `contact_email_url` and the other outputs of the
module, listed in its README.

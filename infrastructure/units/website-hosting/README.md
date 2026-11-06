# website-hosting

Static website hosting: private S3 bucket behind CloudFront (with Origin
Access Control), ACM certificate and Route 53 alias record. Wraps
[`modules/vendor/website-hosting`](../../modules/vendor/website-hosting).

Resource names derive from `environment_name_prefix` in
[`root.hcl`](../../live/root.hcl). The unit also generates an
`aws.us_east_1` alias provider, which the module needs for the ACM
certificate required by CloudFront.

The unit also generates an `aws.dns` alias provider, used only for the Route 53
records: the hosted zone is in the network-hub account of the organization, so
the provider assumes a role of that account (`awslz-dns-legacy`, transitional,
until the project runs in a workload account and uses `awslz-dns-<account name>`).

## Values

| Value | Required | Description |
|---|---|---|
| `domain_name` | yes | Primary domain of the website. |
| `route53_zone_id` | yes | ID of the existing Route 53 hosted zone for `domain_name`. |
| `s3_bucket_force_destroy` | no | Delete the bucket content on destroy. Default `false`. |
| `s3_bucket_versioning_enabled` | no | Enable bucket versioning. Default `false`. |

## Outputs

`s3_bucket_id`, `cloudfront_distribution_id` and the other outputs of the
module, listed in its README.

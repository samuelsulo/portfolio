# website-hosting

Crea l'infrastruttura AWS per l'hosting statico di una SPA (Single Page
Application): bucket S3 privato come origine, distribuzione CloudFront con
Origin Access Control, certificato ACM per il dominio custom e record DNS
in una hosted zone Route 53 esistente.

Il modulo non crea mai una hosted zone Route 53: si aspetta di riceverne
una gia' esistente tramite `route53_zone_id`.

## Cosa crea

- Un bucket S3 (namespace account-regional), privato, versionato e
  cifrato lato server, con policy che consente l'accesso in lettura alla
  sola distribuzione CloudFront tramite Origin Access Control.
- Una distribuzione CloudFront con HTTPS obbligatorio, comportamento SPA
  opzionale (redirect di 403/404 su `index.html`) e certificato ACM per il
  dominio custom.
- Un certificato ACM (in us-east-1, richiesto da CloudFront) validato via
  DNS, con i relativi record di validazione nella hosted zone passata in
  input.
- Un record Route 53 di tipo A (alias) che punta il dominio alla
  distribuzione CloudFront.

## Input

| Nome | Descrizione | Obbligatoria |
| --- | --- | --- |
| `name_prefix` | Prefisso applicato al nome di tutte le risorse create dal modulo. | Si |
| `s3_bucket_force_destroy` | Se forzare la cancellazione del contenuto del bucket S3 durante un `terraform destroy`. | Si |
| `domain_name` | Dominio principale del sito (es. `trattoriadamario.it`). | Si |
| `route53_zone_id` | ID di una hosted zone Route 53 gia' esistente per `domain_name`. | Si |
| `price_class` | Price class di CloudFront. Default `PriceClass_100`. | No |
| `default_root_object` | Oggetto servito alla radice del sito. Default `index.html`. | No |
| `spa_mode` | Se configurare le risposte di errore 403/404 verso `index.html` (necessario per router SPA in modalita' history). Default `true`. | No |

## Output

| Nome | Descrizione |
| --- | --- |
| `s3_bucket_id` | ID (nome) del bucket S3 che contiene il contenuto del sito. |
| `s3_bucket_arn` | ARN del bucket S3. |
| `s3_bucket_regional_domain_name` | Regional domain name del bucket, usato come origine CloudFront. |
| `cloudfront_distribution_id` | ID della distribuzione CloudFront. |
| `cloudfront_distribution_arn` | ARN della distribuzione CloudFront. |
| `cloudfront_distribution_domain_name` | Dominio di default assegnato da CloudFront alla distribuzione. |
| `cloudfront_distribution_hosted_zone_id` | Hosted zone ID di CloudFront, utile per creare ulteriori record alias. |
| `acm_certificate_arn` | ARN del certificato ACM validato per `domain_name`. |
| `website_url` | URL pubblico HTTPS del sito. |

## Note

- Il modulo non configura un provider `aws`: chi lo consuma deve passare
  sia il provider di default sia un alias `aws.us_east_1`, necessario per
  richiedere il certificato ACM usato da CloudFront:

  ```hcl
  module "website" {
    source = "./vendor/website-hosting"

    providers = {
      aws            = aws
      aws.us_east_1  = aws.us_east_1
    }

    name_prefix             = "example"
    s3_bucket_force_destroy = false
    domain_name              = "example.it"
    route53_zone_id          = "Z0123456789ABCDEFGHIJ"
  }
  ```

- I tag obbligatori (`Project`, `Owner`, `Environment`, `ManagedBy`)
  arrivano automaticamente dal `default_tags` del provider del progetto che
  consuma il modulo: il modulo non dichiara una propria variabile `tags`.

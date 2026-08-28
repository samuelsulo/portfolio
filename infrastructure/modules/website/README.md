# Module: website

Crea lo stack di hosting statico per il sito vetrina del cliente:

- Bucket **S3** (privato, nessun accesso pubblico) come origine dei contenuti.
- Distribuzione **CloudFront** davanti al bucket, solo HTTPS, che legge il
  bucket tramite Origin Access Control (OAC): nessuna bucket policy consente
  mai l'accesso pubblico diretto a S3.
- Certificato **ACM** (`us-east-1`, validazione DNS) quando è configurato un
  dominio personalizzato e non viene fornito un ARN di certificato esistente.
- **Route 53**, opzionale, in una di tre modalità mutuamente esclusive (vedi
  sotto).

## Provider

I certificati ACM usati da CloudFront devono esistere in `us-east-1`,
indipendentemente dalla regione in cui gira il resto dello stack
(`aws_region`). Il modulo dichiara un requisito
`configuration_aliases = [aws.us_east_1]` e si aspetta che il chiamante passi
un secondo provider `aws`, fissato su `us-east-1`:

```hcl
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
  # stesso account / assume_role del provider principale
}

module "website" {
  source = "../modules/website"

  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  # ...
}
```

Senza questo, `terraform plan` fallisce con un errore di configurazione
provider mancante, invece di richiedere silenziosamente il certificato nella
regione sbagliata.

## Modalità Route 53

Il DNS del dominio può essere gestito in tre modi, controllati da
`create_route53_zone` e `route53_zone_id`:

| Modalità | `create_route53_zone` | `route53_zone_id` | Caso d'uso |
|---|---|---|---|
| Nessun DNS gestito da AWS | `false` | `""` | Il DNS resta presso il registrar/provider esistente del cliente. Il modulo crea solo il certificato ACM (validato se viene fornito `acm_certificate_arn`, altrimenti lasciato `PENDING_VALIDATION`). |
| Crea una nuova zone | `true` | `""` | Dominio registrato altrove, DNS delegato ad AWS per la prima volta. Il modulo crea la hosted zone e restituisce `route53_zone_name_servers` da comunicare al cliente/registrar. |
| Riusa una zone esistente | `false` | `"Z0123..."` | Dominio registrato direttamente su AWS (Route 53 Domains), che crea automaticamente una hosted zone: passarne qui l'ID invece di crearne una duplicata. Utile anche se il cliente ha già una hosted zone da un setup precedente. |

Impostare sia `create_route53_zone = true` sia un `route53_zone_id` non vuoto
non è valido e fa fallire la validazione della variabile.

In entrambe le modalità gestite da AWS, il modulo crea i record di
validazione ACM e il record alias `A` che punta a CloudFront.

## Input

| Nome | Descrizione | Tipo | Default |
|---|---|---|---|
| `name_prefix` | Prefisso di naming applicato a tutte le risorse di questo modulo. | `string` | - (obbligatorio) |
| `aws_account_id` | ID dell'account AWS in cui Terraform applicherà la configurazione. | `string` | - (obbligatorio) |
| `aws_region` | Regione AWS in cui Terraform applicherà la configurazione. | `string` | - (obbligatorio) |
| `bucket_force_destroy` | Se forzare la cancellazione del contenuto del bucket durante un `terraform destroy`. | `bool` | - (obbligatorio) |
| `domain_name` | Dominio principale del sito (es. `trattoriadamario.it`). Obbligatorio in produzione, opzionale in sandbox. | `string` | `""` |
| `create_route53_zone` | Se `true`, crea una nuova hosted zone Route 53 per `domain_name`. Ignorato se `route53_zone_id` è impostato. | `bool` | `false` |
| `route53_zone_id` | ID di una hosted zone Route 53 esistente da riusare per `domain_name` invece di crearne una nuova. | `string` | `""` |
| `acm_certificate_arn` | ARN di un certificato ACM esistente in `us-east-1`. Se vuoto e `domain_name` è impostato, il modulo ne crea uno nuovo. | `string` | `""` |
| `price_class` | Price class di CloudFront. `PriceClass_100` copre EU/US ed è sufficiente per clienti locali italiani. | `string` | `"PriceClass_100"` |
| `default_root_object` | Oggetto servito alla root del sito. | `string` | `"index.html"` |
| `spa_mode` | Se `true`, configura le risposte di errore 403/404 verso `index.html` (necessario per Vue Router in history mode). | `bool` | `true` |

## Output

| Nome | Descrizione |
|---|---|
| `bucket_name` | Nome del bucket S3 che ospita i file del sito (target di deploy). |
| `cloudfront_distribution_id` | ID della distribuzione CloudFront (necessario per invalidare la cache dopo un deploy). |
| `cloudfront_domain_name` | Dominio `*.cloudfront.net` assegnato automaticamente alla distribuzione. |
| `website_url` | URL pubblico del sito (dominio personalizzato se configurato, altrimenti il dominio CloudFront). |
| `route53_zone_id` | ID della hosted zone Route 53 effettivamente in uso (nuova o esistente), oppure `null` se il DNS non è gestito da questo modulo. |
| `route53_zone_name_servers` | Name server di una hosted zone *appena creata*, da comunicare al cliente se il dominio è registrato altrove. Vuoto quando si riusa una zone esistente o quando il DNS non è gestito da questo modulo. |

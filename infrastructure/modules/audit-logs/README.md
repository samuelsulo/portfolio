# Module: audit-logs

Crea un bucket S3 privato e versionato per gli audit log (oggi CloudTrail; in
futuro potrebbero riusarlo anche AWS Config o VPC Flow Logs), con
cifratura, una lifecycle policy che sposta gli oggetti su storage class più
economiche col passare del tempo, e una bucket policy costruita a partire da
una baseline più gli statement contribuiti dai moduli produttori.

## Risorse create

- `aws_s3_bucket` (privato, nessun accesso pubblico, namespace `account-regional`)
- `aws_s3_bucket_versioning` (abilitato: necessario per audit trail resistenti a manomissioni)
- `aws_s3_bucket_public_access_block` (tutti e quattro i flag attivi)
- `aws_s3_bucket_server_side_encryption_configuration` (SSE-S3 / AES256)
- `aws_s3_bucket_lifecycle_configuration` (Standard → Standard-IA → Glacier, expiration opzionale, expiration delle versioni non correnti)
- `aws_s3_bucket_policy`, che unisce uno statement baseline "nega traffico non cifrato" con `additional_policy_documents`

## Utilizzo

Questo modulo possiede solo il bucket; non sa quale servizio ci scrive. I
moduli produttori (es. [`../cloudtrail`](../cloudtrail)) calcolano il proprio
statement di policy e lo passano tramite `additional_policy_documents`:

```hcl
module "audit_logs" {
  source = "../modules/audit-logs"

  additional_policy_documents    = [module.cloudtrail.bucket_policy]
  log_transition_to_ia_days      = 30
  log_transition_to_glacier_days = 90
  # ...
}
```

`bucket_policy_id` viene esposto come output specificamente perché i moduli
produttori possano dipendere dal *fatto che la policy sia applicata*, non
solo dall'esistenza del bucket: vedi il
[README di `../cloudtrail`](../cloudtrail/README.md#ordine-di-applicazione-della-bucket-policy)
per capire perché quest'ordine conta.

## Lifecycle e retention

Gli audit log vengono letti frequentemente solo nei giorni immediatamente
successivi a un incidente, poi raramente, ma restano la prova principale
per un'indagine retrospettiva, quindi di default non devono scadere:

- `log_transition_to_ia_days` / `log_transition_to_glacier_days`,
  obbligatori, nessun default: spostano gli oggetti su storage class più
  economiche man mano che invecchiano. `log_transition_to_glacier_days` deve
  essere maggiore di `log_transition_to_ia_days`.
- `log_retention_days`: default `null` (non scade mai). Impostare un valore
  esplicito solo per un motivo deliberato di compliance o costo, non come
  default copiato da una lifecycle policy di un bucket non di audit.
- `log_noncurrent_expiration_days`, default `365`: ripulisce le versioni
  di oggetto superate (il versioning è abilitato), senza toccare il ciclo di
  vita della versione corrente/live.

## Input

| Nome | Descrizione | Tipo | Default |
|---|---|---|---|
| `name_prefix` | Prefisso di naming applicato a tutte le risorse di questo modulo. | `string` | - (obbligatorio) |
| `aws_account_id` | ID dell'account AWS in cui Terraform applicherà la configurazione. | `string` | - (obbligatorio) |
| `aws_region` | Regione AWS in cui Terraform applicherà la configurazione. | `string` | - (obbligatorio) |
| `bucket_force_destroy` | Se forzare la cancellazione degli audit log durante un `terraform destroy`. | `bool` | - (obbligatorio) |
| `log_transition_to_ia_days` | Giorni prima di spostare gli oggetti da Standard a Standard-IA. | `number` | - (obbligatorio) |
| `log_transition_to_glacier_days` | Giorni prima di spostare gli oggetti da Standard-IA a Glacier. Deve essere maggiore di `log_transition_to_ia_days`. | `number` | - (obbligatorio) |
| `log_retention_days` | Giorni prima che un oggetto venga cancellato definitivamente. `null` = non scade mai (consigliato). | `number` | `null` |
| `log_noncurrent_expiration_days` | Giorni prima che una versione non corrente di un oggetto venga cancellata definitivamente. | `number` | `365` |
| `additional_policy_documents` | Documenti di policy IAM (JSON) da unire alla bucket policy, oltre allo statement baseline "nega traffico non cifrato". | `list(string)` | - (obbligatorio) |

## Output

| Nome | Descrizione |
|---|---|
| `bucket_arn` | ARN del bucket S3 usato per gli audit log. |
| `bucket_name` | Nome del bucket S3 usato per gli audit log. |
| `bucket_policy_id` | ID della risorsa di bucket policy (non del bucket stesso): permette ai moduli produttori di attendere che la policy sia applicata prima di creare risorse che ne dipendono. |

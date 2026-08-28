# Module: cloudtrail

Crea un singolo trail AWS CloudTrail che registra l'attività API in un bucket
S3 di proprietà del modulo [`audit-logs`](../audit-logs). Questo modulo crea
solo il trail e calcola lo statement di bucket policy di cui ha bisogno: non
crea né gestisce mai il bucket di destinazione.

## Risorse create

- Trail `aws_cloudtrail`, multi-region di default (`is_multi_region`), con
  global service events e log file validation abilitati.

## Utilizzo

Va sempre abbinato ad `audit-logs`: la bucket policy calcolata da questo
modulo deve essere unita a `additional_policy_documents` di `audit-logs`, e
il trail deve attendere che quella policy sia applicata prima di essere
creato (vedi "Ordine di applicazione della bucket policy" sotto).

```hcl
module "audit_logs" {
  source = "../modules/audit-logs"

  additional_policy_documents = [module.cloudtrail.bucket_policy]
  # ...
}

module "cloudtrail" {
  source = "../modules/cloudtrail"

  bucket_arn       = module.audit_logs.bucket_arn
  bucket_name      = module.audit_logs.bucket_name
  bucket_policy_id = module.audit_logs.bucket_policy_id
  key_prefix       = "cloudtrail"
  # ...
}
```

Da notare la dipendenza apparentemente circolare: `cloudtrail.bucket_policy`
(un *documento* di policy IAM, non una risorsa) alimenta `audit_logs`, mentre
`audit_logs.bucket_policy_id` alimenta a sua volta `cloudtrail`. È voluto,
vedi sotto.

## Ordine di applicazione della bucket policy

CloudTrail valida la policy del bucket di destinazione *durante* la chiamata
`CreateTrail`, quindi la policy deve già garantire l'accesso a CloudTrail
prima che il trail venga creato. Per rendere esplicito questo ordinamento a
Terraform:

- L'ARN del trail viene calcolato a mano in una local (`cloudtrail_arn`)
  invece di referenziare `aws_cloudtrail.this.arn`, così il documento di
  bucket policy non dipende implicitamente dalla risorsa trail.
- `bucket_policy_id` è obbligatorio e altrimenti non usato da nessun
  argomento di CloudTrail: referenziarlo costringe Terraform ad attendere
  che la risorsa di bucket policy sia effettivamente applicata (non solo che
  il bucket esista) prima di creare il trail. Una `precondition` fallisce
  subito con un messaggio chiaro se viene lasciato vuoto.

Saltare `bucket_policy_id`, o applicare `cloudtrail` prima della bucket
policy unita, produce `InsufficientS3BucketPolicyException` da parte di AWS.

## Input

| Nome | Descrizione | Tipo | Default |
|---|---|---|---|
| `name_prefix` | Prefisso di naming applicato a tutte le risorse di questo modulo. | `string` | - (obbligatorio) |
| `aws_account_id` | ID dell'account AWS in cui Terraform applicherà la configurazione. | `string` | - (obbligatorio) |
| `aws_region` | Regione AWS in cui viene creato il trail, usata per costruirne l'ARN in anticipo. | `string` | - (obbligatorio) |
| `is_multi_region` | Se il trail cattura eventi da tutte le regioni AWS invece che dalla sola regione del provider. | `bool` | `true` |
| `bucket_arn` | ARN del bucket S3 in cui CloudTrail salverà gli eventi (es. `module.audit_logs.bucket_arn`). | `string` | - (obbligatorio) |
| `bucket_name` | Nome del bucket S3 in cui CloudTrail salverà gli eventi (es. `module.audit_logs.bucket_name`). | `string` | - (obbligatorio) |
| `key_prefix` | Prefisso di key sotto cui CloudTrail scrive gli oggetti nel bucket. | `string` | - (obbligatorio) |
| `bucket_policy_id` | ID della risorsa di bucket policy S3 che garantisce a CloudTrail l'accesso a `bucket_name` (es. `module.audit_logs.bucket_policy_id`). Costringe Terraform ad attendere la policy prima di creare il trail, vedi "Ordine di applicazione della bucket policy" sopra. | `string` | - (obbligatorio) |

## Output

| Nome | Descrizione |
|---|---|
| `bucket_policy` | Documento di policy IAM (JSON) da unire alla policy del bucket di destinazione, che garantisce a questo trail il permesso di scrivervi. |

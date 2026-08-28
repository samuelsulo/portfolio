# Live

Il modulo Terraform radice effettivamente applicato da ogni ambiente.
`main.tf`, `variables.tf` e `outputs.tf` qui sono condivisi: `sandbox` e
`production` eseguono esattamente la stessa configurazione e differiscono
solo nei valori forniti da [`../environments/`](../environments).

## Cosa fa

- Configura due provider AWS: quello di default (regione = `var.aws_region`)
  e un alias `us_east_1`, necessario perché i certificati ACM usati da
  CloudFront devono esistere in `us-east-1` indipendentemente dalla regione
  dello stack.
- Entrambi i provider impostano `allowed_account_ids = [var.aws_account_id]`
  come guardia contro un apply sull'account sbagliato, e un blocco
  `assume_role` condizionato da `aws_role_enabled` (`true` di default, cioè
  produzione: ruolo cross-account nell'account del cliente; impostato a
  `false` in sandbox, dove vengono usate direttamente le credenziali attive
  del mio account).
- Applica i tag obbligatori (`Project`, `Client`, `Environment`,
  `ManagedBy = "terraform"`) a ogni risorsa tramite `default_tags`.
- Istanzia i moduli, in ordine di dipendenza: `budgets`, `audit_logs`,
  `cloudtrail` (scrive nel bucket di `audit_logs`), `website`.

## Backend

Il blocco `backend "s3"` è lasciato intenzionalmente vuoto: i valori reali
(bucket, key, region, `use_lockfile`, `encrypt`) arrivano dal `backend.hcl`
di ogni ambiente al momento dell'init, così `sandbox` e `production`
condividono questo file ma scrivono lo stato in bucket diversi.

```
terraform init -backend-config=../environments/<env>/backend.hcl
```

Il Makefile fa da wrapper: `make init ENV=<sandbox|production>`.

## Utilizzo

Passare sempre dal Makefile in [`../`](../), mai eseguire `terraform`
direttamente in questa cartella: è lui che si occupa di
`-backend-config` e `-var-file` per ogni ambiente:

```
make init ENV=sandbox
make plan ENV=sandbox
make apply ENV=sandbox
```

## Input

Definizioni complete in [`variables.tf`](./variables.tf); i valori vengono
forniti per ambiente tramite `../environments/<env>/environment.tfvars`, più
[`project.auto.tfvars`](./project.auto.tfvars) per i valori condivisi da
ogni ambiente del progetto.

| Nome | Descrizione | Obbligatoria |
|---|---|---|
| `client` | Nome del cliente, applicato come tag `Client`. | sì |
| `project` | Nome del progetto, applicato come tag `Project`. | sì |
| `project_code` | Codice progetto usato nel prefisso di naming delle risorse. | sì |
| `environment` | `sandbox` o `production`. | sì |
| `environment_code` | `sbx` o `prd`, usato nel prefisso di naming delle risorse. | sì |
| `aws_account_id` | ID dell'account AWS di destinazione (guardia contro l'apply sull'account sbagliato). | sì |
| `aws_region` | Regione AWS di destinazione. | sì |
| `aws_region_code` | Codice regione usato nel prefisso di naming delle risorse. | sì |
| `aws_role_enabled` | Se assumere `aws_role_arn`. Default `true` (produzione); impostato a `false` in sandbox. | no (default `true`) |
| `aws_role_arn` | ARN del ruolo cross-account da assumere. Obbligatorio quando `aws_role_enabled = true`, ignorato altrimenti. | sì se `aws_role_enabled = true` |
| `aws_role_external_id` | External ID richiesto dalla trust policy di `aws_role_arn`. Obbligatorio quando `aws_role_enabled = true`, ignorato altrimenti. | sì se `aws_role_enabled = true` |
| `bucket_force_destroy` | Forza la cancellazione del contenuto dei bucket su `terraform destroy`. | no (default `false`) |
| `create_route53_zone` | Crea una nuova hosted zone Route 53 per `domain_name`. | no (default `false`) |
| `route53_zone_id` | ID di una hosted zone Route 53 esistente da riusare. | no |
| `domain_name` | Dominio principale del sito. Obbligatorio in produzione. | no |
| `budget_unit` | Valuta delle soglie di budget (deve coincidere con quella di billing dell'account). | sì |
| `budget_monthly_amount` | Soglia di spesa mensile. | sì |
| `budget_annual_amount` | Soglia di spesa annuale. | sì |
| `budget_alert_emails` | Email notificate dagli allarmi di budget. | sì |
| `budget_scope` | `"project"` (default) o `"account"`, vedi [`../modules/budgets`](../modules/budgets). | no |

## Output

| Nome | Descrizione |
|---|---|
| `website_bucket_name` | Nome del bucket S3 che ospita i file del sito: target di deploy, letto da `scripts/deploy.sh`. |
| `cloudfront_distribution_id` | ID della distribuzione CloudFront, necessario per invalidare la cache dopo un deploy. |
| `website_url` | URL pubblico del sito. |
| `route53_zone_name_servers` | Name server della hosted zone Route 53, da comunicare al cliente se il dominio è registrato altrove. |

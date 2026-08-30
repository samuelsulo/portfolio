# Live

Il modulo Terraform radice effettivamente applicato da ogni ambiente. I file
qui sono condivisi: `sandbox` e `production` eseguono esattamente la stessa
configurazione e differiscono solo nei valori forniti da
[`../environments/`](../environments).

## File

- [`versions.tf`](./versions.tf): versione minima di Terraform e provider
  richiesti.
- [`backend.tf`](./backend.tf): blocco `backend "s3"`, lasciato senza valori.
- [`providers.tf`](./providers.tf): tag di default e configurazione dei
  provider AWS.
- [`main.tf`](./main.tf): locals condivisi e composizione dei moduli da
  [`../modules/`](../modules).
- [`variables.tf`](./variables.tf) / [`outputs.tf`](./outputs.tf): input e
  output del modulo radice.

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
- Applica i tag obbligatori (`Project`, `Owner`, `Environment`,
  `ManagedBy = "terraform"`) a ogni risorsa tramite `default_tags`.
- Istanzia i moduli da [`../modules/`](../modules), man mano che il progetto
  cliente li richiede (nessun modulo ancora presente: vedi CLAUDE.md §5 per
  le regole su provenienza ed uso dei moduli).

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
| `owner` | Nome del titolare del progetto, applicato come tag `Owner`. | sì |
| `project` | Nome del progetto, applicato come tag `Project`. | sì |
| `project_code` | Codice progetto usato nel prefisso di naming delle risorse. | sì |
| `environment` | `sandbox` o `production`. | sì |
| `environment_code` | `sbx` o `prd`, usato nel prefisso di naming delle risorse. | sì |
| `aws_account_id` | ID dell'account AWS di destinazione (guardia contro l'apply sull'account sbagliato). | sì |
| `aws_region` | Regione AWS di destinazione. | sì |
| `aws_role_enabled` | Se assumere `aws_role_arn`. Default `true` (produzione); impostato a `false` in sandbox. | no (default `true`) |
| `aws_role_arn` | ARN del ruolo cross-account da assumere. Obbligatorio quando `aws_role_enabled = true`, ignorato altrimenti. | sì se `aws_role_enabled = true` |
| `aws_role_external_id` | External ID richiesto dalla trust policy di `aws_role_arn`. Obbligatorio quando `aws_role_enabled = true`, ignorato altrimenti. | sì se `aws_role_enabled = true` |

## Output

Nessun output ancora definito: verranno aggiunti in
[`outputs.tf`](./outputs.tf) man mano che i moduli composti in
[`main.tf`](./main.tf) ne espongono di utili (es. URL del sito, ARN di
risorse da referenziare nella documentazione di handover).

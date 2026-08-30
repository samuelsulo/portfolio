# Environments

Input Terraform specifici per ambiente, consumati da [`../live/`](../live/),
che resta invece identico tra gli ambienti. Ogni ambiente è una sottocartella
qui che contiene esattamente due file:

| File | Scopo |
|---|---|
| `backend.hcl` | Configurazione del backend S3 per lo stato Terraform di questo ambiente (`bucket`, `key`, `region`, `use_lockfile`, `encrypt`). Passato tramite `terraform init -backend-config=...`. |
| `environment.tfvars` | Valori delle variabili specifici dell'ambiente (account ID, role ARN, dominio, soglie di budget, ...). Passato tramite `terraform plan/apply -var-file=...`. |

I valori condivisi da ogni ambiente di un progetto (es. `project`,
`aws_region`) vivono invece in
[`../live/project.auto.tfvars`](../live/project.auto.tfvars), caricato
automaticamente da Terraform.

## `sandbox`

Ambiente di sviluppo/test, nel mio account AWS, eliminabile per ogni
progetto. `bucket_force_destroy = true` così `terraform destroy` non si
blocca su contenuti di bucket rimasti da test precedenti. `aws_role_enabled
= false`: Terraform usa direttamente le mie credenziali attive, nessun
`AssumeRole` coinvolto.

## `production`

L'account AWS di proprietà del cliente. Creato solo quando esiste il ruolo
cross-account del cliente (`aws_role_enabled` resta al suo default `true`,
quindi `aws_role_arn` e `aws_role_external_id` sono obbligatori). Terraform
assume il ruolo nativamente ad ogni `init`/`plan`/`apply` tramite il blocco
`assume_role` del provider. Mai applicato senza un `plan` rivisto manualmente 
prima. Non presente finché il progetto non raggiunge quello stadio.

## Aggiungere un ambiente

```
make scaffold-environment ENV=<sandbox|production> ACCOUNT_ID=<id-account-12-cifre>
```

Genera `environment.tfvars` e `backend.hcl` per l'account AWS indicato,
leggendo `project`/`aws_region` da `../live/project.auto.tfvars`.

## Utilizzo

Selezionato tramite la variabile `ENV` su ogni target del Makefile (default
`sandbox`):

```
make plan ENV=production
```

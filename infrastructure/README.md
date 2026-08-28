# Infrastructure

Infrastruttura AWS per il sito vetrina statico del cliente, gestita
interamente con Terraform: S3 + CloudFront per l'hosting, ACM per HTTPS,
Route 53 per il DNS (opzionale), CloudTrail più un bucket di audit log per il
monitoraggio di base, e AWS Budgets per gli allarmi di costo.

## Struttura

```
infrastructure/
├── modules/          # moduli Terraform riutilizzabili (uno per competenza AWS)
├── live/             # modulo radice: compone i moduli, identico per ogni ambiente
├── environments/     # configurazione backend + valori delle variabili per ambiente (sandbox, production)
└── Makefile          # workflow Terraform (init/plan/apply/...), wrappa live/ + environments/
```

Vedi il README di ogni sottocartella per i dettagli:
[`modules/`](./modules), [`live/`](./live), [`environments/`](./environments).

## Ambienti

- **sandbox**: ambiente di sviluppo/test, nel mio account AWS, eliminabile
  per ogni progetto.
- **production**: l'account AWS di proprietà del cliente, raggiungibile
  solo tramite `AssumeRole` cross-account. Creato quando il progetto cliente
  raggiunge quello stadio.

## Prerequisiti

- Terraform >= 1.10 (richiesto dal locking nativo `use_lockfile` del backend
  S3, nessuna tabella DynamoDB coinvolta)
- AWS CLI configurata con le credenziali del mio account developer.
  L'`AssumeRole` verso l'account cliente in production è gestito
  nativamente da Terraform (`aws_role_enabled`, `aws_role_arn`,
  `aws_role_external_id` in [`environments/production/environment.tfvars`](./environments/production)):
  non serve assumere il ruolo a mano prima di `init`/`plan`/`apply`.

## Quickstart

```
make init ENV=sandbox      # terraform init con il backend dell'ambiente
make plan ENV=sandbox      # terraform plan, salvato in environments/sandbox/tfplan
make apply ENV=sandbox     # applica il plan salvato
```

Esegui `make help` per l'elenco completo dei target (validate, fmt, destroy,
gestione dello state, docs, ...). `ENV` di default è `sandbox`; passa
`ENV=production` esplicitamente, e solo dopo un plan rivisto manualmente.

## Scaffolding

```
make scaffold-module MODULE=<name>           # nuovo modulo sotto modules/
make scaffold-env ENV=<env> ACCOUNT_ID=<id>  # nuovo ambiente sotto environments/
```

## Documentazione

La documentazione funzionale, tecnica, architetturale e di handover vive in
[`../docs/`](../docs) e va tenuta aggiornata a ogni modifica
dell'infrastruttura.

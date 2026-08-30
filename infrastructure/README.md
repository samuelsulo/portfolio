# Infrastructure

Infrastruttura AWS per l'applicativo del cliente, gestita interamente con 
Terraform.

## Struttura

```
infrastructure/
├── modules/
│   ├── vendor/       # copie 1:1 da terraform-aws-catalog, mai modificate
│   └── local/        # moduli scritti per questo progetto
├── live/             # modulo radice: compone i moduli
├── environments/     # configurazione backend + variabili per ambiente
└── Makefile          # workflow Terraform (init/plan/apply/...), wrappa live/ 
│                       + environments/
```

Vedi il README di ogni sottocartella per i dettagli:
- [`modules/`](./modules)
- [`live/`](./live)
- [`environments/`](./environments).

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
  L'`AssumeRole` verso l'account cliente in production è gestito nativamente da 
  Terraform (`aws_role_enabled`, `aws_role_arn`, `aws_role_external_id` in 
  [`environments/production/environment.tfvars`](./environments/production)):
  non serve assumere il ruolo a mano prima di `init`/`plan`/`apply`.

## Quickstart

```
make init ENV=sandbox   # terraform init con il backend dell'ambiente
make plan ENV=sandbox   # terraform plan, salvato in environments/sandbox/tfplan
make apply ENV=sandbox  # applica il plan salvato
```

Esegui `make help` per l'elenco completo dei target (validate, fmt, destroy,
gestione dello state, docs, ...). `ENV` di default è `sandbox`; passa
`ENV=production` esplicitamente, e solo dopo un plan rivisto manualmente.

## Scaffolding

```
make scaffold-module MODULE=<name>          # nuovo modulo sotto modules/local/
make catalog-modules                        # elenca i moduli disponibili in terraform-aws-catalog
make catalog-versions MODULE=<name>         # elenca le versioni disponibili di un modulo del catalogo
make vendor-module MODULE=<name> REF=<tag>  # copia quella versione sotto modules/vendor/
make scaffold-env ENV=<env> ACCOUNT_ID=<id> # nuovo ambiente sotto environments/
```

## Documentazione

La documentazione di progetto vive in [`../docs/`](../docs) e va tenuta 
aggiornata a ogni modifica dell'infrastruttura.

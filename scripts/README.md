# Scripts

Automazioni di supporto al progetto che non passano da Terraform o dal
Makefile di [`../infrastructure/`](../infrastructure): setup una tantum,
bootstrap, operazioni da riga di comando sull'account AWS di destinazione.

## Script disponibili

| Script | Scopo |
|---|---|
| [`bootstrap-terraform-backend.sh`](./bootstrap-terraform-backend.sh) | Crea (una volta sola) il bucket S3 per lo stato Terraform di tutti i progetti di un account AWS: versioning, cifratura, blocco accesso pubblico, policy solo-HTTPS, lifecycle sulle versioni non correnti. Idempotente: se il bucket esiste già, ne riallinea solo la configurazione. |
| [`deploy-website.sh`](./deploy-website.sh) | Builda `website/` (test + `vue-tsc` + `vite build`) e pubblica `dist/` sul bucket S3 e la distribuzione CloudFront dell'ambiente indicato (letti dallo stato Terraform di `infrastructure/live`, mai hardcoded), poi invalida la cache CloudFront. Traccia ogni deploy in `website/deploy-log/<env>.md` (data, commit, bucket, distribuzione, invalidation). Idempotente: rieseguibile senza effetti collaterali. Usage: `./scripts/deploy-website.sh <sandbox\|production>`. |
| [`install-hooks.sh`](./install-hooks.sh) | Punta `core.hooksPath` a [`../.githooks/`](../.githooks) e rende gli hook eseguibili. Da eseguire una volta dopo ogni clone. Unico script qui che non opera su un account AWS: eccezione ai prerequisiti sotto. |

## Prerequisiti

- AWS CLI configurata, con le credenziali dell'account AWS di destinazione
  già attive nella shell al momento dell'esecuzione: gli script operano
  sull'account restituito da `aws sts get-caller-identity`, mai su un ID
  passato a mano.
  - **sandbox** (mio account): `aws login --profile my-profile`.
  - **production** (account del cliente): a differenza dei comandi
    Terraform del Makefile, che assumono il ruolo cross-account
    nativamente tramite il blocco `assume_role` del provider (vedi
    [`../infrastructure/README.md`](../infrastructure/README.md#prerequisiti)),
    questi script eseguono chiamate AWS CLI dirette e richiedono quindi di
    assumere il ruolo a mano prima di lanciarli (es. `aws sts assume-role`
    con l'ARN e l'external ID del cliente, esportando le credenziali
    temporanee restituite nella shell).

## Utilizzo

```
./scripts/bootstrap-terraform-backend.sh
```

Va eseguito una sola volta per ogni account AWS (mio account per sandbox,
account del cliente per production), prima del primo `make init` in
[`../infrastructure/`](../infrastructure) su quell'account: il bucket
creato è quello referenziato da `backend.hcl` in
[`../infrastructure/environments/`](../infrastructure/environments).

## Aggiungere uno script

Un nuovo script qui deve:

- avere estensione `.sh`, essere eseguibile (`chmod +x`) e usare
  `set -euo pipefail`;
- operare sempre sull'account AWS delle credenziali correnti, mai su un ID
  account passato come parametro;
- essere idempotente quando possibile (rieseguibile senza effetti
  collaterali se lo stato desiderato è già raggiunto);
- essere aggiunto alla tabella qui sopra.

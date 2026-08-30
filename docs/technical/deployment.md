# Guida al deployment

Come pubblicare `website/` sull'infrastruttura di un ambiente (sandbox o
production), a partire da zero.

## Prerequisiti

- L'infrastruttura dell'ambiente di destinazione deve essere già applicata:
  `make apply ENV=<sandbox|production>` da [`../../infrastructure/`](../../infrastructure)
  (vedi il suo [README](../../infrastructure/README.md)). Il modulo
  `website_hosting` deve esistere nello stato Terraform di quell'ambiente:
  è da lì che [`deploy-website.sh`](../../scripts/deploy-website.sh) legge
  bucket S3 e distribuzione CloudFront, mai da valori hardcoded.
- AWS CLI configurata, con le credenziali dell'account AWS di destinazione
  già attive nella shell (stesso prerequisito degli altri script in
  [`../../scripts/README.md`](../../scripts/README.md#prerequisiti)).
- Versioni di `node` e `terraform` allineate a [`../../mise.toml`](../../mise.toml)
  (`mise install` dalla root del repository).

## Deploy

```bash
./scripts/deploy-website.sh sandbox      # o production
```

Lo script, in ordine:

1. installa le dipendenze (`npm ci`) ed esegue gli unit test (`npm run test`);
2. builda il bundle di produzione (`npm run build`, con type-check incluso),
   in `website/dist/`;
3. legge bucket S3 e distribuzione CloudFront dallo stato Terraform
   dell'ambiente indicato;
4. sincronizza `dist/` sul bucket (`aws s3 sync --delete`): asset con hash
   nel nome (JS/CSS/font) con cache lunga e immutabile, `index.html` sempre
   senza cache, così un deploy è visibile subito senza attendere la
   scadenza della cache lato client;
5. invalida la distribuzione CloudFront (`/*`), cosi la CDN smette di
   servire le versioni precedenti degli asset con cache;
6. registra il deploy in `website/deploy-log/<env>.md` (data UTC, commit,
   bucket, distribuzione, ID invalidation), tracciabilità richiesta per ogni
   deploy in production da
   [`CLAUDE.md` §7](../../CLAUDE.md#7-regole-di-deployment).

Nessun deploy diretto in production senza che l'ambiente sandbox sia stato
prima validato con lo stesso script (vedi
[`CLAUDE.md` §7](../../CLAUDE.md#7-regole-di-deployment)).

## Rollback

Il bucket S3 del modulo `website_hosting` è versionato: una versione
precedente di un oggetto può essere ripristinata da console o CLI
(`aws s3api list-object-versions` / `aws s3api copy-object` con la
`VersionId` desiderata), seguita da una nuova invalidazione CloudFront
sullo stesso `distribution_id` letto dallo stato Terraform. In alternativa,
eseguire di nuovo `deploy-website.sh` dopo un `git checkout` del commit da
ripristinare.

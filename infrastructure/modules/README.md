# Modules

Moduli Terraform riutilizzabili, uno per ciascuna competenza AWS, composti
insieme in [`../live/main.tf`](../live/main.tf): lo stesso set sia per
`sandbox` sia per `production` (CLAUDE.md §5: gli ambienti restano
simmetrici).

## Moduli disponibili

| Modulo | Scopo |
|---|---|
| [`website`](./website) | Stack di hosting statico per il sito del cliente: origine S3, CloudFront (HTTPS, OAC), certificato ACM, Route 53 opzionale. |
| [`audit-logs`](./audit-logs) | Bucket S3 privato e versionato per gli audit log, con lifecycle a livelli e bucket policy componibile. |
| [`cloudtrail`](./cloudtrail) | Trail CloudTrail che scrive nel bucket di `audit-logs`. |
| [`budgets`](./budgets) | AWS Budgets mensili/annuali con notifiche email di allarme. |

## Convenzioni

- Una competenza AWS per modulo; nessuna risorsa viene creata direttamente
  in `environments/` o `live/` se esiste (o ha senso creare) un modulo per
  quello scopo.
- Ogni modulo ha la stessa struttura di file: `main.tf`, `variables.tf`,
  `outputs.tf`, `versions.tf`, `README.md`.
- Ogni variabile e output ha una `description`: le tabelle Input/Output del
  README di ciascun modulo le rispecchiano.
- I moduli non configurano il backend né il provider AWS stesso (a parte
  l'alias `aws.us_east_1` richiesto da `website` per ACM/CloudFront): è
  responsabilità di `live/`, così lo stesso modulo funziona invariato in
  ogni ambiente.
- I tag (`Project`, `Client`, `Environment`, `ManagedBy`) sono applicati una
  sola volta tramite `default_tags` sul provider in `live/main.tf`, non
  ripetuti in ogni modulo.

## Aggiungere un modulo

```
make scaffold-module MODULE=<name>
```

Crea `modules/<name>/{main,variables,outputs,versions}.tf` + `README.md`.
Dopo averlo compilato, collegalo in `../live/main.tf` e aggiungi una riga
alla tabella qui sopra.

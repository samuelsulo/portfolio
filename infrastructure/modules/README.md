# Modules

Moduli Terraform riutilizzabili, uno per ciascuna competenza AWS, composti
insieme in [`../live/main.tf`](../live/main.tf): lo stesso set per ogni
`environment` (CLAUDE.md §5: gli ambienti restano simmetrici).

## Struttura

```
modules/
├── vendor/     # copie 1:1 da terraform-aws-catalog, mai modificate
└── local/      # moduli scritti per questo progetto
```

Vedi [`vendor/README.md`](./vendor/README.md) e [`local/README.md`](./local/README.md)
per la provenienza e le regole di ciascuna delle due sottocartelle
(CLAUDE.md §5).

## Convenzioni comuni

Valgono per i moduli in entrambe le sottocartelle:

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
- I tag (`Project`, `Owner`, `Environment`, `ManagedBy`) sono applicati una
  sola volta tramite `default_tags` sul provider in `live/providers.tf`, non
  ripetuti in ogni modulo.

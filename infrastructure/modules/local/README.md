# Local

Moduli Terraform scritti specificamente per questo progetto: si usa questa
cartella solo quando nessun modulo di `terraform-aws-catalog` copre lo scope
necessario e il bisogno non è abbastanza generico da giustificare
l'aggiunta di un nuovo modulo al catalogo (CLAUDE.md §5). Diversamente da
[`../vendor/`](../vendor), questi moduli sono di proprietà del progetto e si
possono modificare liberamente.

## Moduli disponibili

| Modulo | Scopo |
|---|---|

## Aggiungere un modulo

```
make scaffold-module MODULE=<name>
```

Crea `modules/local/<name>/{main,variables,outputs,versions}.tf` + `README.md`.
Dopo averlo compilato, collegalo in [`../../live/main.tf`](../../live/main.tf)
e aggiungi una riga alla tabella qui sopra.

# Vendor

Copie 1:1 di moduli presi da `terraform-aws-catalog` (repo separato con i
moduli Terraform riutilizzabili tra tutti i progetti cliente).

## Moduli disponibili

| Modulo | Scopo |
|---|---|

## Regole (CLAUDE.md §5)

- Il codice va **copiato qui** nel momento in cui il progetto ne ha bisogno.
  Mai un `source` Git remoto verso il catalogo, nemmeno in sviluppo: il
  progetto dev'essere autosufficiente da subito, non solo alla consegna.
- Un modulo copiato qui **non va mai modificato**: resta una copia 1:1, byte
  per byte, di quello nel catalogo, per restare tracciabile e allineato alla
  sua versione.
- La provenienza vive in un file `VENDORED.md` accanto ai file del modulo
  (fonte, nome modulo, tag, commit, data), generato automaticamente dal
  comando di copia. Mai un commento infilato nel codice Terraform: terrebbe
  il modulo diverso, byte per byte, dall'originale nel catalogo.
- Se un modulo del catalogo non copre esattamente lo scope richiesto dal
  progetto, non va adattato qui: si combinano più moduli in `live/`, oppure
  (se lo scope è generico) si aggiunge un nuovo modulo al catalogo stesso. Se
  invece il bisogno è davvero specifico di questo cliente, il modulo va
  scritto in [`../local/`](../local), non qui.

## Versionamento

Il catalogo è un monorepo con più moduli: un tag unico per l'intero repo
(es. `v2.0.0`) confonderebbe il versionamento di moduli non correlati (un
breaking change nel modulo A farebbe salire la major anche per B, che magari
non è cambiato). Per questo ogni modulo si tagga **singolarmente**, con tag
del tipo `<module-name>/vX.Y.Z` (es. `s3-static-site/v1.3.0`,
`budgets/v2.0.0`): un bump riguarda solo il modulo a cui appartiene.

## Aggiungere un modulo

```
make catalog-modules                        # elenca i moduli disponibili nel catalogo
make catalog-versions MODULE=<name>         # elenca le versioni disponibili di un modulo
make vendor-module MODULE=<name> REF=<tag>  # copia quella versione in modules/vendor/<name>/
```

`vendor-module` clona `terraform-aws-catalog` al tag indicato, copia
`modules/<name>/` dal catalogo dentro `modules/vendor/<name>/` e scrive
`modules/vendor/<name>/VENDORED.md` con la provenienza. `CATALOG_REPO` va
impostato una volta sola in [`../../Makefile`](../../Makefile) (o passato
inline a ciascuno di questi comandi). Dopo la copia, collega il modulo in
[`../../live/main.tf`](../../live/main.tf) e aggiungi una riga alla tabella
qui sopra.

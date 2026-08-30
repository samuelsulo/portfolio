# Workflows

Workflow GitHub Actions per il controllo automatico dell'infrastruttura
Terraform. Al momento questa cartella non contiene ancora nessun workflow:
i controlli descritti in [`CLAUDE.md` §5](../../CLAUDE.md#5-regole-terraform)
(`terraform validate` e un `plan` pulito prima di ogni `apply`) sono oggi
eseguiti manualmente tramite i target del 
[`Makefile`](../../infrastructure/Makefile) (`make validate`, `make fmt-check`, 
`make plan`, ...).

## Ambito consentito

Un workflow introdotto in questa cartella può:

- Eseguire `make fmt-check` e `make validate ENV=sandbox` su ogni pull
  request, come controllo prima del merge.
- Eseguire `make plan ENV=sandbox` per mostrare l'esecuzione prevista, senza
  applicarla.

Un workflow **non** deve mai:

- Eseguire `make apply` (o `apply-auto`) su `environments/production`: ogni
  `apply` in produzione richiede un `plan` rivisto manualmente, non solo
  dall'assistente AI (vedi [`CLAUDE.md` §5](../../CLAUDE.md#5-regole-terraform)
  e [§9](../../CLAUDE.md#9-modifiche-che-richiedono-revisione-manuale)).
- Contenere credenziali AWS in chiaro nel file del workflow: le credenziali
  vanno lette da secret configurati su GitHub, mai committate.

Introdurre un workflow che automatizzi l'`apply` su `production`, anche
dietro approvazione manuale nel workflow stesso, è una modifica al flusso di
deployment e va segnalata e concordata prima di essere implementata (vedi
[`CLAUDE.md` §9](../../CLAUDE.md#9-modifiche-che-richiedono-revisione-manuale)).

## Aggiungere un workflow

Un nuovo file `.yaml` in questa cartella viene raccolto automaticamente da 
GitHub Actions, senza ulteriore configurazione. Alla sua aggiunta, aggiorna 
questo README con nome del workflow, trigger (es. `pull_request`) e cosa 
verifica.

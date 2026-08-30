# Terraform AWS Infrastructure Template

Questo repository gestisce l'infrastruttura AWS e il sito vetrina di Samuel Sulo. Le regole vincolanti per chi lavora su un progetto nato
da questo template (struttura, stack, sicurezza, flusso di consegna) sono
definite in [`CLAUDE.md`](./CLAUDE.md) e valgono per ogni cliente.

## Modello

```
cliente -> progetto -> sviluppo -> consegna -> chiusura
```

Sviluppo e test avvengono in un ambiente sandbox isolato nel mio account
AWS, eliminabile dopo la consegna. La produzione vive esclusivamente
nell'account AWS del cliente, raggiunto solo tramite `AssumeRole`
cross-account, mai con credenziali permanenti in mio possesso.

## Struttura

```
client-project/
├── infrastructure/   # infrastruttura AWS in Terraform
├── docs/             # documentazione di progetto
├── scripts/          # automazioni
├── .githooks/        # git hook versionati (commit-msg, pre-commit)
├── README.md         # README di progetto
└── CLAUDE.md         # guardrail di progetto
├── website/          # sorgente Vue.js/TypeScript/Vite del sito
├── tests/            # test unit (Vitest) ed e2e (Playwright)
```

Vedi il README di ogni sottocartella per i dettagli:
 - [`docs/`](./docs)
 - [`infrastructure/`](./infrastructure)
 - [`scripts/`](./scripts)
 - [`website/`](./website)

Dopo il clone, installa una volta l'hook che verifica i commit e formatta
Terraform prima di ogni commit:

```
./scripts/install-hooks.sh
```

## Stack tecnologico

- **Infrastruttura**: Terraform e provider AWS ufficiale.

## Documentazione

La documentazione di ogni progetto cliente vive in `docs/` e va tenuta 
aggiornata a ogni modifica rilevante del codice o dell'infrastruttura. 
Le regole complete su cosa deve contenere sono in 
[`CLAUDE.md`](./CLAUDE.md#8-documentazione-obbligatoria).

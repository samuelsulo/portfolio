# Website Factory template

Template di partenza per un sito vetrina professionale a consegna unica
(ristorante, bar, negozio, attività di servizi): al termine del progetto il
cliente riceve codice, infrastruttura e documentazione completi e diventa
autonomo. Le regole vincolanti per chi lavora su un progetto nato da questo
template (struttura, stack, sicurezza, flusso di consegna) sono definite in
[`CLAUDE.md`](./CLAUDE.md) e valgono per ogni cliente.

## Modello

```
Cliente -> progetto -> sviluppo -> consegna -> chiusura
```

Sviluppo e test avvengono in un ambiente sandbox isolato nel mio account
AWS, eliminabile dopo la consegna. La produzione vive esclusivamente
nell'account AWS del cliente, raggiunto solo tramite `AssumeRole`
cross-account, mai con credenziali permanenti in mio possesso.

## Struttura

```
client-project/
├── infrastructure/   # infrastruttura AWS in Terraform (moduli + ambienti sandbox/production)
├── website/          # sorgente Vue.js/TypeScript/Vite del sito
├── tests/            # test unit (Vitest) ed e2e (Playwright)
├── docs/             # documentazione funzionale, tecnica, architetturale e di handover
├── scripts/          # automazioni (bootstrap, deploy, assume-role)
├── README.md
└── CLAUDE.md         # guardrail di progetto, vale per ogni cliente
```

`website/`, `tests/` e `docs/` vengono popolati all'avvio di ogni progetto
cliente; `infrastructure/` e `scripts/` sono già scaffoldati da questo
template. Vedi il README di ogni sottocartella per i dettagli:
[`infrastructure/`](./infrastructure) e [`scripts/`](./scripts).

## Stack tecnologico

- **Frontend**: Vue 3 + TypeScript + Vite, Composition API.
- **Internazionalizzazione**: vue-i18n, italiano come lingua di default e inglese come seconda lingua.
- **Infrastruttura**: Terraform, provider AWS ufficiale. Stack di hosting di
  default: sito statico su S3 + CloudFront.
- **Test**: Vitest (unit), Playwright (e2e).
- **Package manager**: npm.

## Documentazione

La documentazione funzionale, tecnica, architetturale e di handover di ogni
progetto cliente vive in `docs/` (creata all'avvio del progetto) e va tenuta
aggiornata a ogni modifica rilevante del codice o dell'infrastruttura. Le
regole complete su cosa deve contenere sono in [`CLAUDE.md`](./CLAUDE.md#10-documentazione-obbligatoria).

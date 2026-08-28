# Samuel Sulo Portfolio

Questo repository gestisce l'infrastruttura AWS e il sito vetrina di Samuel Sulo

Le regole vincolanti per chi lavora su un progetto nato da questo template
(modello di progetto, architettura, stack tecnologico, sicurezza, testing,
flusso di consegna) sono definite in [`CLAUDE.md`](./CLAUDE.md) e valgono per
ogni cliente: non sono ripetute qui.

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

`docs/` viene popolata all'avvio di ogni progetto cliente secondo le regole
di [`CLAUDE.md`](./CLAUDE.md#10-documentazione-obbligatoria);
`website/`, `tests/`, `infrastructure/` e `scripts/` sono già scaffoldati da
questo template. Vedi il README di ogni sottocartella per i dettagli:

- [`website/`](./website)
- [`infrastructure/`](./infrastructure)
- [`scripts/`](./scripts)

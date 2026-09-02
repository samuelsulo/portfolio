# Portfolio Website

Sito vetrina single-page per la presentazione professionale di Samuel Sulo come Cloud Engineer & Web Developer: sezioni Chi sono, Servizi, Progetti e Contatti, con identità visiva dark cyberpunk/neon e supporto bilingue italiano/inglese.

## Stack tecnologico

- Vue 3 (Composition API, `<script setup>`) + TypeScript in strict mode
- Vite come build tool
- vue-i18n per l'internazionalizzazione (italiano di default, inglese come seconda lingua)
- CSS scoped nei componenti + design token condivisi in `src/styles/` (nessun CSS framework)
- Font self-hosted (`@fontsource-variable`), nessuna chiamata a servizi esterni in fase di runtime
- Vitest + Vue Test Utils per gli unit test
- ESLint + Prettier per la qualità del codice

## Requisiti

Le versioni degli strumenti sono gestite tramite `mise` (vedi `mise.toml` nella root del repository). Da questa cartella:

```bash
mise exec -- npm install
```

## Script disponibili

```bash
npm run dev          # dev server con hot reload
npm run build         # type-check + build di produzione in dist/
npm run preview       # anteprima della build di produzione
npm run test          # unit test (una sola esecuzione)
npm run test:watch    # unit test in watch mode
npm run type-check    # solo type-check (vue-tsc)
npm run lint          # ESLint con --fix
npm run format         # Prettier su src/
```

Tutti i comandi vanno eseguiti tramite `mise exec --` (o con una shell in cui `mise` ha già attivato le versioni di `mise.toml`).

## Struttura del progetto

```text
website/
├── public/                  # asset statici serviti as-is (favicon, immagini placeholder)
├── src/
│   ├── components/
│   │   ├── layout/          # NavBar, AppFooter
│   │   ├── sections/        # Hero/About, Services, Projects, Contact
│   │   └── ui/               # componenti riutilizzabili (card, bottoni, icone, ecc.)
│   ├── composables/          # logica riutilizzabile (scroll spy, form contatti, ecc.)
│   ├── data/                 # contenuti data-driven (services.json, projects.json, site-config.json)
│   ├── i18n/                 # configurazione vue-i18n + file di traduzione it/en
│   ├── services/              # layer di integrazione con servizi esterni (contact form API)
│   ├── styles/                # design token e reset condivisi
│   ├── types/                  # tipi TypeScript condivisi
│   └── utils/                  # funzioni pure (validazione form, ecc.)
└── vite.config.ts / vitest.config.ts / tsconfig*.json
```

Gli unit test vivono nella cartella `tests/unit/` alla radice del repository (non dentro `website/`), come previsto dalla struttura standard di progetto descritta in `CLAUDE.md`; `vitest.config.ts` è configurato per scoprirli da lì.

## Contenuti: come modificarli

- **Testi discorsivi (bio, servizi, progetti, etichette UI)**: vivono nei file di traduzione `src/i18n/locales/it.json` e `src/i18n/locales/en.json`. Ogni chiave va aggiornata in entrambi i file.
- **Dati non traducibili di Services e Projects** (icona, tecnologie, immagini, URL): vivono in `src/data/services.json` e `src/data/projects.json`. Ogni voce fa riferimento a una `translationKey` che punta al blocco corrispondente nei file di traduzione.
- **Dati di contatto/social** (email, social link): `src/data/site-config.json`.

I contenuti attualmente presenti (bio, elenco servizi, progetti, email, link social) sono **placeholder** pensati per essere sostituiti con i contenuti reali senza modificare alcun componente Vue.

## Contact form: backend

Il form di contatto è collegato al modulo `contact_api` (API Gateway + SES) descritto in [`../infrastructure/`](../infrastructure). Il frontend chiama `POST {VITE_CONTACT_API_URL}/email`, dove `VITE_CONTACT_API_URL` è il dominio custom del modulo (es. `https://contact.samuelsulo.it`).

In sandbox/production questa variabile viene iniettata automaticamente da [`../scripts/deploy-website.sh`](../scripts/deploy-website.sh), che la legge dallo stato Terraform di `infrastructure/live` invece di averla hardcoded. Per sviluppo locale (`npm run dev`) contro un ambiente già applicato, copia `.env.example` in `.env.local` e valorizzala a mano; `.env.local` non va mai committato.

Se `VITE_CONTACT_API_URL` non è impostata (es. il modulo `contact_api` non è ancora stato applicato in quell'ambiente), `src/services/contactService.ts` restituisce un errore esplicito (`ContactApiNotConfiguredError`) e il form mostra correttamente lo stato di errore invece di un falso successo.

## Accessibilità e responsive

- Skip link, markup semantico, focus visibile, `aria-*` sugli elementi interattivi, form con label associate ed errori non basati solo sul colore.
- Rispetto di `prefers-reduced-motion` sia in CSS sia nelle animazioni/transizioni gestite via JavaScript.
- Layout responsive mobile-first; la sezione Progetti usa uno scroll orizzontale touch-friendly con frecce di navigazione su desktop.

## Prossimi passi (fuori dallo scope di questa iterazione)

- Suite di test e2e (Playwright) in `tests/e2e/`.
- Sostituzione dei contenuti placeholder (bio, progetti, immagini, contatti reali).

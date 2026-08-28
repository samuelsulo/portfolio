# CLAUDE.md: Guardrail di progetto

Questo file istruisce chi lavora su questo repository (umano o assistente AI) su come operare all'interno di questo progetto. Vale per **ogni cliente**: la struttura, le convenzioni e le regole sono standard e non vanno reinventate progetto per progetto. Se una richiesta del cliente sembra richiedere di deviare da queste regole, fermati e segnala la deviazione invece di procedere in autonomia (vedi "Modifiche che richiedono revisione manuale").

## 1. Cos'è questo progetto

Un sito vetrina professionale per un piccolo cliente locale (ristorante, bar, negozio, attività di servizi). Il progetto è **a consegna unica**: al termine, il cliente riceve codice, infrastruttura e documentazione completi e diventa autonomo. Non è una piattaforma SaaS, non ha multi-tenancy, non ha dashboard di gestione clienti, non prevede hosting permanente nel mio AWS account.

Modello: `Cliente → progetto → sviluppo → consegna → chiusura`.

## 2. Architettura

```
MY AWS ACCOUNT (sviluppo/sandbox)
      |
      | AssumeRole (cross-account, a tempo/revocabile)
      v
CLIENT AWS ACCOUNT (produzione, di proprietà del cliente)
      |
      +-- S3 (hosting statico)
      +-- CloudFront (CDN + HTTPS)
      +-- ACM (certificati SSL)
      +-- Route 53 (DNS, se il dominio è gestito su AWS)
      +-- CloudWatch (monitoring base)
      +-- AWS Budgets (allarme costi)
```

Regole architetturali fisse:

- La produzione vive **esclusivamente** nell'AWS account del cliente, mai nel mio.
- Lo sviluppo e i test avvengono nel mio account, in un ambiente sandbox isolato per cliente, eliminabile dopo la consegna.
- L'accesso al cliente avviene solo tramite ruolo cross-account (`AssumeRole`), mai con credenziali root o IAM permanenti del cliente in mio possesso.
- Il cliente deve poter revocare il mio accesso in autonomia in qualsiasi momento (rimozione/modifica del ruolo cross-account).
- Stack di hosting di default: sito statico (S3 + CloudFront). Non introdurre backend, database o compute (Lambda, EC2, ECS) a meno che il cliente non ne abbia esplicitamente bisogno, e in tal caso trattalo come **modifica architetturale che richiede revisione manuale** (vedi sezione 11).

## 3. Stack tecnologico

- **Frontend**: Vue 3 + TypeScript + Vite. Composition API (`<script setup>`), niente Options API nel codice nuovo.
- **Internazionalizzazione**: vue-i18n (Composition API, `useI18n`), unico strumento di gestione traduzioni in ogni progetto. Lingua di default: italiano (`it`); seconda lingua: inglese (`en`). Non introdurre altre lingue né altri tool di gestione traduzioni senza richiesta esplicita del cliente.
- **Styling**: CSS scoped nei componenti o CSS variabile condiviso in `src/styles/`. Evitare l'introduzione di framework CSS pesanti (Tailwind, Bootstrap...) salvo richiesta esplicita: la maggior parte di questi siti sono poche pagine e non giustificano la dipendenza.
- **Infrastruttura**: Terraform (ultima versione stabile, provider AWS ufficiale). Nessun CloudFormation, CDK o Pulumi: uno strumento solo, per coerenza tra tutti i progetti cliente.
- **Package manager**: npm (coerenza tra progetti, evitare di mischiare yarn/pnpm tra clienti diversi senza motivo).

## 4. Struttura del repository

```
client-project/
├── infrastructure/
│   ├── modules/              # moduli Terraform riutilizzabili (static-site, cross-account-role, budgets, monitoring)
│   └── environments/
│       ├── sandbox/          # ambiente di sviluppo (mio AWS account)
│       └── production/       # ambiente di produzione (AWS account del cliente)
├── website/                  # sorgente Vue.js/TypeScript/Vite
├── tests/
│   ├── unit/
│   └── e2e/
├── docs/
│   ├── architecture/         # diagrammi e decisioni architetturali
│   └── handover/             # documentazione di consegna
├── scripts/                  # automazioni (bootstrap, deploy, assume-role)
├── README.md
└── CLAUDE.md
```

Non spostare né rinominare queste cartelle di primo livello: gli script e la documentazione di handover assumono questa struttura.

## 5. Regole Terraform

- Ogni risorsa AWS passa da un modulo in `infrastructure/modules/`. Non scrivere risorse "inline" negli environment se esiste già (o ha senso creare) un modulo.
- `environments/sandbox` ed `environments/production` devono restare simmetrici: stesse variabili, stessi moduli, valori diversi. Se production diverge strutturalmente da sandbox, è una modifica che richiede revisione manuale.
- **Mai** committare: credenziali AWS, access key, secret, file `.env` con valori reali, `terraform.tfstate` o `.tfvars` con dati sensibili.
- Il backend dello stato Terraform va configurato per ogni progetto separatamente (es. S3 backend nel mio account per sandbox, S3 backend nell'account del cliente per production) e mai lasciato locale in un repo consegnato.
- Ogni risorsa deve avere tag minimi: `Project`, `Client`, `Environment`, `ManagedBy = "terraform"`.
- AWS Budgets è obbligatorio in ogni environment di produzione, con soglia di allarme concordata con il cliente.
- Prima di ogni `apply` in production, deve esserci stato un `plan` rivisto da me, non solo dall'assistente AI: vedi sezione 11.

## 6. Regole frontend

- Componenti piccoli e mirati: una sezione di pagina = un componente quando ha senso, non monoliti da centinaia di righe.
- TypeScript strict mode attivo (`tsconfig.json` del template non va allentato senza motivo).
- Accessibilità di base obbligatoria: markup semantico, `alt` sulle immagini, contrasto colori adeguato, form navigabili da tastiera.
- Performance: immagini ottimizzate/responsive, niente librerie pesanti per effetti che si possono fare in CSS.
- SEO di base obbligatorio per siti vetrina: meta title/description per pagina, Open Graph, sitemap, dati struttura locale (LocalBusiness schema.org) quando pertinente.
- Contenuti reali del cliente (testi, immagini, orari, contatti) vivono in un punto unico (es. file di configurazione/CMS-lite), non sparsi e duplicati nei componenti.
- Nessuna stringa di interfaccia (voci di navigazione, bottoni, etichette dei form, messaggi di stato, titoli di sezione) va scritta direttamente nei template o negli script dei componenti: passa sempre da `useI18n()` e dalla funzione `t()`, con chiave definita nei file di traduzione (`src/i18n/locales/it.json` come sorgente di verità, `en.json` mantenuto in parallelo con le stesse chiavi).
- I contenuti reali del cliente che sono testo discorsivo destinato a essere letto in entrambe le lingue (nome attività, claim, descrizioni, etichette di giorni/orari) vivono anch'essi nei file di traduzione, non nel file di configurazione: quest'ultimo contiene solo i dati non traducibili o identici in ogni lingua (telefono, email, indirizzo, orari come intervallo numerico, URL dei social).
- Il selettore di lingua è sempre presente nella barra di navigazione principale, accessibile da tastiera, e la scelta dell'utente viene ricordata tra le visite (es. `localStorage`).
- Aggiungere una lingua non prevista in questo file è una **modifica che richiede revisione manuale** (vedi sezione 11): di norma il progetto resta limitato a italiano e inglese.

## 7. Testing

- **Unit test** obbligatori per logica non banale (composables, utility, validazione form). Framework: Vitest.
- **E2E test** minimi obbligatori prima della consegna: caricamento homepage, navigazione principale, invio form di contatto (se presente), verifica responsive di base. Framework: Playwright.
- Nessuna consegna al cliente senza che la suite di test, per quanto minima, passi.
- I test infrastrutturali (validazione Terraform: `terraform validate`, `terraform plan` pulito) sono parte del processo di deploy, non opzionali.

## 8. Sicurezza

- Nessuna credenziale, chiave o segreto in chiaro nel repository, in nessun commit, nemmeno nella storia.
- Il ruolo cross-account usato per l'accesso al cliente deve avere permessi minimi necessari (principio del privilegio minimo), non `AdministratorAccess` permanente se evitabile.
- MFA obbligatorio sul root account del cliente (verificato durante la call di setup) e sul mio account AWS.
- HTTPS obbligatorio ovunque (ACM + CloudFront), nessun endpoint pubblico in solo HTTP.
- Bucket S3 di hosting mai pubblici direttamente: accesso solo tramite CloudFront (Origin Access Control).
- Nessun dato personale del cliente (email, form di contatto) va salvato o processato al di fuori dell'infrastruttura del cliente stesso senza il suo consenso esplicito.

## 9. Regole di deployment

- Flusso obbligatorio: sviluppo in sandbox → test → review interna → `AssumeRole` nell'account cliente → deploy in production → validazione → handover.
- Nessun deploy diretto in production senza che sandbox sia stato validato prima.
- Ogni deploy in production è tracciato (log di cosa è stato applicato, quando, con quale versione del codice/Terraform state).
- Dopo la consegna, l'ambiente sandbox relativo al cliente va smantellato (evitare costi residui a mio carico).

## 10. Documentazione obbligatoria

Ogni progetto, prima della chiusura, deve avere in `docs/`:

- Documentazione funzionale (cosa fa il sito, per chi, contenuti)
- Documentazione tecnica (stack, come sviluppare/estendere il codice)
- Documentazione architetturale + diagramma (in `docs/architecture/`)
- Guida al deployment (come fare un deploy da zero)
- Guida operativa (come aggiornare contenuti, monitorare costi, gestire il dominio)
- Documentazione di handover (in `docs/handover/`): checklist di consegna, accessi trasferiti, cosa il cliente possiede ora

La documentazione va aggiornata **ad ogni modifica rilevante** al codice o all'infrastruttura, non solo alla fine. Se generi o modifichi codice che rende una parte della documentazione obsoleta, aggiorna anche quella nello stesso intervento.

## 11. Modifiche che richiedono revisione manuale (l'assistente AI non deve procedere in autonomia)

Ferma il lavoro e segnala esplicitamente prima di procedere se una richiesta implica una di queste cose:

- Introdurre backend, database, compute server-side o qualunque servizio AWS non elencato nella sezione 2
- Modificare i permessi del ruolo cross-account (allargarli)
- Qualunque `terraform apply` diretto su `environments/production`
- Introdurre autenticazione utenti, aree riservate, e-commerce/pagamenti
- Cambiare il modello di hosting (es. passare da statico a server-rendered)
- Aggiungere una lingua oltre a italiano e inglese, o sostituire vue-i18n con un altro strumento/servizio di gestione traduzioni
- Qualunque cosa che avvicini il progetto a un modello SaaS/multi-tenant/gestione centralizzata di più clienti nello stesso account o stack

In questi casi: proponi la soluzione, spiega perché esce dal perimetro standard, e aspetta conferma esplicita prima di implementare.

## 12. Convenzioni generali

- **Nessun riferimento, in nessuna parte del repository, allo strumento di AI generativa usato per svilupparlo.** Codice sorgente, commenti, nomi di variabili/risorse, file di configurazione, contenuti Markdown (README, `docs/`), messaggi di commit e testo visibile sul sito non devono mai nominare lo strumento (o il fornitore) di AI usato, né segnalare in altro modo che una parte del progetto è stata generata da un'AI. Il repository viene consegnato al cliente come un normale lavoro di sviluppo: chi lo riceve non deve poter dedurre quali strumenti siano stati usati internamente. L'unica eccezione tecnica è il nome di questo file (`CLAUDE.md`), imposto dallo strumento di sviluppo stesso e non rinominabile senza perderne il riconoscimento automatico.
- **Lingua**: codice sorgente, commenti, `description` di variabili/output, messaggi di errore, file di configurazione (Terraform, CI, ecc.) e commit message sono sempre in inglese. Tutti i file `.md` del repository (README, `docs/`) sono sempre in italiano. In entrambi i casi i termini tecnici senza una traduzione naturale (AWS, S3, bucket, Terraform, CloudFront, deploy, ecc.) restano in inglese anche dentro un file `.md`.
- **Punteggiatura**: mai usare il trattino lungo em dash (`—`) in nessun testo del repository, incluso codice, commenti, commit message, contenuti del sito e file `.md`. Preferire sempre la punteggiatura italiana corretta a seconda del contesto: virgola, punto, due punti, punto e virgola, o trattino breve con spazi (` - `) per gli incisi. Nei testi in inglese usare la punteggiatura equivalente in inglese (virgola, parentesi, due punti) evitando comunque l'em dash.
- Commit message in inglese, imperativo, concisi (`add contact form validation`, non `added stuff`).
- Nomi file/cartelle in kebab-case.
- Variabili Terraform e output documentati con `description` sempre presente.
- Ogni modulo Terraform ha un proprio `README.md` con input/output principali.
- Niente TODO lasciati nel codice consegnato: o si risolvono, o si documentano in `docs/` come lavoro futuro fatturabile separatamente.

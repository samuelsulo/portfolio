# Issue Template

Template per aprire issue GitHub durante lo sviluppo di un progetto cliente,
per tracciare il lavoro in modo uniforme dall'obiettivo di alto livello fino
al singolo bug.

## Template disponibili

| Template | File | Uso | Label |
|---|---|---|---|
| 🚀 Epic | [`epic.md`](./epic.md) | Funzionalità di alto livello, da suddividere in User Story, Technical Story o Spike | `epic` |
| 💡 User Story | [`user-story.md`](./user-story.md) | Funzionalità dal punto di vista dell'utente finale | `user-story` |
| ⚙️ Technical Story | [`technical-story.md`](./technical-story.md) | Funzionalità o attività dal punto di vista tecnico (implementazione, configurazione, infrastruttura) | `technical-story` |
| 🔍 Spike | [`spike.md`](./spike.md) | Attività di ricerca o esplorazione tecnica senza deliverable immediato (PoC, valutazione strumenti) | `spike` |
| 🐛 Bug Report | [`bug-report.md`](./bug-report.md) | Malfunzionamento o comportamento inatteso | `bug` |

## Gerarchia

```
Epic
├── User Story        (valore per l'utente finale)
├── Technical Story   (lavoro tecnico non direttamente visibile all'utente)
└── Spike             (ricerca preliminare, apre Story/Task successivi)

Bug Report            (indipendente, non fa parte di un'Epic)
```

Ogni Epic elenca nella propria issue le Story e gli Spike che la
compongono (tabella "Breakdown"); ogni Story/Spike riporta, quando
pertinente, l'Epic di riferimento nei "Riferimenti"/"References".

## Convenzioni

- Titolo dell'issue con il prefisso già impostato dal template (es.
  `[Epic] `, `[Story] `, `[Bug] `): non rimuoverlo, serve a riconoscere il
  tipo di issue a colpo d'occhio nella lista.
- Ogni template imposta già `labels` e `type`: non aggiungere label
  alternative per lo stesso concetto (es. non usare `feature` insieme a
  `user-story`).
- I criteri di accettazione e la Definition of Done vanno compilati prima di
  iniziare il lavoro, non a posteriori: sono la base per chiudere l'issue.
- Le sezioni tra parentesi quadre (es. `[Descrivi...]`) sono placeholder da
  sostituire, non testo da lasciare nell'issue pubblicata.

## Aggiungere un template

Un nuovo file `.md` in questa cartella con il front matter YAML
(`name`, `type`, `about`, `title`, `labels`, `assignees`) compare
automaticamente tra i template proposti alla creazione di una issue, senza
bisogno di ulteriore configurazione.

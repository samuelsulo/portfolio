# Module: budgets

Configura due `aws_budgets_budget` (mensile e annuale) con notifiche email a soglie di spesa reale/prevista. L'ambito di misurazione è scelto tramite `budget_scope`: per progetto (default, consigliato) o per intero account.

## `budget_scope`: "project" vs "account"

Un `aws_budgets_budget` senza `cost_filter` traccia la spesa di *tutto* l'account AWS. Poiché lo stesso account (in particolare sandbox) può ospitare più progetti/clienti nel tempo, il default è `budget_scope = "project"`: il modulo applica un `cost_filter` di tipo `TagKeyValue` sul tag `Project` (di default), così ogni budget riflette solo la spesa imputabile a questo progetto.

Impostare `budget_scope = "account"` disattiva il filtro e il budget torna a monitorare l'intera spesa dell'account: utile solo quando l'account ospita esclusivamente questo progetto (es. account di produzione del cliente, dedicato) e si preferisce non dipendere dai cost allocation tag.

**Prerequisito manuale per `budget_scope = "project"`**: il tag usato (`project_tag_key`, default `Project`) deve essere attivato come *cost allocation tag* in Billing → Cost allocation tags. Non è gestibile via Terraform e può richiedere fino a 24h per propagarsi dopo l'attivazione.

## Input principali

| Nome | Descrizione | Obbligatorio |
|---|---|---|
| `name_prefix` | Prefisso naming per le risorse del modulo | sì |
| `budget_unit` | Valuta (es. `USD`, `EUR`), deve coincidere con quella di billing dell'account | sì |
| `budget_monthly_amount` | Soglia di spesa mensile | sì |
| `budget_annual_amount` | Soglia di spesa annuale | sì |
| `budget_alert_emails` | Indirizzi email destinatari delle notifiche | sì |
| `budget_scope` | `"project"` (default) o `"account"`, vedi sopra | no |
| `project_tag_key` | Chiave del cost allocation tag usato per lo scoping (default `Project`); ignorato se `budget_scope = "account"` | no |
| `project_tag_value` | Valore del tag che identifica questo progetto (es. `var.project`); ignorato se `budget_scope = "account"` | sì se `budget_scope = "project"` |

## Output

Nessuno.

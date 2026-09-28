# Patente C — Simulatore d'esame

App mobile-first per preparare l'**esame di teoria della patente C** (e CE) sulle domande del
**listato ministeriale** delle patenti superiori, pubblicato dal Ministero delle Infrastrutture e
dei Trasporti sul Portale dell'Automobilista.

Dentro ci sono tutte le domande del listato per la patente C/CE, simulazioni che le coprono tutte
senza ripeterne nessuna, lo studio argomento per argomento, i punti deboli e l'Esame reale nella
forma della Motorizzazione.

È la stessa app del simulatore per il consulente automobilistico, adattata a questo esame.

**Stack:** Next.js · TypeScript · Prisma · PostgreSQL (Neon) · Vercel

---

## L'esame

Dal 2 marzo 2015 la prova di teoria delle patenti superiori si svolge al computer
(circolare 20367 del 22 settembre 2014). Per la patente C/CE:

- **40 domande**, ciascuna un'affermazione da segnare **vero o falso**
- **40 minuti**
- si supera con **al massimo 4 errori**; una domanda lasciata in bianco conta come sbagliata
- fino alla consegna le risposte si possono cambiare

Le domande della scheda vengono dagli argomenti del programma, ciascuno con un numero fisso di
domande: quelli principali ne danno di più.

| Codice | Argomento | All'esame |
|---|---|---:|
| 01 | Disposizioni che regolano i periodi di guida e di riposo | 2 |
| 02 | Impiego del cronotachigrafo | 3 |
| 03 | Disposizioni che regolano il tipo di trasporto | 4 |
| 04 | Documenti di circolazione e di trasporto | 1 |
| 05 | Comportamento in caso di incidente | 2 |
| 06 | Precauzioni nella rimozione e nella sostituzione delle ruote | 1 |
| 07 | Dimensioni, massa e velocità dei veicoli | 3 |
| 08 | Limitazione del campo visivo legata alle caratteristiche del veicolo | 1 |
| 09 | Sicurezza nel caricamento del veicolo | 1 |
| 10 | Sistemi di aggancio di rimorchi e semirimorchi | 2 |
| 11 | Motori, fluidi, alimentazione, impianto elettrico e trasmissione | 5 |
| 12 | Lubrificazione e protezione dal gelo | 1 |
| 13 | Pneumatici: costruzione, montaggio, impiego e manutenzione | 4 |
| 14 | Freni e acceleratore: tipi, funzionamento, manutenzione | 3 |
| 15 | Metodi per individuare le cause dei guasti | 3 |
| 16 | Manutenzione preventiva dei veicoli e riparazioni ordinarie | 3 |
| 17 | Responsabilità del conducente nel ricevimento, trasporto e consegna delle merci | 1 |
| | **Totale** | **40** |

Le regole (40 domande, 40 minuti, 4 errori) stanno in un posto solo, `lib/esame.ts`; le quote
per argomento stanno nell'archivio, in `data/argomenti.json`, e `npm run verifica` controlla che
facciano 40.

---

## L'archivio

Fonte: il listato **"Patenti Superiori"** del Ministero delle Infrastrutture e dei Trasporti,
dalla pagina *Quiz per le patenti AM, B, superiori e CQC* del Portale dell'Automobilista
(www.ilportaledellautomobilista.it), messo in `fonti/`.

Gli argomenti dell'app sono i capitoli del listato, e ogni domanda ha **lo stesso codice del
listato**: una domanda vista nell'app si ritrova sulla fonte così com'è.

### Le simulazioni: tutte le domande, nessuna ripetuta

Le **simulazioni fisse** coprono l'archivio **una volta sola**: ogni domanda sta in una e una sola
simulazione, nessuna resta fuori e nessuna si ripete. Ognuna ha 39 o 40 domande, e ogni argomento
vi entra in proporzione a quante domande ha. Chi le finisce tutte ha visto ogni domanda
esattamente una volta. Sono sempre in modalità Studio, con la correzione subito, e non hanno
soglia: contano gli errori, argomento per argomento. Si lasciano a metà e si riprendono quando si
vuole.

Per la prova nella forma esatta dell'esame c'è l'**Esame reale**, in cima alla Home e nel
Riepilogo: 40 domande pescate a caso, ogni argomento con la sua quota, 40 minuti che corrono anche
a pagina chiusa, correzione alla fine, superato con al massimo 4 errori. Come all'esame, le
risposte si cambiano fino alla consegna, e allo scadere del tempo l'esame si consegna da solo.

### Rifare l'archivio dalle fonti

```bash
pip install pypdf pdfminer.six
python3 scripts/quiz_estrai.py      # fonti/  → build/quiz.json
python3 scripts/quiz_controlla.py   # seconda estrazione, indipendente: deve coincidere
python3 scripts/archivio_scrivi.py  # build/quiz.json → data/: argomenti.json, import_*.json, simulations.json
npm run verifica                    # ricontrolla data/ con il codice dell'app
```

`archivio_scrivi.py` si ferma se trova codici doppi, domande senza testo o senza V/F, argomenti
con meno domande di quante ne chiede l'esame, o simulazioni con domande ripetute o mancanti.
`npm run verifica` rifà i controlli leggendo `data/` come la legge il seed.

Il seed (`prisma/seed.ts`, condiviso con `/api/admin/seed`) confronta il DB con `data/` riga per
riga e lo riscrive solo se differisce.

---

## Le parti dell'app

- **Home**: l'Esame reale in evidenza e, sotto, le simulazioni che coprono tutto il listato.
- **Focus (Studio)**: le domande argomento per argomento, con la correzione subito; si riprende da
  dove si era rimasti.
- **Esame**: 40 domande vero/falso, 40 minuti, al massimo 4 errori.
- **Punti Deboli**: le risposte sbagliate (non quelle lasciate in bianco), per tornarci sopra:
  ognuna esce dopo 3 risposte giuste di fila.
- **Riepilogo**: copertura dell'archivio, Esame reale, pannelli per argomento, dove si fa più
  fatica, esami fatti, e le simulazioni a tappe di dieci.
- **Report**: esito, giuste/sbagliate/in bianco, argomento per argomento, e le domande una per una
  con la risposta data e quella giusta.

---

## Accesso

- **Utente:** basta nome e cognome, senza password.
- **Admin:** `/admin/login`, utente `admin` con la password di `ADMIN_PASSWORD`. La password non
  sta nel codice: il seed la applica a ogni deploy, e senza la variabile l'admin non viene creato.
  Dal pannello si gestiscono utenti e simulazioni e si sfoglia l'archivio (in sola lettura:
  l'archivio si corregge in `data/`).

## Variabili d'ambiente

```
DATABASE_URL    postgresql://...   (un database solo per quest'app, es. su Neon)
JWT_SECRET      stringa lunga e casuale: senza, in produzione il login non funziona
ADMIN_PASSWORD  password dell'utente admin
SEED_TOKEN      richiesto dalla rotta admin di reimportazione; senza, quella rotta è spenta
FORCE_RESET     "true" forza la reimportazione dell'archivio al deploy (solo una volta)
```

---

## Struttura del repository

```
app/         pagine e rotte API (Next.js App Router)
components/  BottomNav, VeroFalso, Domanda, IconaArgomento, Avviso, Foglio, Stato
lib/         esame (regole), argomenti (icone e colori), esame reale, archivio, auth
data/        l'archivio che l'app legge: argomenti, domande, simulazioni
fonti/       il listato del Ministero
scripts/     estrazione del listato e scrittura di data/
verifiche/   controllo dell'archivio
prisma/      schema e seed
```

# Patente C — Simulatore d'esame

App mobile-first per preparare l'**esame di teoria della patente C** (e CE) sul **listato
ministeriale** delle patenti superiori, pubblicato dal Ministero delle Infrastrutture e dei
Trasporti sul Portale dell'Automobilista.

Dentro ci sono tutte le 3.161 domande del listato che valgono per la patente C/CE, con le loro
figure (cartelli, pannelli, simboli del cronotachigrafo, spie del cruscotto), 80 simulazioni che
le coprono tutte senza ripeterne nessuna, lo studio argomento per argomento, i punti deboli e
l'Esame reale nella forma della Motorizzazione.

È la stessa app del simulatore per il consulente automobilistico, adattata a questo esame, con
un suo colore (l'arancio dei mezzi pesanti e della segnaletica) e una sua icona (il camion).

**Stack:** Next.js · TypeScript · Prisma · PostgreSQL (Neon) · Vercel

---

## L'esame

Dal 2 marzo 2015 la prova di teoria delle patenti superiori si svolge al computer. Per la
patente C/CE:

- **40 domande**, ciascuna un'affermazione da segnare **vero o falso**
- **40 minuti**
- si supera con **al massimo 4 errori**; una domanda lasciata in bianco conta come sbagliata
- fino alla consegna le risposte si possono cambiare

Le domande della scheda vengono dai 17 argomenti del programma, ciascuno con un numero fisso di
domande:

| Codice | Argomento | Domande | Quesiti | Con figura | All'esame |
|---|---|---:|---:|---:|---:|
| 01 | Periodi di guida e di riposo | 87 | 11 | 3 | 2 |
| 02 | Impiego del cronotachigrafo | 202 | 18 | 31 | 3 |
| 03 | Disposizioni sul trasporto di cose o di persone | 282 | 33 | 225 | 4 |
| 04 | Documenti di circolazione e di trasporto | 46 | 2 | 0 | 1 |
| 05 | Comportamento in caso di incidente | 136 | 12 | 0 | 2 |
| 06 | Rimozione e sostituzione delle ruote | 30 | 1 | 0 | 1 |
| 07 | Dimensioni e massa dei veicoli, limitatori di velocità | 233 | 18 | 0 | 3 |
| 08 | Limitazione del campo visivo | 54 | 4 | 0 | 1 |
| 09 | Sicurezza nel caricamento dei veicoli | 85 | 8 | 4 | 1 |
| 10 | Aggancio di rimorchi e semirimorchi | 117 | 6 | 0 | 2 |
| 11 | Motori, alimentazione, impianto elettrico e trasmissione | 679 | 54 | 0 | 5 |
| 12 | Lubrificazione e protezione dal gelo | 159 | 8 | 0 | 1 |
| 13 | Pneumatici: costruzione, impiego e manutenzione | 307 | 24 | 0 | 4 |
| 14 | Freno e acceleratore, compreso l'ABS | 219 | 18 | 0 | 3 |
| 15 | Guasti, sterzo, sospensioni e ammortizzatori | 234 | 32 | 96 | 3 |
| 16 | Manutenzione preventiva e riparazioni ordinarie | 215 | 20 | 0 | 3 |
| 17 | Ricevimento, trasporto e consegna delle merci | 76 | 2 | 0 | 1 |
| | **Totale** | **3.161** | **271** | **359** | **40** |

Le regole (40 domande, 40 minuti, 4 errori) stanno in un posto solo, `lib/esame.ts`. Le quote
per argomento stanno in `data/argomenti.json`: il listato non le contiene, sono quelle della
scheda d'esame C/CE come la riportano le simulazioni ministeriali (patentisuperiori.com), e
`npm run verifica` controlla che facciano 40.

---

## L'archivio

Fonte: **"Domande Superiori italiano 04 04 2025.pdf"**, il listato *Patenti Superiori* della pagina
*Quiz per le patenti AM, B, superiori e CQC* del Portale dell'Automobilista
(www.ilportaledellautomobilista.it), in `fonti/domande_superiori_italiano_2025-04-04.pdf`:
157 pagine, 296 quesiti, 3.456 domande, tutte le patenti superiori.

Il listato è una sequenza di **quesiti**. Ognuno ha un numero, il capitolo del programma e, fra
parentesi, le **tipologie d'esame** per cui vale; sotto, le sue affermazioni, ognuna col suo
numero, VERO o FALSO e, quando serve, la sua figura:

```
Quesito n° 6068 - Disposizioni che regolano il trasporto di cose o di persone (1 3)
28119  Il segnale raffigurato è posto in vicinanza di un cantiere stradale   VERO   [figura]
```

Le tipologie sono le sette delle patenti superiori; la **patente C/CE è la 3**: compare nei
quesiti sul trasporto di cose (1 3) e in quelli delle patenti "complete" (3 4 6 7), mai in quelli
solo per autobus (5 6). Per la C valgono i quesiti con la 3 e quelli senza parentesi, che valgono
per tutte le tipologie che hanno il loro capitolo: 271 quesiti e 3.161 domande su 3.456.

Nell'app ogni domanda ha **lo stesso numero del listato** (28119): una domanda vista nell'app si
ritrova sul PDF così com'è. Gli argomenti sono i capitoli, numerati 01-17 nell'ordine del
programma d'esame (lo stesso dei numeri dei quesiti). Le figure sono in `public/figure/`, una per
immagine diversa (59), col nome dato dal loro contenuto.

### Le simulazioni: tutte le domande, nessuna ripetuta

**80 simulazioni fisse** coprono l'archivio **una volta sola**: ogni domanda sta in una e una sola
simulazione, nessuna resta fuori e nessuna si ripete. Ognuna ha 39 o 40 domande, e ogni argomento
vi entra in proporzione a quante domande ha; dentro un argomento le domande dello stesso quesito
si alternano con quelle degli altri, così una simulazione non ha dieci affermazioni sullo stesso
cartello. Chi le finisce tutte ha visto ogni domanda esattamente una volta.

Le simulazioni sono sempre in modalità Studio, con la correzione subito, e non hanno soglia:
contano gli errori, argomento per argomento. Si lasciano a metà e si riprendono quando si vuole.

Per la prova nella forma esatta dell'esame c'è l'**Esame reale**, in cima alla Home e nel
Riepilogo: 40 domande pescate a caso, ogni argomento con la sua quota e ogni domanda da un quesito
diverso (le affermazioni dello stesso quesito si risponderebbero a vicenda), 40 minuti che corrono
anche a pagina chiusa, correzione alla fine, superato con al massimo 4 errori. Come all'esame, le
risposte si cambiano fino alla consegna, e allo scadere del tempo l'esame si consegna da solo.

### Rifare l'archivio dalle fonti

```bash
pip install pymupdf pypdf
python3 scripts/quiz_estrai.py      # fonti/*.pdf     → build/quiz.json e build/figure/
python3 scripts/quiz_controlla.py   # seconda estrazione, indipendente: deve coincidere
python3 scripts/archivio_scrivi.py  # build/ → data/ (argomenti, domande, simulazioni) e public/figure/
npm run verifica                    # ricontrolla data/ con il codice dell'app
```

`quiz_estrai.py` legge la **posizione** di ogni pezzo di testo e di ogni figura nella pagina
(PyMuPDF): il numero a sinistra, il testo al centro, VERO/FALSO a destra, la figura accanto alla
sua domanda. `quiz_controlla.py` rilegge il PDF con un'altra libreria (pypdf) e in un altro
modo: segue il **flusso del testo** per quesiti, domande e V/F, e il **flusso di disegno** per
sapere dove sta ogni figura. Le due estrazioni coincidono su tutti i 296 quesiti (capitolo e
tipologie), su tutte le 3.456 domande (testo e V/F) e su tutte le 414 figure.

`quiz_estrai.py` si ferma se una domanda non ha testo o V/F, se un numero si ripete, se una figura
non trova la sua domanda, o se nel PDF ci sono più quesiti o numeri di quanti ne ha letti.
`archivio_scrivi.py` si ferma se trova un capitolo sconosciuto, un argomento con meno quesiti di
quante domande dà all'esame, o simulazioni con domande ripetute o mancanti. `npm run verifica`
rifà i controlli leggendo `data/` come la legge il seed.

Il seed (`prisma/seed.ts`, condiviso con `/api/admin/seed`) confronta il DB con `data/` riga per
riga e lo riscrive solo se differisce.

---

## Le parti dell'app

- **Home**: l'Esame reale in evidenza e, sotto, le 80 simulazioni che coprono tutto il listato.
- **Focus (Studio)**: le domande argomento per argomento, con la correzione subito; si riprende da
  dove si era rimasti.
- **Esame**: 40 domande vero/falso con le loro figure, 40 minuti, al massimo 4 errori.
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
app/            pagine e rotte API (Next.js App Router)
components/     BottomNav, VeroFalso, Domanda, IconaArgomento, Avviso, Foglio, Stato
lib/            esame (regole), argomenti (icone e colori), esame reale, archivio, auth
data/           l'archivio che l'app legge: argomenti, domande, simulazioni
public/figure/  le figure delle domande
fonti/          il listato del Ministero
scripts/        estrazione del listato e scrittura di data/
verifiche/      controllo dell'archivio
prisma/         schema e seed
```

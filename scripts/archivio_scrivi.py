#!/usr/bin/env python3
"""
Scrive l'archivio che l'app legge (cartella data/) a partire dalle domande
estratte dal listato ministeriale.

Ingresso: build/quiz.json, scritto da scripts/quiz_estrai.py — una lista di
    {"argomento": "01", "codice": "...", "gruppo": "..." | null,
     "testo": "...", "vera": true, "figura": "..." | null}

Gli argomenti sono i capitoli del listato e il codice di una domanda è quello
del listato: così ogni domanda si ritrova sulla fonte.

Uscita:
    data/argomenti.json          gli argomenti, con quante domande danno alla scheda
    data/import_<argomento>.json le domande, una per riga
    data/simulations.json        le simulazioni fisse, come liste di codici

Le simulazioni coprono l'archivio **una volta sola**: ogni domanda sta in una
e una sola simulazione, nessuna resta fuori e nessuna si ripete. Sono tante
quante servono con 40 domande l'una, e le domande si dividono in parti uguali
(39 o 40 ciascuna, niente ultima simulazione con gli avanzi); ogni argomento
vi entra in proporzione a quante domande ha. L'ordine è mescolato con un seme
fisso, così rifare l'archivio dà sempre le stesse simulazioni.

Chiude con un elenco di problemi, e codice d'uscita 1, se qualcosa non torna.
"""
import json
import random
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / 'build' / 'quiz.json'
DATA = ROOT / 'data'
FIGURE = ROOT / 'public' / 'figure'

DOMANDE_PER_SIMULAZIONE = 40
DOMANDE_PER_ESAME = 40
SEME = 20367  # circolare 20367/2014: l'esame informatizzato delle patenti superiori

# Codice, nome e quante domande escono all'esame C/CE. L'ordine è quello della
# scheda d'esame. Le quote sono quelle della tabella ministeriale per la
# patente C/CE: 40 domande in tutto.
ARGOMENTI = [
    ('01', 'Disposizioni che regolano i periodi di guida e di riposo', 2),
    ('02', 'Impiego del cronotachigrafo', 3),
    ('03', 'Disposizioni che regolano il tipo di trasporto', 4),
    ('04', 'Documenti di circolazione e di trasporto', 1),
    ('05', 'Comportamento in caso di incidente', 2),
    ('06', 'Precauzioni nella rimozione e nella sostituzione delle ruote', 1),
    ('07', 'Dimensioni, massa e velocità dei veicoli', 3),
    ('08', 'Limitazione del campo visivo legata alle caratteristiche del veicolo', 1),
    ('09', 'Sicurezza nel caricamento del veicolo', 1),
    ('10', 'Sistemi di aggancio di rimorchi e semirimorchi', 2),
    ('11', 'Motori, fluidi, alimentazione, impianto elettrico e trasmissione', 5),
    ('12', 'Lubrificazione e protezione dal gelo', 1),
    ('13', 'Pneumatici: costruzione, montaggio, impiego e manutenzione', 4),
    ('14', 'Freni e acceleratore: tipi, funzionamento, manutenzione', 3),
    ('15', 'Metodi per individuare le cause dei guasti', 3),
    ('16', 'Manutenzione preventiva dei veicoli e riparazioni ordinarie', 3),
    ('17', 'Responsabilità del conducente nel ricevimento, trasporto e consegna delle merci', 1),
]
CODICI = [a[0] for a in ARGOMENTI]


def controlla(quiz):
    problemi = []
    visti = set()
    for q in quiz:
        c = q.get('codice')
        if not c:
            problemi.append(f'domanda senza codice: {q.get("testo", "")[:60]}')
            continue
        if q.get('argomento') not in CODICI:
            problemi.append(f'{c}: argomento sconosciuto {q.get("argomento")}')
        if c in visti:
            problemi.append(f'{c}: codice doppio')
        visti.add(c)
        if not (q.get('testo') or '').strip():
            problemi.append(f'{c}: testo vuoto')
        if not isinstance(q.get('vera'), bool):
            problemi.append(f'{c}: senza V/F')
        if q.get('figura') and not (FIGURE / q['figura']).exists():
            problemi.append(f'{c}: manca la figura public/figure/{q["figura"]}')
    per_argomento = Counter(q.get('argomento') for q in quiz)
    for codice, nome, n_esame in ARGOMENTI:
        if per_argomento[codice] < n_esame:
            problemi.append(f'argomento {codice} ({nome}): {per_argomento[codice]} domande, all\'esame ne escono {n_esame}')
    somma = sum(a[2] for a in ARGOMENTI)
    if somma != DOMANDE_PER_ESAME:
        problemi.append(f'gli argomenti danno {somma} domande alla scheda, non {DOMANDE_PER_ESAME}')
    return problemi


def riga(q):
    """Una domanda nella forma di data/import_*.json."""
    return {
        'argomentoCode': q['argomento'],
        'code': q['codice'],
        'questionGroup': (q.get('gruppo') or '').strip() or None,
        'text': q['testo'].strip(),
        'risposta': q['vera'],
        'image': q.get('figura') or None,
    }


def simulazioni(quiz):
    """
    Divide tutte le domande in simulazioni da al più 40, senza ripetizioni.

    Ogni domanda riceve una posizione (j + 0,5) / n dentro il suo argomento,
    dove j è il suo posto (mescolato) e n le domande dell'argomento: ordinando
    tutte le domande per posizione, gli argomenti si alternano in proporzione
    alla loro grandezza, e ogni blocco di 40 ne contiene una quota giusta di
    ciascuno.
    """
    rnd = random.Random(SEME)
    posizionate = []
    for i, codice_arg in enumerate(CODICI):
        lista = sorted((q for q in quiz if q['argomento'] == codice_arg), key=lambda q: q['codice'])
        rnd.shuffle(lista)
        n = len(lista)
        for j, q in enumerate(lista):
            posizionate.append(((j + 0.5) / n, i, q['codice']))
    posizionate.sort()

    ordine = {c: i for i, c in enumerate(CODICI)}
    argomento_di = {q['codice']: q['argomento'] for q in quiz}
    totale = len(posizionate)
    quante = -(-totale // DOMANDE_PER_SIMULAZIONE)  # arrotondato per eccesso
    confini = [round(k * totale / quante) for k in range(quante + 1)]
    sims = []
    for k in range(quante):
        blocco = [c for _, _, c in posizionate[confini[k]:confini[k + 1]]]
        # Dentro la simulazione le domande vanno per argomento, nell'ordine della scheda
        blocco.sort(key=lambda c: (ordine[argomento_di[c]], c))
        n = len(sims) + 1
        sims.append({'number': n, 'titolo': f'Simulazione {n}', 'domande': blocco})
    return sims


def controlla_simulazioni(quiz, sims):
    problemi = []
    tutti = [q['codice'] for q in quiz]
    usati = [c for s in sims for c in s['domande']]
    conta = Counter(usati)
    doppi = sorted(c for c, n in conta.items() if n > 1)
    if doppi:
        problemi.append(f'domande ripetute nelle simulazioni: {doppi[:20]}')
    fuori = sorted(set(tutti) - set(usati))
    if fuori:
        problemi.append(f'domande rimaste fuori dalle simulazioni: {fuori[:20]}')
    estranei = sorted(set(usati) - set(tutti))
    if estranei:
        problemi.append(f'codici inesistenti nelle simulazioni: {estranei[:20]}')
    misure = {len(s['domande']) for s in sims}
    if sims and (max(misure) > DOMANDE_PER_SIMULAZIONE or max(misure) - min(misure) > 1):
        problemi.append(f'simulazioni di misura irregolare: {sorted(misure)}')
    return problemi


def main():
    if not BUILD.exists():
        sys.exit(f'Manca {BUILD.relative_to(ROOT)}: prima scripts/quiz_estrai.py')
    quiz = json.loads(BUILD.read_text(encoding='utf-8'))

    problemi = controlla(quiz)
    sims = simulazioni(quiz) if not problemi else []
    problemi += controlla_simulazioni(quiz, sims) if sims else []

    if problemi:
        print('❌ Problemi:')
        for p in problemi:
            print('  -', p)
        sys.exit(1)

    DATA.mkdir(exist_ok=True)
    for vecchio in DATA.glob('import_*.json'):
        vecchio.unlink()
    scrivi(DATA / 'argomenti.json', {'argomenti': [{'code': c, 'name': n, 'nEsame': e} for c, n, e in ARGOMENTI]})
    for codice in CODICI:
        righe = [riga(q) for q in sorted(quiz, key=lambda q: q['codice']) if q['argomento'] == codice]
        scrivi(DATA / f'import_{codice}.json', righe)
    scrivi(DATA / 'simulations.json', sims)

    vere = sum(1 for q in quiz if q['vera'])
    figure = sum(1 for q in quiz if q.get('figura'))
    print(f'✅ {len(quiz)} domande ({vere} vere, {len(quiz) - vere} false, {figure} con figura)')
    for codice, nome, n_esame in ARGOMENTI:
        n = sum(1 for q in quiz if q['argomento'] == codice)
        print(f'   {codice} {nome}: {n} domande, {n_esame} all\'esame')
    misure = sorted({len(s['domande']) for s in sims})
    print(f'✅ {len(sims)} simulazioni da {" o ".join(map(str, misure))} domande, ogni domanda in una sola')


def scrivi(path, dati):
    path.write_text(json.dumps(dati, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()

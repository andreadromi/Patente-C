#!/usr/bin/env python3
"""
Scrive l'archivio che l'app legge (cartella data/, e le figure in
public/figure/) a partire dalle domande estratte dal listato ministeriale.

Ingresso: build/quiz.json e build/figure/, scritti da scripts/quiz_estrai.py.
Ogni domanda ha il suo quesito, il capitolo del programma d'esame, le
tipologie d'esame del quesito, il numero, il testo, V/F e la figura.

Il listato è quello di tutte le patenti superiori. Per la patente C/CE
valgono:
  - i quesiti con la tipologia 3 fra parentesi (C/CE);
  - i quesiti senza parentesi: valgono per tutte le tipologie che hanno il
    loro capitolo, e i 17 capitoli qui sotto sono esattamente il programma
    della C/CE.
Le tipologie delle patenti superiori sono sette (C1/C1E e C1 non
professionale, C/CE, estensione da C1 a C, D1/D1E, D/DE, estensione da D1 a
D): la 3 compare nei quesiti sul trasporto di cose (1 3) e in quelli delle
patenti "complete" (3 4 6 7), mai in quelli solo per autobus (5 6).

Gli argomenti dell'app sono i capitoli del listato, numerati nell'ordine del
programma d'esame (quello dei numeri dei quesiti), e ogni domanda tiene il
numero del listato: così si ritrova sulla fonte.

Uscita:
    data/argomenti.json          gli argomenti, con quante domande danno alla scheda
    data/import_<argomento>.json le domande, una per riga
    data/simulations.json        le simulazioni fisse, come liste di numeri
    public/figure/               le figure che le domande usano, rese nitide per il
                                 telefono da scripts/figure_nitide.py (stesso nome)

Le simulazioni hanno **40 domande ciascuna**, come la scheda d'esame, e
coprono tutto l'archivio: ogni domanda sta in almeno una simulazione. Sono
tante quante servono con 40 domande l'una, e ogni argomento vi entra in
proporzione a quante domande ha. Le domande non bastano per riempirle tutte
senza ripeterne nessuna (3.161 per 80 simulazioni da 40, cioè 3.200 posti):
quelle che resterebbero a 39 prendono una domanda in più da un'altra
simulazione (vedi completa), e solo quelle poche escono due volte.
Dentro un argomento le domande dello stesso quesito si alternano con quelle
degli altri, così una simulazione non ha dieci affermazioni sullo stesso
cartello. L'ordine è mescolato con un seme fisso: rifare l'archivio dà sempre
le stesse simulazioni.

Chiude con un elenco di problemi, e codice d'uscita 1, se qualcosa non torna.
"""
import json
import random
import sys
from collections import Counter
from pathlib import Path

from figure_nitide import nitida

ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / 'build' / 'quiz.json'
BUILD_FIGURE = ROOT / 'build' / 'figure'
DATA = ROOT / 'data'
FIGURE = ROOT / 'public' / 'figure'

TIPOLOGIA_C = 3
DOMANDE_PER_SIMULAZIONE = 40
DOMANDE_PER_ESAME = 40
SEME = 20367  # circolare 20367/2014: l'esame informatizzato delle patenti superiori

# Codice, capitolo com'è scritto nel listato, nome nell'app, domande all'esame.
# L'ordine è quello del programma d'esame. Le quote non stanno nel listato:
# sono quelle della scheda ministeriale C/CE (40 domande in tutto).
ARGOMENTI = [
    ('01', 'Disposizioni che regolano i periodi di guida e di riposo',
     'Periodi di guida e di riposo', 2),
    ('02', 'Impiego del cronotachigrafo',
     'Impiego del cronotachigrafo', 3),
    ('03', 'Disposizioni che regolano il trasporto di cose o di persone',
     'Disposizioni sul trasporto di cose o di persone', 4),
    ('04', 'Documenti di circolazione e di trasporto, necessari per il trasporto di cose o di persone '
           'sia a livello nazionale che internazionale',
     'Documenti di circolazione e di trasporto', 1),
    ('05', "Comportamento in caso di incidente; misure da adottare in caso di incidente o situazione "
           "assimilabile, compresi gli interventi di emergenza quali l'evacuazione dei passeggeri, "
           "nonché rudimenti di pronto soccorso",
     'Comportamento in caso di incidente', 2),
    ('06', 'Precauzioni da adottare in caso di rimozione e sostituzione delle ruote',
     'Rimozione e sostituzione delle ruote', 1),
    ('07', 'Disposizioni che regolano dimensione e massa dei veicoli; disposizioni che regolano i '
           'dispositivi di limitazione della velocità',
     'Dimensioni e massa dei veicoli, limitatori di velocità', 3),
    ('08', 'Limitazione del campo visivo legata alle caratteristiche del veicolo',
     'Limitazione del campo visivo', 1),
    ('09', 'Fattori di sicurezza relativi al caricamento dei veicoli - Responsabilità del conducente '
           'nei confronti delle persone trasportate',
     'Sicurezza nel caricamento dei veicoli', 1),
    ('10', 'Sistemi di aggancio alla motrice di rimorchi e semirimorchi e relativi sistemi di frenatura',
     'Aggancio di rimorchi e semirimorchi', 2),
    ('11', 'Nozioni sulla costruzione ed il funzionamento dei motori a combustione interna, dei liquidi '
           '(olio motore, liquido di raffreddamento, liquido lavavetri, ecc.), del sistema di alimentazione '
           'del carburante, di quello elettrico, di quello di accensione e di quello di trasmissione '
           '(frizione, cambio, ecc.)',
     'Motori, alimentazione, impianto elettrico e trasmissione', 5),
    ('12', 'Lubrificazione e protezione dal gelo',
     'Lubrificazione e protezione dal gelo', 1),
    ('13', 'Nozioni su costruzione, montaggio e corretto impiego e manutenzione degli pneumatici',
     'Pneumatici: costruzione, impiego e manutenzione', 4),
    ('14', "Freno e acceleratore: nozioni sui tipi esistenti, funzionamento, componenti principali, "
           "collegamenti, impiego e manutenzione ordinaria, compreso l'ABS",
     "Freno e acceleratore, compreso l'ABS", 3),
    ('15', 'Metodi per individuare le cause dei guasti - Organi di direzione - Sospensioni e ammortizzatori',
     'Guasti, sterzo, sospensioni e ammortizzatori', 3),
    ('16', 'Manutenzione dei veicoli a scopo preventivo e effettuazione delle opportune riparazioni ordinarie',
     'Manutenzione preventiva e riparazioni ordinarie', 3),
    ('17', 'Responsabilità del conducente in merito a ricevimento, trasporto e consegna delle merci nel '
           'rispetto delle condizioni concordate',
     'Ricevimento, trasporto e consegna delle merci', 1),
]
CODICI = [a[0] for a in ARGOMENTI]
DAL_CAPITOLO = {capitolo: codice for codice, capitolo, _, _ in ARGOMENTI}


def per_la_c(d):
    return not d['tipi'] or TIPOLOGIA_C in d['tipi']


def controlla(tutte, domande):
    problemi = []
    capitoli = sorted({d['capitolo'] for d in tutte} - set(DAL_CAPITOLO))
    for c in capitoli:
        problemi.append(f'capitolo sconosciuto: {c}')
    numeri = Counter(d['numero'] for d in domande)
    for n, volte in numeri.items():
        if volte > 1:
            problemi.append(f'{n}: numero doppio')
    for d in domande:
        if not d['testo'].strip():
            problemi.append(f"{d['numero']}: testo vuoto")
        if not isinstance(d['vera'], bool):
            problemi.append(f"{d['numero']}: senza V/F")
        if d['figura'] and not (BUILD_FIGURE / d['figura']).exists():
            problemi.append(f"{d['numero']}: manca la figura build/figure/{d['figura']}")
    # L'Esame reale prende una domanda per quesito: ogni argomento deve avere
    # almeno tanti quesiti quante domande dà alla scheda
    for codice, _, nome, n_esame in ARGOMENTI:
        quesiti = {d['quesito'] for d in domande if d['argomento'] == codice}
        if len(quesiti) < n_esame:
            problemi.append(f'argomento {codice} ({nome}): {len(quesiti)} quesiti, all\'esame ne escono {n_esame}')
    somma = sum(a[3] for a in ARGOMENTI)
    if somma != DOMANDE_PER_ESAME:
        problemi.append(f'gli argomenti danno {somma} domande alla scheda, non {DOMANDE_PER_ESAME}')
    return problemi


def riga(d):
    """Una domanda nella forma di data/import_*.json."""
    return {
        'argomentoCode': d['argomento'],
        'code': str(d['numero']),
        'quesito': d['quesito'],
        'text': d['testo'],
        'risposta': d['vera'],
        'image': d['figura'],
    }


def alternate(domande, rnd):
    """Le domande di un argomento, coi quesiti che si danno il turno: la prima di ogni quesito, poi la seconda..."""
    per_quesito = {}
    for d in sorted(domande, key=lambda d: d['numero']):
        per_quesito.setdefault(d['quesito'], []).append(d)
    gruppi = list(per_quesito.values())
    rnd.shuffle(gruppi)
    for g in gruppi:
        rnd.shuffle(g)
    fila = []
    for giro in range(max(len(g) for g in gruppi)):
        fila += [g[giro] for g in gruppi if giro < len(g)]
    return fila


def simulazioni(domande):
    """
    Divide tutte le domande in simulazioni da 40.

    Ogni domanda riceve una posizione (j + 0,5) / n dentro il suo argomento,
    dove j è il suo posto nella fila dell'argomento e n le sue domande:
    ordinando tutte le domande per posizione, gli argomenti si alternano in
    proporzione alla loro grandezza, e ogni blocco di 40 ne contiene una quota
    giusta di ciascuno. Blocchi vicini della fila dell'argomento hanno quesiti
    diversi, perché nella fila i quesiti si danno il turno.

    La fila si taglia in blocchi uguali, da 39 o 40 domande senza ripetizioni;
    poi completa porta a 40 quelli da 39.
    """
    rnd = random.Random(SEME)
    posizionate = []
    for i, codice in enumerate(CODICI):
        fila = alternate([d for d in domande if d['argomento'] == codice], rnd)
        n = len(fila)
        for j, d in enumerate(fila):
            posizionate.append(((j + 0.5) / n, i, d['numero']))
    posizionate.sort()

    ordine = {c: i for i, c in enumerate(CODICI)}
    argomento_di = {d['numero']: d['argomento'] for d in domande}
    totale = len(posizionate)
    quante = -(-totale // DOMANDE_PER_SIMULAZIONE)  # arrotondato per eccesso
    confini = [round(k * totale / quante) for k in range(quante + 1)]
    blocchi = [[n for _, _, n in posizionate[confini[k]:confini[k + 1]]] for k in range(quante)]
    completa(blocchi, domande, [n for _, _, n in posizionate])

    sims = []
    for blocco in blocchi:
        # Dentro la simulazione le domande vanno per argomento, nell'ordine della scheda
        blocco.sort(key=lambda n: (ordine[argomento_di[n]], n))
        numero = len(sims) + 1
        sims.append({'number': numero, 'titolo': f'Simulazione {numero}', 'domande': [str(n) for n in blocco]})
    return sims


def completa(blocchi, domande, fila):
    """
    Porta a 40 i blocchi da 39, con una domanda presa da un altro blocco.

    La domanda in più è dell'argomento che nel blocco è più sotto la sua quota
    (40 per la sua parte dell'archivio), di un quesito che nel blocco non c'è,
    e viene dal blocco più lontano: chi fa le simulazioni in fila la ritrova il
    più tardi possibile. Ogni domanda esce al massimo due volte. I blocchi già
    da 40 restano come sono.
    """
    per_numero = {d['numero']: d for d in domande}
    per_argomento = {}
    for d in domande:
        per_argomento.setdefault(d['argomento'], []).append(d['numero'])
    quanti = len(blocchi)
    casa = {n: k for k, blocco in enumerate(blocchi) for n in blocco}
    prese = set()
    for k, blocco in enumerate(blocchi):
        if len(blocco) >= DOMANDE_PER_SIMULAZIONE:
            continue
        nel_blocco = Counter(per_numero[n]['argomento'] for n in blocco)
        quesiti = {per_numero[n]['quesito'] for n in blocco}

        def sotto_quota(c):
            return DOMANDE_PER_SIMULAZIONE * len(per_argomento[c]) / len(fila) - nel_blocco[c]

        def distanza(n):
            return min(abs(casa[n] - k), quanti - abs(casa[n] - k))

        # Prima l'argomento più sotto la sua quota (a pari merito il primo della
        # scheda), con un quesito nuovo per il blocco; se non ce n'è, anche un
        # quesito che il blocco ha già
        candidate = []
        for quesito_nuovo in (True, False):
            for codice in sorted(CODICI, key=lambda c: (-sotto_quota(c), CODICI.index(c))):
                candidate = [n for n in per_argomento[codice] if n not in prese and casa[n] != k
                             and not (quesito_nuovo and per_numero[n]['quesito'] in quesiti)]
                if candidate:
                    break
            if candidate:
                break
        scelta = max(candidate, key=lambda n: (distanza(n), -n))
        blocco.append(scelta)
        prese.add(scelta)


def controlla_simulazioni(domande, sims):
    problemi = []
    tutti = [str(d['numero']) for d in domande]
    usati = [c for s in sims for c in s['domande']]
    conta = Counter(usati)
    storte = [s['number'] for s in sims if len(s['domande']) != DOMANDE_PER_SIMULAZIONE]
    if storte:
        problemi.append(f'simulazioni che non hanno {DOMANDE_PER_SIMULAZIONE} domande: {storte[:20]}')
    dentro = [s['number'] for s in sims if len(set(s['domande'])) != len(s['domande'])]
    if dentro:
        problemi.append(f'simulazioni con una domanda due volte: {dentro[:20]}')
    fuori = sorted(set(tutti) - set(usati))
    if fuori:
        problemi.append(f'domande rimaste fuori dalle simulazioni: {fuori[:20]}')
    estranei = sorted(set(usati) - set(tutti))
    if estranei:
        problemi.append(f'numeri inesistenti nelle simulazioni: {estranei[:20]}')
    # Le ripetute sono solo quelle che servono a riempire i posti: una volta in più ciascuna
    doppie = sum(1 for n in conta.values() if n == 2)
    if any(n > 2 for n in conta.values()) or doppie != len(usati) - len(tutti):
        problemi.append(f'domande ripetute più del necessario: {doppie} due volte, '
                        f'{sum(1 for n in conta.values() if n > 2)} più di due')
    return problemi


def main():
    if not BUILD.exists():
        sys.exit(f'Manca {BUILD.relative_to(ROOT)}: prima scripts/quiz_estrai.py')
    tutte = json.loads(BUILD.read_text(encoding='utf-8'))
    domande = [dict(d, argomento=DAL_CAPITOLO.get(d['capitolo'])) for d in tutte if per_la_c(d)]

    problemi = controlla(tutte, domande)
    sims = [] if problemi else simulazioni(domande)
    problemi += controlla_simulazioni(domande, sims) if sims else []
    if problemi:
        print('❌ Problemi:')
        for p in problemi:
            print('  -', p)
        sys.exit(1)

    DATA.mkdir(exist_ok=True)
    for vecchio in DATA.glob('import_*.json'):
        vecchio.unlink()
    scrivi(DATA / 'argomenti.json', {'argomenti': [{'code': c, 'name': n, 'nEsame': e} for c, _, n, e in ARGOMENTI]})
    for codice in CODICI:
        righe = [riga(d) for d in sorted(domande, key=lambda d: d['numero']) if d['argomento'] == codice]
        scrivi(DATA / f'import_{codice}.json', righe)
    scrivi(DATA / 'simulations.json', sims)

    # Le figure: solo quelle che le domande della C usano, e nessuna rimasta da prima
    usate = {d['figura'] for d in domande if d['figura']}
    FIGURE.mkdir(parents=True, exist_ok=True)
    for vecchia in FIGURE.iterdir():
        if vecchia.name not in usate:
            vecchia.unlink()
    for nome in sorted(usate):
        nitida(BUILD_FIGURE / nome, FIGURE / nome)

    quesiti = {d['quesito'] for d in domande}
    vere = sum(1 for d in domande if d['vera'])
    con_figura = sum(1 for d in domande if d['figura'])
    print(f'✅ patente C/CE: {len(quesiti)} quesiti, {len(domande)} domande '
          f'({vere} vere, {len(domande) - vere} false, {con_figura} con figura, {len(usate)} figure)')
    print(f'   dal listato di tutte le patenti superiori: {len(tutte)} domande')
    for codice, _, nome, n_esame in ARGOMENTI:
        dell_argomento = [d for d in domande if d['argomento'] == codice]
        q = len({d['quesito'] for d in dell_argomento})
        print(f'   {codice} {nome}: {len(dell_argomento)} domande in {q} quesiti, {n_esame} all\'esame')
    doppie = sum(1 for n in Counter(c for s in sims for c in s['domande']).values() if n == 2)
    print(f'✅ {len(sims)} simulazioni da {DOMANDE_PER_SIMULAZIONE} domande: ogni domanda almeno in una, '
          f'{doppie} in due per riempire i posti')


def scrivi(path, dati):
    path.write_text(json.dumps(dati, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()

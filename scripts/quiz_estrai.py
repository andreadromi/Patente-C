#!/usr/bin/env python3
"""
Estrae le domande dal listato ministeriale delle patenti superiori
(fonti/domande_superiori_italiano_2025-04-04.pdf) in build/quiz.json, e le
sue figure in build/figure/.

Il listato è una sequenza di quesiti. Ognuno ha un'intestazione

    Quesito n° 6068 - Disposizioni che regolano il trasporto di cose o di persone (1 3)

col capitolo del programma d'esame e, fra parentesi, le tipologie d'esame
per cui vale; poi una tabella con le sue affermazioni, una per riga:

    Numero domanda | Testo domanda                       | Risposta Corretta | Immagine
    28119          | Il segnale raffigurato è posto ...  | VERO              | [figura]

Il testo può andare a capo su più righe, l'intestazione pure. La figura,
quando c'è, sta accanto all'affermazione a cui appartiene: non al quesito,
perché nello stesso quesito affermazioni diverse possono avere figure
diverse (i simboli del cronotachigrafo, per esempio). Un quesito può
continuare nella pagina dopo.

Le tipologie d'esame sono le sette delle patenti superiori; la patente C/CE
è la 3. Un'intestazione senza parentesi vale per tutte le tipologie che
hanno quel capitolo: vedi scripts/archivio_scrivi.py.

Qui si legge la POSIZIONE di ogni pezzo di testo e di ogni figura nella
pagina (PyMuPDF): il numero della domanda a sinistra, il testo da x ≈ 78,
VERO/FALSO da x ≈ 355, la figura da x ≈ 466, alla stessa altezza del numero.
scripts/quiz_controlla.py rilegge il PDF in un altro modo e deve dare lo
stesso risultato.

Ogni figura si salva una volta sola, col nome dato dal suo contenuto (i
primi caratteri dello SHA-1 dei byte JPEG così come stanno nel PDF): la
stessa figura usata da più domande è un file solo.

Chiude con un elenco di problemi, e codice d'uscita 1, se un'affermazione
non ha testo o V/F, se un numero si ripete, se una figura non trova la sua
riga, o se nel testo del PDF ci sono più quesiti o numeri di quanti ne sono
stati letti.

Uso: python3 scripts/quiz_estrai.py   (serve pymupdf: pip install pymupdf)
"""
import hashlib
import json
import re
import sys
from pathlib import Path

import pymupdf

ROOT = Path(__file__).resolve().parent.parent
PDF = ROOT / 'fonti' / 'domande_superiori_italiano_2025-04-04.pdf'
OUT = ROOT / 'build' / 'quiz.json'
FIGURE = ROOT / 'build' / 'figure'

X_NUMERO = 60    # il numero della domanda sta a sinistra di qui
X_VF = 350       # VERO/FALSO da qui in poi
X_FIGURA = 440   # le figure delle domande; il logo del Ministero sta più a sinistra
INTESTAZIONE = re.compile(r'Quesito n° (\d+) - (.*?)(?: \(([\d ]+)\))?$')
TABELLA = {'Numero', 'domanda', 'Testo domanda', 'Risposta Corretta', 'Immagine'}
MINISTERO = 'Ministero delle Infrastrutture e dei Trasporti'


def nome_figura(dati):
    return hashlib.sha1(dati).hexdigest()[:12] + '.jpg'


def pezzi(pagina):
    """I pezzi di testo della pagina, dall'alto in basso: testo, x, y della riga, grassetto."""
    out = []
    for blocco in pagina.get_text('dict')['blocks']:
        if blocco['type'] != 0:
            continue
        for riga in blocco['lines']:
            for s in riga['spans']:
                if s['text'].strip():
                    out.append((round(riga['bbox'][1], 1), s['bbox'][0], s['text'], 'Bold' in s['font']))
    out.sort(key=lambda p: (p[0], p[1]))
    return out


def leggi(doc):
    quesiti, problemi = [], []
    attuale = riga = None
    intestazione = None  # un'intestazione può andare a capo, anche a fine pagina
    for n_pagina, pagina in enumerate(doc, 1):
        righe_pagina = []
        ultima_y = None
        for y, x, testo, grassetto in pezzi(pagina):
            t = testo.strip()
            if grassetto and t.startswith('Quesito n°'):
                intestazione, riga = t, None
                continue
            if grassetto and intestazione is not None and t not in TABELLA:
                intestazione += ' ' + t
                continue
            if grassetto:
                if t in TABELLA and intestazione is not None:
                    m = INTESTAZIONE.match(re.sub(r'\s+', ' ', intestazione))
                    if not m:
                        problemi.append(f'pagina {n_pagina}: intestazione non riconosciuta: {intestazione}')
                        m = INTESTAZIONE.match('Quesito n° 0 - ?')
                    attuale = {
                        'quesito': int(m.group(1)),
                        'capitolo': m.group(2),
                        'tipi': [int(v) for v in (m.group(3) or '').split()],
                        'righe': [],
                    }
                    quesiti.append(attuale)
                    intestazione = None
                elif t not in TABELLA:
                    problemi.append(f'pagina {n_pagina}: grassetto inatteso: {t}')
                continue
            if t == MINISTERO:
                continue
            if x < X_NUMERO and re.fullmatch(r'\d{5}', t):
                if attuale is None:
                    problemi.append(f'pagina {n_pagina}: domanda {t} prima di ogni quesito')
                    continue
                riga = {'numero': int(t), 'pagina': n_pagina, 'y': y, 'parti': [], 'vera': None, 'figura': None}
                attuale['righe'].append(riga)
                righe_pagina.append(riga)
                ultima_y = None
                continue
            if riga is None:
                problemi.append(f'pagina {n_pagina}: testo fuori da ogni domanda: {t}')
                continue
            if x >= X_VF:
                if t in ('VERO', 'FALSO') and riga['vera'] is None:
                    riga['vera'] = t == 'VERO'
                else:
                    problemi.append(f"{riga['numero']}: testo inatteso nella colonna V/F: {t}")
                continue
            # Pezzi della stessa riga si attaccano come sono; una riga nuova va dopo uno spazio
            if ultima_y is not None and y == ultima_y and riga['parti']:
                riga['parti'][-1] += testo
            else:
                riga['parti'].append(testo)
            ultima_y = y

        # Le figure della pagina: ognuna alla domanda che le sta accanto, alla stessa altezza
        for info in pagina.get_image_info(xrefs=True):
            x0, y0 = info['bbox'][0], info['bbox'][1]
            if x0 < X_FIGURA:
                continue  # il logo del Ministero
            vicine = [r for r in righe_pagina if abs(r['y'] - y0) <= 6]
            if len(vicine) != 1:
                problemi.append(f'pagina {n_pagina}: figura a y={y0:.0f} senza una domanda sola accanto')
                continue
            if vicine[0]['figura']:
                problemi.append(f"{vicine[0]['numero']}: due figure")
                continue
            immagine = doc.extract_image(info['xref'])
            if immagine['ext'] != 'jpeg':
                problemi.append(f"{vicine[0]['numero']}: figura {immagine['ext']}, attesa jpeg")
            nome = nome_figura(immagine['image'])
            (FIGURE / nome).write_bytes(immagine['image'])
            vicine[0]['figura'] = nome
    if intestazione is not None:
        problemi.append(f'intestazione in fondo al file senza domande: {intestazione}')
    return quesiti, problemi


def main():
    if not PDF.exists():
        sys.exit(f'Manca {PDF.relative_to(ROOT)}')
    FIGURE.mkdir(parents=True, exist_ok=True)
    for vecchia in FIGURE.glob('*.jpg'):
        vecchia.unlink()
    doc = pymupdf.open(str(PDF))
    quesiti, problemi = leggi(doc)

    domande = []
    for q in quesiti:
        if not q['righe']:
            problemi.append(f"quesito {q['quesito']}: nessuna domanda")
        for r in q['righe']:
            testo = re.sub(r'\s+', ' ', ' '.join(p.strip() for p in r['parti'])).strip()
            if not testo:
                problemi.append(f"{r['numero']}: testo vuoto")
            if r['vera'] is None:
                problemi.append(f"{r['numero']}: senza V/F")
            domande.append({
                'quesito': q['quesito'],
                'capitolo': q['capitolo'],
                'tipi': q['tipi'],
                'numero': r['numero'],
                'testo': testo,
                'vera': r['vera'],
                'figura': r['figura'],
                'pagina': r['pagina'],
            })

    numeri = [d['numero'] for d in domande]
    doppi = sorted({n for n in numeri if numeri.count(n) > 1})
    if doppi:
        problemi.append(f'numeri doppi: {doppi[:20]}')
    codici_quesito = [q['quesito'] for q in quesiti]
    if len(set(codici_quesito)) != len(codici_quesito):
        problemi.append('numeri di quesito doppi')
    # Quanti quesiti e quanti numeri di domanda ci sono nel testo del PDF: un
    # quesito o una riga che il parser non riconosce si vede qui
    testo = '\n'.join(p.get_text() for p in doc)
    nel_testo = len(re.findall(r'Quesito n° \d+', testo))
    if nel_testo != len(quesiti):
        problemi.append(f'nel testo {nel_testo} quesiti, letti {len(quesiti)}')
    numeri_nel_testo = len(re.findall(r'(?m)^\d{5}$', testo))
    if numeri_nel_testo != len(domande):
        problemi.append(f'nel testo {numeri_nel_testo} numeri di domanda, lette {len(domande)}')

    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(json.dumps(domande, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    figure = {d['figura'] for d in domande if d['figura']}
    print(f'{len(quesiti)} quesiti, {len(domande)} domande da {doc.page_count} pagine')
    print(f'   {sum(1 for d in domande if d["figura"])} domande con figura, {len(figure)} figure diverse in build/figure/')
    if problemi:
        print('❌ Problemi:')
        for p in problemi:
            print('  -', p)
        sys.exit(1)
    print('✅ ogni domanda ha numero, testo e V/F; ogni figura la sua domanda')


if __name__ == '__main__':
    main()

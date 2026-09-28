#!/usr/bin/env python3
"""
Ricontrolla build/quiz.json con una seconda estrazione del PDF, fatta in un
modo diverso e con un'altra libreria: quiz_estrai.py legge la posizione di
ogni pezzo nella pagina (PyMuPDF), questo script legge il flusso di testo
(pypdf) e ricostruisce i quesiti dall'ordine delle righe.

Nel flusso di testo le intestazioni dei quesiti di una pagina stanno tutte
in cima, prima delle tabelle, e ogni tabella comincia con la sua riga di
titoli ("Numero domanda / Testo domanda Risposta Corretta Immagine"). Qui le
intestazioni si mettono in fila e ogni tabella prende la prima che aspetta:
le righe che vengono prima della prima tabella di una pagina continuano il
quesito della pagina precedente. Un'affermazione comincia col suo numero e
finisce col suo VERO o FALSO.

Le figure si ritrovano dal flusso di disegno: dove la pagina disegna ogni
immagine (l'operatore Do, con la sua matrice) e a che altezza scrive i
numeri delle domande. Una figura è della domanda il cui numero le sta
accanto; il nome viene dai byte JPEG così come stanno nel PDF, come in
quiz_estrai.py, quindi figure uguali hanno lo stesso nome.

Se le due estrazioni danno gli stessi quesiti (capitolo e tipologie
d'esame), le stesse domande (testo e V/F, nello stesso quesito) e le stesse
figure, l'archivio è quello del PDF. Codice d'uscita 1 alla prima
differenza.

Uso: python3 scripts/quiz_controlla.py   (serve pypdf: pip install pypdf)
"""
import json
import re
import sys
from pathlib import Path

from pypdf import PdfReader

sys.path.insert(0, str(Path(__file__).resolve().parent))
from quiz_estrai import INTESTAZIONE, OUT, PDF, X_FIGURA, X_NUMERO, nome_figura  # noqa: E402

INIZIO = re.compile(r'^(\d{5}) (.*)$')
FINE_VF = re.compile(r'^(.*?) ?\b(VERO|FALSO)$')
TITOLI = ['Numero', 'domanda', 'Testo domanda Risposta Corretta Immagine']
MINISTERO = 'Ministero delle Infrastrutture e dei Trasporti'


def dal_testo(reader):
    quesiti, domande, problemi = {}, {}, []
    coda = []  # intestazioni lette, in attesa della loro tabella
    attuale = aperta = None

    def chiudi(vera):
        nonlocal aperta
        domande[aperta['numero']] = {
            'quesito': aperta['quesito'],
            'testo': re.sub(r'\s+', ' ', ' '.join(aperta['parti'])).strip(),
            'vera': vera,
        }
        aperta = None

    for n_pagina, pagina in enumerate(reader.pages, 1):
        righe = [r.strip() for r in pagina.extract_text().split('\n')]
        i = 0
        # Le intestazioni, in cima: "Quesito n° ..." e le righe che la continuano,
        # fino alla riga vuota o alla prima domanda (a volte non c'è la riga vuota)
        def continua(riga):
            return riga and not riga.startswith('Quesito n°') and not INIZIO.match(riga) \
                and riga not in TITOLI and riga != MINISTERO
        while i < len(righe) and (not righe[i] or righe[i].startswith('Quesito n°')):
            if righe[i].startswith('Quesito n°'):
                intestazione = righe[i]
                i += 1
                while i < len(righe) and continua(righe[i]):
                    intestazione += ' ' + righe[i]
                    i += 1
                coda.append(intestazione)
            else:
                i += 1
        while i < len(righe):
            r = righe[i]
            i += 1
            if not r or r == MINISTERO:
                continue
            if r.startswith('Quesito n°'):
                problemi.append(f'pagina {n_pagina}: intestazione dopo le tabelle: {r}')
                continue
            if [r] + righe[i:i + 2] == TITOLI and aperta is None:
                i += 2
                if not coda:
                    problemi.append(f'pagina {n_pagina}: una tabella senza la sua intestazione')
                    continue
                m = INTESTAZIONE.match(re.sub(r'\s+', ' ', coda.pop(0)))
                attuale = {
                    'capitolo': m.group(2),
                    'tipi': [int(v) for v in (m.group(3) or '').split()],
                    'numeri': [],
                }
                quesiti[int(m.group(1))] = attuale
                attuale['quesito'] = int(m.group(1))
                continue
            m = INIZIO.match(r)
            if m and aperta is None:
                if attuale is None:
                    problemi.append(f'pagina {n_pagina}: domanda prima di ogni quesito: {r}')
                    continue
                aperta = {'numero': int(m.group(1)), 'quesito': attuale['quesito'], 'parti': []}
                attuale['numeri'].append(aperta['numero'])
                r = m.group(2)
            elif aperta is None:
                problemi.append(f'pagina {n_pagina}: riga fuori da ogni domanda: {r}')
                continue
            if r in ('VERO', 'FALSO'):
                chiudi(r == 'VERO')
                continue
            f = FINE_VF.match(r)
            if f:
                aperta['parti'].append(f.group(1))
                chiudi(f.group(2) == 'VERO')
            else:
                aperta['parti'].append(r)
    if aperta is not None:
        problemi.append(f"{aperta['numero']}: senza V/F alla fine del file")
    if coda:
        problemi.append(f'{len(coda)} intestazioni senza tabella')
    return quesiti, domande, problemi


def dal_disegno(reader):
    """Per ogni domanda con figura, il nome della figura; dalle posizioni del flusso di disegno."""
    figure, problemi = {}, []
    for n_pagina, pagina in enumerate(reader.pages, 1):
        disegni, numeri = [], []

        def prima(op, args, cm, tm):
            if op == b'Do':
                disegni.append((args[0], list(cm)))

        def scritto(testo, cm, tm, font, corpo):
            t = testo.strip()
            if re.fullmatch(r'\d{5}', t):
                x = tm[4] * cm[0] + tm[5] * cm[2] + cm[4]
                y = tm[4] * cm[1] + tm[5] * cm[3] + cm[5]
                if x < X_NUMERO:
                    numeri.append((int(t), y))

        pagina.extract_text(visitor_operand_before=prima, visitor_text=scritto)
        risorse = pagina['/Resources'].get_object()
        immagini = risorse['/XObject'].get_object() if '/XObject' in risorse else {}
        for nome, cm in disegni:
            if cm[4] < X_FIGURA:
                continue  # il logo del Ministero
            basso, alto = cm[5], cm[5] + cm[3]
            accanto = [n for n, y in numeri if basso <= y <= alto]
            if len(accanto) != 1:
                problemi.append(f'pagina {n_pagina}: figura {nome} accanto a {len(accanto)} numeri')
                continue
            figure[accanto[0]] = nome_figura(immagini[nome].get_object()._data)
    return figure, problemi


def main():
    primo = json.loads(OUT.read_text(encoding='utf-8'))
    reader = PdfReader(str(PDF))
    quesiti, domande, problemi = dal_testo(reader)
    figure, problemi_figure = dal_disegno(reader)
    differenze = problemi + problemi_figure

    per_quesito = {}
    for d in primo:
        q = per_quesito.setdefault(d['quesito'], {'capitolo': d['capitolo'], 'tipi': d['tipi'], 'numeri': []})
        q['numeri'].append(d['numero'])
    if set(per_quesito) != set(quesiti):
        differenze.append(f'quesiti diversi: {sorted(set(per_quesito) ^ set(quesiti))[:20]}')
    for n in sorted(set(per_quesito) & set(quesiti)):
        a, b = per_quesito[n], quesiti[n]
        for campo in ('capitolo', 'tipi', 'numeri'):
            if a[campo] != b[campo]:
                differenze.append(f'quesito {n}: {campo}')
    for d in primo:
        altra = domande.get(d['numero'])
        if altra is None:
            differenze.append(f"{d['numero']}: manca nella seconda estrazione")
            continue
        for campo in ('quesito', 'testo', 'vera'):
            if d[campo] != altra[campo]:
                differenze.append(f"{d['numero']}: {campo}")
        if d['figura'] != figure.get(d['numero']):
            differenze.append(f"{d['numero']}: figura")
    if len(domande) != len(primo):
        differenze.append(f'domande: {len(primo)} contro {len(domande)}')

    if differenze:
        print('❌ Le due estrazioni non coincidono:')
        for d in differenze[:50]:
            print('  -', d)
        sys.exit(1)
    print(f'✅ due estrazioni indipendenti coincidono: {len(quesiti)} quesiti, {len(domande)} domande, '
          f'testi, V/F e {len(figure)} figure')


if __name__ == '__main__':
    main()

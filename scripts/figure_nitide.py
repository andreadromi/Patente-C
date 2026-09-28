#!/usr/bin/env python3
"""
Le figure del listato, nitide sul telefono.

Nel PDF del Ministero le figure sono JPEG piccoli (quasi tutte 200×200 px) e
molto compressi: stampate a due o tre centimetri vanno bene, ma nell'app
stanno in una cornice alta fino a 200 punti, e su uno schermo con tre pixel
per punto il browser le ingrandisce due o tre volte: bordi sfocati e la grana
della compressione attorno a ogni tratto.

Qui ogni figura:
  1. perde i margini bianchi, così riempie la cornice (il disegno non si tocca);
  2. si ingrandisce, bicubico, fino a circa 900 px sul lato lungo;
  3. si rende nitida canale per canale: ogni pixel va verso il valore più scuro
     o più chiaro che ha intorno, lungo una curva ripida. Sui bordi il
     passaggio si stringe; nelle zone piatte si leva solo la grana del JPEG;
  4. il quasi bianco (tutti e tre i canali chiarissimi) torna bianco: sono gli
     aloni della compressione attorno ai tratti, sulla carta non c'erano.

Nessun colore nuovo e nessun dettaglio inventato: ogni valore resta fra quelli
che il pixel ha intorno nell'ingrandimento dell'originale. Per questo non si
passa da una tavolozza di colori "puliti": il blu scuro di un cartello e il
nero sono troppo vicini, e un tratto sottile finirebbe del colore sbagliato.

Il nome non cambia: resta quello dell'originale (le prime 12 cifre dello SHA-1
dei suoi byte nel PDF), così la domanda punta sempre alla stessa figura.

Uso: la chiama scripts/archivio_scrivi.py; da sola,
    python3 scripts/figure_nitide.py originale.jpg uscita.jpg
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

LATO = 900      # lato lungo dell'uscita, circa, in pixel
SFONDO = 215    # un pixel con tutti i canali sopra questo valore è sfondo bianco
MARGINE = 3     # bianco lasciato attorno al disegno, in pixel dell'originale
RIPIDA = 9.0    # pendenza della curva che stringe i bordi
SALTO = (16.0, 48.0)  # salto di valore nell'intorno: sotto è zona piatta, sopra è bordo
QUASI_BIANCO = (214.0, 238.0)  # canale più scuro: da qui comincia a schiarire, da qui è bianco


def rifila(img):
    """Toglie i margini bianchi, lasciandone MARGINE pixel attorno al disegno."""
    a = np.asarray(img)
    disegno = a.min(axis=2) < SFONDO
    righe = np.flatnonzero(disegno.any(axis=1))
    colonne = np.flatnonzero(disegno.any(axis=0))
    if len(righe) == 0:
        return img
    h, w = disegno.shape
    return img.crop((max(colonne[0] - MARGINE, 0), max(righe[0] - MARGINE, 0),
                     min(colonne[-1] + 1 + MARGINE, w), min(righe[-1] + 1 + MARGINE, h)))


def curva(t, k):
    """Da 0 a 1 passando per 0.5, ripida nel mezzo: stringe il passaggio di un bordo."""
    s = lambda x: 1 / (1 + np.exp(-x))
    return (s(k * (t - 0.5)) - s(-k / 2)) / (s(k / 2) - s(-k / 2))


def nitida_immagine(img):
    img = rifila(img.convert('RGB'))
    w, h = img.size
    scala = int(min(6, max(2, round(LATO / max(w, h)))))
    finestra = 2 * round(1.1 * scala) + 1   # l'intorno copre il passaggio di un bordo ingrandito
    grande = np.asarray(img.resize((w * scala, h * scala), Image.BICUBIC)).astype(np.float32)
    uscita = np.empty_like(grande)
    for c in range(3):
        v = grande[..., c]
        basso = ndimage.minimum_filter(v, finestra)
        alto = ndimage.maximum_filter(v, finestra)
        salto = alto - basso
        t = np.where(salto > 1e-3, (v - basso) / np.maximum(salto, 1e-3), 0.5)
        netto = basso + curva(t, RIPIDA) * salto
        piatto = ndimage.gaussian_filter(v, scala / 2)
        bordo = np.clip((salto - SALTO[0]) / (SALTO[1] - SALTO[0]), 0, 1)
        uscita[..., c] = piatto + bordo * (netto - piatto)
    chiaro = np.clip((uscita.min(axis=2) - QUASI_BIANCO[0]) / (QUASI_BIANCO[1] - QUASI_BIANCO[0]), 0, 1)
    uscita += chiaro[..., None] * (255 - uscita)
    return Image.fromarray(np.clip(uscita + 0.5, 0, 255).astype(np.uint8))


def nitida(origine, destinazione):
    with Image.open(origine) as img:
        nitida_immagine(img).save(destinazione, 'JPEG', quality=92, subsampling=0, optimize=True, progressive=True)


if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    nitida(Path(sys.argv[1]), Path(sys.argv[2]))

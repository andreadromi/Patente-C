"""
Scraper immagini segnali stradali per Patente C
================================================
Scarica le immagini dei segnali stradali dal database MIT/patentisuperiori
e le associa alle domande che le richiedono nel JSON.

Installazione:
    pip install requests beautifulsoup4 Pillow

Utilizzo:
    1. Metti questo script nella cartella Patente-C/scripts/
    2. Esegui: python scraper_immagini.py
    3. Le immagini vengono salvate in: public/segnali/
    4. Il JSON aggiornato viene salvato in: data/domande_patente_c.json

Output:
    - public/segnali/*.png  → immagini segnali
    - data/domande_patente_c.json → aggiornato con campo "immagine"
"""

import requests
import json
import os
import time
import hashlib
from bs4 import BeautifulSoup
from pathlib import Path

BASE = "https://www.patentisuperiori.com"
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}

# Cartelle output
ROOT = Path(__file__).parent.parent  # cartella Patente-C
IMG_DIR = ROOT / "public" / "segnali"
DATA_FILE = ROOT / "data" / "domande_patente_c.json"

IMG_DIR.mkdir(parents=True, exist_ok=True)

# URL delle pagine di simulazione che contengono immagini
# Le immagini appaiono nelle schede d'esame simulate
ESAME_URLS = [
    f"{BASE}/quiz-patente-c/esame-{i}.html" for i in range(1, 60)
]

def fetch(url, retries=3):
    for i in range(retries):
        try:
            r = requests.get(url, headers=HEADERS, timeout=15)
            if r.status_code == 200:
                return r
        except Exception as e:
            print(f"  Errore {i+1}: {e}")
            time.sleep(2)
    return None

def download_image(img_url, filename):
    """Scarica un'immagine e la salva."""
    r = fetch(img_url)
    if not r:
        return None
    filepath = IMG_DIR / filename
    with open(filepath, 'wb') as f:
        f.write(r.content)
    return str(filepath.relative_to(ROOT / "public"))

def img_hash(url):
    """Genera nome file dall'URL."""
    return hashlib.md5(url.encode()).hexdigest()[:12] + ".png"

def scrape_esame_page(url):
    """
    Estrae domande con immagini da una pagina simulazione.
    Ritorna lista di {testo, immagine_url}
    """
    r = fetch(url)
    if not r:
        return []

    soup = BeautifulSoup(r.text, "html.parser")
    results = []

    # Cerca le domande con immagini nella tabella esame
    rows = soup.find_all("tr")
    for row in rows:
        # Cerca immagini nelle celle
        imgs = row.find_all("img")
        tds = row.find_all("td")
        
        for img in imgs:
            src = img.get("src", "")
            # Filtra solo immagini di segnali (non loghi del sito)
            if not src or "patentisuperiori.png" in src or "trasparent" in src:
                continue
            if not any(ext in src.lower() for ext in [".jpg", ".jpeg", ".png", ".gif"]):
                continue
            
            # Prendi il testo della domanda dalla stessa riga
            testo = ""
            for td in tds:
                t = td.get_text(strip=True)
                if len(t) > 10 and t not in ["V", "F", "VERO", "FALSO"]:
                    testo = t
                    break
            
            if testo:
                img_url = src if src.startswith("http") else BASE + src
                results.append({
                    "testo": testo,
                    "immagine_url": img_url
                })
    
    return results


def main():
    print("🔍 Cerca domande con immagini nelle simulazioni...")
    
    # Carica JSON esistente
    with open(DATA_FILE, encoding="utf-8") as f:
        data = json.load(f)
    
    domande = data["domande"] if isinstance(data, dict) else data
    
    # Crea mappa testo → domanda per lookup veloce
    testo_map = {}
    for d in domande:
        key = d["domanda"].lower().strip()[:50]  # primi 50 char
        testo_map[key] = d

    domande_con_img = []
    img_scaricate = 0
    img_associate = 0

    for i, url in enumerate(ESAME_URLS):
        print(f"\r  Pagina {i+1}/{len(ESAME_URLS)}...", end="", flush=True)
        
        risultati = scrape_esame_page(url)
        
        for res in risultati:
            img_url = res["immagine_url"]
            testo = res["testo"]
            
            # Scarica immagine
            filename = img_hash(img_url)
            filepath = IMG_DIR / filename
            
            if not filepath.exists():
                r = fetch(img_url)
                if r:
                    with open(filepath, 'wb') as f:
                        f.write(r.content)
                    img_scaricate += 1
            
            # Associa alla domanda nel JSON
            key = testo.lower().strip()[:50]
            if key in testo_map:
                testo_map[key]["immagine"] = f"/segnali/{filename}"
                img_associate += 1
                domande_con_img.append(testo[:60])
        
        time.sleep(0.3)

    print(f"\n\n✅ Immagini scaricate: {img_scaricate}")
    print(f"✅ Domande con immagine associate: {img_associate}")
    
    if domande_con_img:
        print("\nDomande con immagine:")
        for d in domande_con_img[:10]:
            print(f"  - {d}...")
    
    # Salva JSON aggiornato
    if isinstance(data, dict):
        data["domande"] = domande
    else:
        data = domande
    
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"\n💾 JSON aggiornato: {DATA_FILE}")
    print(f"🖼  Immagini in: {IMG_DIR}")
    
    if img_associate == 0:
        print("\n⚠️  Nessuna immagine trovata — le domande con segnali potrebbero")
        print("   richiedere login sul sito. In alternativa usa il database MIT:")
        print("   https://www.mit.gov.it/mit/site.php?p=cm&o=visualizza&id=960")


if __name__ == "__main__":
    main()

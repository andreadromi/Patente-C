#!/usr/bin/env python3
import requests, os, json, time
from bs4 import BeautifulSoup

SESSION = requests.Session()
SESSION.headers.update({
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/114.0.0.0 Mobile Safari/537.36',
    'Accept': '*/*',
})

BASE = "https://www.patentisuperiori.com"
SESSION.cookies.set('PHPSESSID', '9ef776d21f54a09cb178a77bdfbcb341', domain='www.patentisuperiori.com')
SESSION.cookies.set('_ga', 'GA1.1.600161829.1774938363', domain='.patentisuperiori.com')

ARGOMENTI = [
    "disposizioni-guida-riposo","impiego-cronotachigrafo",
    "disposizioni-trasporto-persone","documenti-circolazione-trasporto",
    "comportamento-in-caso-incidente","rimozione-sostituzione-ruote",
    "dimensione-massa-velocita","limitazione-campo-visivo",
    "responsabilita-persone-trasportate","rimorchi-semirimorchi",
    "motori-sistemi-alimentazione","lubrificazione-protezione-gelo",
    "pneumatici","freno-acceleratore","guasti-sospensioni-ammortizzatori",
    "manutenzione-riparazioni","trasporto-consegna-merci",
]

os.makedirs("quiz_images", exist_ok=True)
mapping = {}

for arg in ARGOMENTI:
    print(f"\n📂 {arg}")
    pagina = 1
    vuote = 0

    while pagina <= 200:
        url = f"{BASE}/quiz-patente-c/argomento/{arg}-{pagina}.html"
        r = SESSION.get(url)
        if r.status_code != 200:
            break

        soup = BeautifulSoup(r.text, "html.parser")
        trovate = 0

        # Cerca TUTTE le img con imageSolution (anche dentro uk-hidden)
        for img in soup.find_all("img", src=lambda s: s and "imageSolution" in s):
            src = img.get("src", "")
            if not src.startswith("http"):
                src = BASE + src

            # Trova il testo della domanda: cerca il tag li o div antenato con testo
            testo = ""
            for parent in img.parents:
                t = parent.get_text(" ", strip=True)
                if len(t) > 20 and len(t) < 500:
                    testo = t
                    break

            sol = src.split("sol=")[-1][:30].replace("/","_") if "sol=" in src else f"{arg}_{pagina}_{trovate}"
            fname = f"{sol}.jpg"

            try:
                img_bytes = SESSION.get(src, timeout=15).content
                if len(img_bytes) < 200:
                    print(f"  ⚠ {fname} troppo piccola ({len(img_bytes)}B)")
                    continue
                with open(f"quiz_images/{fname}", "wb") as f:
                    f.write(img_bytes)
                mapping[fname] = {"url": src, "testo": testo[:300]}
                trovate += 1
                print(f"  ✓ {fname} ({len(img_bytes)}B)")
            except Exception as e:
                print(f"  ✗ {e}")

        if trovate == 0:
            vuote += 1
            if vuote >= 2:
                break
        else:
            vuote = 0
        pagina += 1
        time.sleep(0.3)

with open("quiz_images/mapping.json", "w", encoding="utf-8") as f:
    json.dump(mapping, f, ensure_ascii=False, indent=2)

print(f"\n🎉 Finito! {len(mapping)} immagini in quiz_images/")
print("Comprimi: tar -czf quiz_images.tar.gz quiz_images/")

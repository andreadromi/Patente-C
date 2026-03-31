#!/usr/bin/env python3
import requests, os, json, time, re
from bs4 import BeautifulSoup

SESSION = requests.Session()
SESSION.headers.update({
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/114.0.0.0 Mobile Safari/537.36',
})
BASE = "https://www.patentisuperiori.com"
SESSION.cookies.set('PHPSESSID', '9ef776d21f54a09cb178a77bdfbcb341', domain='www.patentisuperiori.com')

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

        # Usa regex direttamente sull'HTML grezzo — ignora parsing BeautifulSoup
        html = r.text
        
        # Trova tutti i src con imageSolution
        srcs = re.findall(r'src="(/patente/imageSolution\.php\?sol=[^"]+)"', html)
        
        # Trova testi domande vicini alle immagini (testo tra tag <li>)
        items = re.findall(r'<li[^>]*>(.*?)</li>', html, re.DOTALL)
        
        trovate = 0
        for src in srcs:
            full_url = BASE + src
            sol = re.search(r'sol=([^&"]+)', src)
            sol_val = sol.group(1)[:30] if sol else f"{arg}_{pagina}_{trovate}"
            fname = f"{sol_val}.png"
            
            # Trova testo domanda associato
            testo = ""
            for item in items:
                if sol_val[:10] in item or "imageSolution" in item:
                    testo = re.sub(r'<[^>]+>', ' ', item).strip()[:300]
                    break

            try:
                img_r = SESSION.get(full_url, timeout=15)
                if img_r.status_code == 200 and len(img_r.content) > 100:
                    with open(f"quiz_images/{fname}", "wb") as f:
                        f.write(img_r.content)
                    mapping[fname] = {"url": full_url, "testo": testo}
                    trovate += 1
                    print(f"  ✓ {fname} ({len(img_r.content)}B)")
                else:
                    print(f"  ⚠ {fname}: status={img_r.status_code} size={len(img_r.content)}")
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

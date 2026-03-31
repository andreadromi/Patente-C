#!/usr/bin/env python3
import requests, os, json, time
from bs4 import BeautifulSoup

SESSION = requests.Session()
SESSION.headers.update({
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'it-IT,it;q=0.9',
})

BASE = "https://www.patentisuperiori.com"

print("=== SCRAPER IMMAGINI QUIZ PATENTE C ===")
USER = input("Username: ")
PASS = input("Password: ")

# Carica pagina registrati (che contiene anche il form login)
SESSION.get(f"{BASE}/login/registrati.php")

# Login con i campi corretti
resp = SESSION.post(f"{BASE}/login/registrati.php", data={
    "username": USER,
    "password": PASS,
    "tryToLog": "true",
    "menu_login": "true",
}, allow_redirects=True)

# Verifica
if USER.lower() in resp.text.lower() or "logout" in resp.text.lower() or "profilo" in resp.text.lower():
    print("✅ Login OK!")
else:
    # Prova a controllare una pagina protetta
    check = SESSION.get(f"{BASE}/quiz-patente-c/statistiche.html")
    if USER.lower() in check.text.lower() or "logout" in check.text.lower():
        print("✅ Login OK (verifica da statistiche)!")
    else:
        print("⚠️  Login incerto, continuo comunque...")

ARGOMENTI = [
    "disposizioni-guida-riposo",
    "impiego-cronotachigrafo",
    "disposizioni-trasporto-persone",
    "documenti-circolazione-trasporto",
    "comportamento-in-caso-incidente",
    "rimozione-sostituzione-ruote",
    "dimensione-massa-velocita",
    "limitazione-campo-visivo",
    "responsabilita-persone-trasportate",
    "rimorchi-semirimorchi",
    "motori-sistemi-alimentazione",
    "lubrificazione-protezione-gelo",
    "pneumatici",
    "freno-acceleratore",
    "guasti-sospensioni-ammortizzatori",
    "manutenzione-riparazioni",
    "trasporto-consegna-merci",
]

os.makedirs("quiz_images", exist_ok=True)
mapping = {}

for arg in ARGOMENTI:
    print(f"\n📂 {arg}")
    pagina = 1
    while True:
        url = f"{BASE}/quiz-patente-c/argomento/{arg}-{pagina}.html"
        r = SESSION.get(url)
        if r.status_code != 200:
            print(f"  Stop a pagina {pagina} (status {r.status_code})")
            break
        soup = BeautifulSoup(r.text, "html.parser")

        # Cerca tutte le immagini che NON siano decorative
        trovate = 0
        for img in soup.find_all("img"):
            src = img.get("src", "")
            if not src:
                continue
            # Salta immagini decorative/logo
            skip = ["trasparent", "logo", "patentisuperiori.png", "banner",
                    "pub", "adv", "mezzi-logo", "scorecardresearch"]
            if any(s in src.lower() for s in skip):
                continue
            # Prendi solo immagini quiz (non trasparenti)
            if src == "/img/trasparent.gif":
                continue

            if not src.startswith("http"):
                src = BASE + src

            # Trova testo domanda associato
            container = (img.find_parent("li") or
                        img.find_parent("div", class_=lambda c: c and "quiz" in c.lower()) or
                        img.find_parent("div") or img.parent)
            testo = container.get_text(" ", strip=True)[:300] if container else ""
            fname = src.split("/")[-1].split("?")[0]

            try:
                img_bytes = SESSION.get(src, timeout=10).content
                if len(img_bytes) < 100:  # Skip immagini vuote
                    continue
                with open(f"quiz_images/{fname}", "wb") as f:
                    f.write(img_bytes)
                mapping[fname] = {"url": src, "testo": testo}
                trovate += 1
                print(f"  ✓ {fname} ({len(img_bytes)}B)")
            except Exception as e:
                print(f"  ✗ {fname}: {e}")

        print(f"  Pagina {pagina}: {trovate} immagini")
        if trovate == 0 and pagina > 1:
            break
        elif trovate == 0 and pagina == 1:
            print(f"  (Nessuna immagine in questo argomento)")
            break
        pagina += 1
        time.sleep(0.4)

with open("quiz_images/mapping.json", "w", encoding="utf-8") as f:
    json.dump(mapping, f, ensure_ascii=False, indent=2)

print(f"\n🎉 Finito! {len(mapping)} immagini in quiz_images/")
print("Ora esegui: tar -czf quiz_images.tar.gz quiz_images/")

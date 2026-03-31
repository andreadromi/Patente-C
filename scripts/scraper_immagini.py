#!/usr/bin/env python3
import requests, os, json, time
from bs4 import BeautifulSoup

SESSION = requests.Session()
BASE_SUPERIORI = "https://www.patentisuperiori.com"
BASE_LOGIN = "https://www.patentati.it"

print("=== SCRAPER IMMAGINI QUIZ PATENTE C ===")
USER = input("Username: ")
PASS = input("Password: ")

# Prova login su patentati.it
print("Provo login su patentati.it...")
resp = SESSION.post(f"{BASE_LOGIN}/login/login.php", data={
    "username": USER, "password": PASS, "submit": "Accedi"
}, headers={"Referer": BASE_LOGIN + "/"}, allow_redirects=True)

# Verifica login
check = SESSION.get(f"{BASE_LOGIN}/login/profilo.php")
if "logout" in check.text.lower() or USER.lower() in check.text.lower():
    print("✅ Login OK su patentati.it!")
else:
    # Prova anche su patentisuperiori.com
    print("Provo login su patentisuperiori.com...")
    resp2 = SESSION.post(f"{BASE_SUPERIORI}/login/login.php", data={
        "username": USER, "password": PASS, "submit": "Accedi"
    }, headers={"Referer": BASE_SUPERIORI + "/"}, allow_redirects=True)
    check2 = SESSION.get(f"{BASE_SUPERIORI}/login/profilo.php")
    if "logout" in check2.text.lower() or USER.lower() in check2.text.lower():
        print("✅ Login OK su patentisuperiori.com!")
    else:
        print("❌ Login fallito su entrambi i siti.")
        print(f"Stato risposta: {resp.status_code}")
        print("Continuo comunque per debug...")

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
        url = f"{BASE_SUPERIORI}/quiz-patente-c/argomento/{arg}-{pagina}.html"
        r = SESSION.get(url)
        if r.status_code != 200:
            break
        soup = BeautifulSoup(r.text, "html.parser")
        trovate = 0
        for img in soup.find_all("img"):
            src = img.get("src", "")
            if not src or "trasparent" in src or "logo" in src or "patentisuperiori.png" in src:
                continue
            if not any(x in src for x in ["/quiz/", "/img/q", "/domande/", "/images/"]):
                continue
            if not src.startswith("http"):
                src = BASE_SUPERIORI + src
            container = img.find_parent("div") or img.find_parent("li") or img.parent
            testo = container.get_text(" ", strip=True) if container else ""
            fname = src.split("/")[-1].split("?")[0]
            try:
                img_bytes = SESSION.get(src).content
                with open(f"quiz_images/{fname}", "wb") as f:
                    f.write(img_bytes)
                mapping[fname] = testo
                trovate += 1
                print(f"  ✓ {fname}")
            except Exception as e:
                print(f"  ✗ {fname}: {e}")
        print(f"  Pagina {pagina}: {trovate} immagini")
        if trovate == 0:
            break
        pagina += 1
        time.sleep(0.3)

with open("quiz_images/mapping.json", "w", encoding="utf-8") as f:
    json.dump(mapping, f, ensure_ascii=False, indent=2)

print(f"\n🎉 Finito! {len(mapping)} immagini in quiz_images/")

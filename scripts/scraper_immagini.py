#!/usr/bin/env python3
import requests, os, json, time
from bs4 import BeautifulSoup

SESSION = requests.Session()
SESSION.headers.update({
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/114.0.0.0 Mobile Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'it-IT,it;q=0.9',
    'Referer': 'https://www.patentisuperiori.com/',
})

BASE = "https://www.patentisuperiori.com"

print("=== SCRAPER IMMAGINI QUIZ PATENTE C ===")
USER = input("Username: ")
PASS = input("Password: ")

# Step 1: carica homepage per cookie
SESSION.get(BASE)
time.sleep(1)

# Step 2: carica pagina login
SESSION.get(f"{BASE}/login/registrati.php")
time.sleep(1)

# Step 3: login
resp = SESSION.post(f"{BASE}/login/registrati.php", data={
    "username": USER,
    "password": PASS,
    "tryToLog": "true",
    "menu_login": "true",
}, allow_redirects=True)

# Step 4: verifica login cercando nome utente nella pagina
check = SESSION.get(f"{BASE}/quiz-patente-c/argomento/disposizioni-guida-riposo-1.html")
soup_check = BeautifulSoup(check.text, "html.parser")

# Se loggato, non ci sarà il form di login visibile nel menu
logged_in = USER.lower() in check.text.lower() or "profilo" in check.text.lower()
has_trasparent = check.text.count("trasparent.gif") < 5  # Loggato = meno placeholder

print(f"Testo pagina contiene username: {USER.lower() in check.text.lower()}")
print(f"Trasparent.gif count: {check.text.count('trasparent.gif')}")

# Cerca immagini reali nella prima pagina di test
imgs_test = [img.get("src","") for img in soup_check.find_all("img") 
             if img.get("src","") and "trasparent" not in img.get("src","")
             and "/quiz/" in img.get("src","")]
print(f"Immagini quiz trovate nella pagina test: {len(imgs_test)}")
if imgs_test:
    print(f"Esempio: {imgs_test[0]}")
    print("✅ Login OK - immagini visibili!")
else:
    print("⚠️  Nessuna immagine quiz trovata - probabilmente non loggato")
    print("Provo a continuare comunque...")

# Scraping per argomento - solo immagini con path /quiz/ o numerico
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
SKIP = {"staticon.png","stampa.png","staticonSm.png","804.png","808.png",
        "back.png","next.png","resume.png","edit.png","imagesolution.php",
        "truei.png","falsei.png","trasparent.gif","patentisuperiori.png",
        "mezzi-logo.png"}

for arg in ARGOMENTI:
    print(f"\n📂 {arg}")
    pagina = 1
    pagine_vuote = 0
    while pagina <= 50:
        url = f"{BASE}/quiz-patente-c/argomento/{arg}-{pagina}.html"
        r = SESSION.get(url)
        if r.status_code != 200:
            break
        soup = BeautifulSoup(r.text, "html.parser")
        trovate = 0

        for img in soup.find_all("img"):
            src = img.get("src", "")
            if not src:
                continue
            fname = src.split("/")[-1].split("?")[0].lower()
            # Salta icone interfaccia
            if fname in SKIP or len(fname) < 4:
                continue
            # Salta se non contiene path quiz o è icona nota
            if not any(x in src for x in ["/quiz/", "/img/q", "/domande/", "/images/quiz"]):
                continue

            if not src.startswith("http"):
                src = BASE + src

            # Testo domanda
            container = (img.find_parent("li") or img.find_parent("div") or img.parent)
            testo = container.get_text(" ", strip=True)[:400] if container else ""

            real_fname = src.split("/")[-1].split("?")[0]
            try:
                img_bytes = SESSION.get(src, timeout=10).content
                if len(img_bytes) < 500:
                    continue
                with open(f"quiz_images/{real_fname}", "wb") as f:
                    f.write(img_bytes)
                mapping[real_fname] = {"url": src, "testo": testo}
                trovate += 1
                print(f"  ✓ {real_fname} ({len(img_bytes)}B)")
            except Exception as e:
                print(f"  ✗ {real_fname}: {e}")

        if trovate == 0:
            pagine_vuote += 1
            if pagine_vuote >= 2:
                break
        else:
            pagine_vuote = 0
        pagina += 1
        time.sleep(0.3)

    print(f"  Totale argomento: {sum(1 for v in mapping.values())}")

with open("quiz_images/mapping.json", "w", encoding="utf-8") as f:
    json.dump(mapping, f, ensure_ascii=False, indent=2)

print(f"\n🎉 Finito! {len(mapping)} immagini quiz in quiz_images/")
print("Comprimi con: tar -czf quiz_images.tar.gz quiz_images/")

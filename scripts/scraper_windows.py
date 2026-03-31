#!/usr/bin/env python3
import requests, os, json, time, re, sys
from bs4 import BeautifulSoup

SESSION = requests.Session()
SESSION.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8',
})

BASE = "https://www.patentisuperiori.com"

print("=== SCRAPER IMMAGINI QUIZ PATENTE C ===")
USER = input("Username: ")
PASS = input("Password: ")

# Login
print("Login in corso...")
SESSION.get(BASE)
time.sleep(1)
SESSION.get(f"{BASE}/login/registrati.php")
time.sleep(1)
SESSION.post(f"{BASE}/login/registrati.php", data={
    "username": USER, "password": PASS,
    "tryToLog": "true", "menu_login": "true",
}, allow_redirects=True)
print("Avvio scraping...")

ARGOMENTI = [
    ("disposizioni-guida-riposo", "guida_riposo"),
    ("impiego-cronotachigrafo", "cronotachigrafo"),
    ("disposizioni-trasporto-persone", "trasporto_persone"),
    ("documenti-circolazione-trasporto", "documenti"),
    ("comportamento-in-caso-incidente", "incidente"),
    ("rimozione-sostituzione-ruote", "ruote"),
    ("dimensione-massa-velocita", "dimensioni"),
    ("limitazione-campo-visivo", "visivo"),
    ("responsabilita-persone-trasportate", "caricamento"),
    ("rimorchi-semirimorchi", "rimorchi"),
    ("motori-sistemi-alimentazione", "motori"),
    ("lubrificazione-protezione-gelo", "lubrificazione"),
    ("pneumatici", "pneumatici"),
    ("freno-acceleratore", "freni"),
    ("guasti-sospensioni-ammortizzatori", "guasti"),
    ("manutenzione-riparazioni", "manutenzione"),
    ("trasporto-consegna-merci", "merci"),
]

os.makedirs("quiz_images", exist_ok=True)
mapping = {}

for arg_url, arg_code in ARGOMENTI:
    print(f"\nArgomento: {arg_code}")
    pagina = 1
    vuote = 0

    while pagina <= 300:
        url = f"{BASE}/quiz-patente-c/argomento/{arg_url}-{pagina}.html"
        r = SESSION.get(url)
        if r.status_code != 200:
            break

        soup = BeautifulSoup(r.text, 'html.parser')
        trovate = 0

        for li in soup.find_all('li'):
            li_html = str(li)
            sols = re.findall(r'imageSolution\.php\?sol=([a-z]+)', li_html)
            if not sols:
                continue
            testo = li.get_text(' ', strip=True)[:400]
            for sol in set(sols):
                img_url = f"{BASE}/patente/imageSolution.php?sol={sol}"
                fname = f"{arg_code}_{sol[:25]}.png"
                if fname in mapping:
                    continue
                try:
                    img_r = SESSION.get(img_url, timeout=15)
                    if img_r.status_code == 200 and len(img_r.content) > 50:
                        ct = img_r.headers.get('Content-Type','')
                        if 'image' in ct:
                            with open(f"quiz_images/{fname}", "wb") as f:
                                f.write(img_r.content)
                            mapping[fname] = {"sol": sol, "testo": testo, "capitolo": arg_code, "size": len(img_r.content)}
                            trovate += 1
                            print(f"  OK {fname} ({len(img_r.content)}B)")
                except Exception as e:
                    print(f"  ERR: {e}")

        print(f"  Pagina {pagina}: {trovate}")
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
print(f"\nFINITO! {len(mapping)} immagini")

# Upload GitHub
TOKEN = input("\nGitHub token (ghp_...): ")
REPO = "andreadromi/Patente-C"
import base64, urllib.request, urllib.error

files_to_upload = list(mapping.keys()) + ["mapping.json"]
for fname in files_to_upload:
    fpath = f"quiz_images/{fname}"
    if not os.path.exists(fpath):
        continue
    with open(fpath, "rb") as f:
        content = base64.b64encode(f.read()).decode()
    api_url = f"https://api.github.com/repos/{REPO}/contents/public/quiz_images/{fname}"
    data = json.dumps({"message": f"Add {fname}", "content": content}).encode()
    req = urllib.request.Request(api_url, data=data, method="PUT")
    req.add_header("Authorization", f"token {TOKEN}")
    req.add_header("Content-Type", "application/json")
    req.add_header("User-Agent", "scraper")
    try:
        urllib.request.urlopen(req)
        print(f"  Caricato: {fname}")
    except urllib.error.HTTPError as e:
        print(f"  Errore {fname}: {e.code}")

print("\nDone!")

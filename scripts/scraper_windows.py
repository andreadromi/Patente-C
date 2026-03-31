#!/usr/bin/env python3
import requests, os, json, time, re, base64, urllib.request, urllib.error
from bs4 import BeautifulSoup

SESSION = requests.Session()
SESSION.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
})

BASE = "https://www.patentisuperiori.com"

print("=== SCRAPER IMMAGINI QUIZ PATENTE C ===")
USER = input("Username: ")
PASS = input("Password: ")

print("Login...")
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
    vuote_consecutive = 0

    while pagina <= 500:
        url = f"{BASE}/quiz-patente-c/argomento/{arg_url}-{pagina}.html"
        r = SESSION.get(url)
        if r.status_code != 200:
            break

        soup = BeautifulSoup(r.text, 'html.parser')

        # Cerca imageSolution nella pagina (anche dentro uk-hidden)
        img_tag = soup.find('img', id='solutionsImage') or \
                  soup.find('img', alt='soluzioni') or \
                  soup.find('img', src=re.compile(r'imageSolution'))

        if not img_tag:
            vuote_consecutive += 1
            if vuote_consecutive >= 3:
                break
            pagina += 1
            time.sleep(0.2)
            continue

        vuote_consecutive = 0
        src = img_tag.get('src', '')
        if not src.startswith('http'):
            src = BASE + src

        # Estrai il testo della domanda (cerca testo più lungo nella pagina)
        testo = ""
        for tag in soup.find_all(['p', 'div', 'li', 'span']):
            t = tag.get_text(' ', strip=True)
            if 30 < len(t) < 500 and any(w in t.lower() for w in ['veicol', 'conduc', 'trasp', 'massa', 'segnale', 'pannello', 'figura', 'peso', 'caric', 'fren', 'motor']):
                testo = t
                break

        # Nome file
        sol_match = re.search(r'sol=([a-z]+)', src)
        sol = sol_match.group(1)[:25] if sol_match else f"p{pagina}"
        fname = f"{arg_code}_{pagina:04d}_{sol[:15]}.png"

        try:
            img_r = SESSION.get(src, timeout=15)
            if img_r.status_code == 200 and len(img_r.content) > 50:
                ct = img_r.headers.get('Content-Type', '')
                if 'image' in ct:
                    with open(f"quiz_images/{fname}", "wb") as f:
                        f.write(img_r.content)
                    mapping[fname] = {
                        "sol": sol, "testo": testo[:300],
                        "capitolo": arg_code, "pagina": pagina,
                        "size": len(img_r.content)
                    }
                    print(f"  OK p{pagina}: {fname} ({len(img_r.content)}B) {testo[:40]}")
        except Exception as e:
            print(f"  ERR p{pagina}: {e}")

        pagina += 1
        time.sleep(0.25)

with open("quiz_images/mapping.json", "w", encoding="utf-8") as f:
    json.dump(mapping, f, ensure_ascii=False, indent=2)
print(f"\nFINITO! {len(mapping)} immagini in quiz_images/")

# Upload GitHub
TOKEN = input("\nGitHub token (ghp_...): ")
REPO = "andreadromi/Patente-C"

files = list(mapping.keys()) + ["mapping.json"]
for fname in files:
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

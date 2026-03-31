#!/usr/bin/env python3
import requests, os, json, time, re, subprocess, sys

SESSION = requests.Session()
SESSION.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'it-IT,it;q=0.9',
})

BASE = "https://www.patentisuperiori.com"

print("=== SCRAPER IMMAGINI QUIZ PATENTE C ===")
USER = input("Username patentisuperiori.com: ")
PASS = input("Password: ")

# Login completo
print("Login...")
SESSION.get(BASE)
time.sleep(1)
SESSION.get(f"{BASE}/login/registrati.php")
time.sleep(1)

resp = SESSION.post(f"{BASE}/login/registrati.php", data={
    "username": USER,
    "password": PASS,
    "tryToLog": "true",
    "menu_login": "true",
}, allow_redirects=True)

# Verifica con una pagina quiz
check = SESSION.get(f"{BASE}/quiz-patente-c/argomento/dimensione-massa-velocita-1.html")
srcs_test = re.findall(r'src="(/patente/imageSolution\.php\?sol=[^"]+)"', check.text)
if srcs_test:
    test_url = BASE + srcs_test[0]
    test_r = SESSION.get(test_url)
    if test_r.status_code == 200 and test_r.headers.get('Content-Type','').startswith('image') and len(test_r.content) > 1000:
        print(f"Login OK! Prima immagine: {len(test_r.content)}B")
    else:
        print(f"Login fallito o immagine non valida ({len(test_r.content)}B, {test_r.headers.get('Content-Type','')})")
        sys.exit(1)
else:
    print("Nessuna immagine trovata - login probabilmente fallito")
    sys.exit(1)

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
    print(f"\n Argomento: {arg_code}")
    pagina = 1
    vuote = 0

    while pagina <= 300:
        url = f"{BASE}/quiz-patente-c/argomento/{arg_url}-{pagina}.html"
        r = SESSION.get(url)
        if r.status_code != 200:
            break

        html = r.text

        # Estrai tutte le coppie (testo domanda, immagine)
        # La struttura è: <li>...testo...imageSolution...</li>
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(html, 'html.parser')

        trovate = 0
        for li in soup.find_all('li'):
            # Cerca imageSolution nel li o nei suoi figli
            img_tags = li.find_all('img', src=re.compile(r'imageSolution'))
            if not img_tags:
                # Cerca anche nel testo HTML grezzo del li
                li_html = str(li)
                sol_matches = re.findall(r'/patente/imageSolution\.php\?sol=([a-z]+)', li_html)
                if not sol_matches:
                    continue
                for sol in sol_matches:
                    img_url = f"{BASE}/patente/imageSolution.php?sol={sol}"
                    testo = li.get_text(' ', strip=True)[:400]
                    fname = f"{arg_code}_{sol[:20]}.png"
                    try:
                        img_r = SESSION.get(img_url, timeout=15)
                        if img_r.status_code == 200 and img_r.headers.get('Content-Type','').startswith('image') and len(img_r.content) > 100:
                            with open(f"quiz_images/{fname}", "wb") as f:
                                f.write(img_r.content)
                            mapping[fname] = {"sol": sol, "testo": testo, "capitolo": arg_code}
                            trovate += 1
                            print(f"  OK {fname} ({len(img_r.content)}B) - {testo[:50]}")
                    except Exception as e:
                        print(f"  ERR: {e}")
            else:
                for img in img_tags:
                    src = img.get('src','')
                    sol_m = re.search(r'sol=([a-z]+)', src)
                    if not sol_m:
                        continue
                    sol = sol_m.group(1)
                    img_url = BASE + src if not src.startswith('http') else src
                    testo = li.get_text(' ', strip=True)[:400]
                    fname = f"{arg_code}_{sol[:20]}.png"
                    try:
                        img_r = SESSION.get(img_url, timeout=15)
                        if img_r.status_code == 200 and img_r.headers.get('Content-Type','').startswith('image') and len(img_r.content) > 100:
                            with open(f"quiz_images/{fname}", "wb") as f:
                                f.write(img_r.content)
                            mapping[fname] = {"sol": sol, "testo": testo, "capitolo": arg_code}
                            trovate += 1
                            print(f"  OK {fname} ({len(img_r.content)}B) - {testo[:50]}")
                    except Exception as e:
                        print(f"  ERR: {e}")

        print(f"  Pagina {pagina}: {trovate} immagini")
        if trovate == 0:
            vuote += 1
            if vuote >= 2:
                break
        else:
            vuote = 0
        pagina += 1
        time.sleep(0.4)

# Salva mapping
with open("quiz_images/mapping.json", "w", encoding="utf-8") as f:
    json.dump(mapping, f, ensure_ascii=False, indent=2)

print(f"\nFINITO! {len(mapping)} immagini in quiz_images/")

# Upload su GitHub
TOKEN = input("\nGitHub token (ghp_...): ")
REPO = "andreadromi/Patente-C"

print("Carico su GitHub...")
import base64, urllib.request

for fname, meta in mapping.items():
    with open(f"quiz_images/{fname}", "rb") as f:
        content = base64.b64encode(f.read()).decode()
    
    api_url = f"https://api.github.com/repos/{REPO}/contents/public/quiz_images/{fname}"
    data = json.dumps({
        "message": f"Add quiz image {fname}",
        "content": content
    }).encode()
    
    req = urllib.request.Request(api_url, data=data, method="PUT")
    req.add_header("Authorization", f"token {TOKEN}")
    req.add_header("Content-Type", "application/json")
    req.add_header("User-Agent", "scraper")
    
    try:
        urllib.request.urlopen(req)
        print(f"  Caricato: {fname}")
    except Exception as e:
        print(f"  Errore {fname}: {e}")

# Carica anche il mapping.json
with open("quiz_images/mapping.json", "rb") as f:
    content = base64.b64encode(f.read()).decode()
api_url = f"https://api.github.com/repos/{REPO}/contents/public/quiz_images/mapping.json"
data = json.dumps({"message": "Add quiz images mapping", "content": content}).encode()
req = urllib.request.Request(api_url, data=data, method="PUT")
req.add_header("Authorization", f"token {TOKEN}")
req.add_header("Content-Type", "application/json")
req.add_header("User-Agent", "scraper")
try:
    urllib.request.urlopen(req)
    print("  Caricato: mapping.json")
except Exception as e:
    print(f"  Errore mapping: {e}")

print("\nTutto caricato su GitHub!")

#!/usr/bin/env python3
import requests, os, json, time
from bs4 import BeautifulSoup

SESSION = requests.Session()
SESSION.headers.update({
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/114.0.0.0 Mobile Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'it-IT,it;q=0.9',
})

BASE = "https://www.patentisuperiori.com"

# Cookie di sessione
SESSION.cookies.set('PHPSESSID', '9ef776d21f54a09cb178a77bdfbcb341', domain='www.patentisuperiori.com')
SESSION.cookies.set('_ga', 'GA1.1.600161829.1774938363', domain='.patentisuperiori.com')

# Verifica login
print("Verifico sessione...")
r = SESSION.get(f"{BASE}/quiz-patente-c/argomento/dimensione-massa-velocita-1.html")
soup = BeautifulSoup(r.text, "html.parser")

# Conta quante immagini trasparent ci sono (se loggato = 0, se non loggato = tante)
transp = r.text.count('trasparent.gif')
print(f"Immagini placeholder (trasparent): {transp}")

# Cerca immagini quiz reali
imgs_quiz = [img.get('src','') for img in soup.find_all('img') 
             if 'imageSolution' in img.get('src','') or 
             ('/quiz/' in img.get('src','') and 'trasparent' not in img.get('src',''))]
print(f"Immagini quiz trovate: {len(imgs_quiz)}")

if imgs_quiz:
    print(f"Esempio URL: {imgs_quiz[0]}")
    print("✅ Sessione attiva!")
elif transp < 5:
    print("⚠️  Forse loggato ma nessuna immagine in questa pagina")
else:
    print("❌ Non loggato - troppi placeholder")
    print("Assicurati di aver fatto login su Firefox prima di esportare i cookie!")
    exit(1)

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
SKIP_NAMES = {"staticon.png","stampa.png","staticonsm.png","804.png","808.png",
              "back.png","next.png","resume.png","edit.png","truei.png","falsei.png"}

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

        for img in soup.find_all("img"):
            src = img.get("src", "")
            if not src or "trasparent" in src:
                continue

            fname_lower = src.split("/")[-1].split("?")[0].lower()
            if fname_lower in SKIP_NAMES:
                continue

            # Prendi solo immagini con contenuto quiz
            is_quiz_img = (
                "imageSolution" in src or
                "/quiz/" in src or
                "/img/q" in src or
                "/domande/" in src
            )
            if not is_quiz_img:
                continue

            if not src.startswith("http"):
                src = BASE + src

            # Testo domanda vicino
            cont = img.find_parent("li") or img.find_parent("div") or img.parent
            testo = cont.get_text(" ", strip=True)[:400] if cont else ""
            real_fname = src.split("/")[-1].split("?")[0]
            if not real_fname:
                real_fname = f"{arg}_{pagina}_{trovate}.jpg"

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

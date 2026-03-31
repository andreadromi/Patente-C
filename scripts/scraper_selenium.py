#!/usr/bin/env python3
"""
Scraper con Selenium per Android/Termux
Richiede: pip install selenium
e chromedriver installato
"""
import os, json, time, base64
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

BASE = "https://www.patentisuperiori.com"

print("=== SCRAPER CON BROWSER ===")
USER = input("Username: ")
PASS = input("Password: ")

# Configura Chrome headless
opts = Options()
opts.add_argument("--headless")
opts.add_argument("--no-sandbox")
opts.add_argument("--disable-dev-shm-usage")
opts.add_argument("--disable-gpu")
opts.add_argument("--window-size=390,844")
opts.add_argument("user-agent=Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36")

driver = webdriver.Chrome(options=opts)
wait = WebDriverWait(driver, 10)

# Login
print("Apro sito...")
driver.get(f"{BASE}/login/registrati.php")
time.sleep(2)

driver.find_element(By.NAME, "username").send_keys(USER)
driver.find_element(By.NAME, "password").send_keys(PASS)
driver.find_element(By.CSS_SELECTOR, "button[type=submit]").click()
time.sleep(2)

# Verifica
if USER.lower() in driver.page_source.lower():
    print("✅ Login OK!")
else:
    print("⚠️  Login incerto, continuo...")

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
    vuote_consecutive = 0

    while pagina <= 200:
        url = f"{BASE}/quiz-patente-c/argomento/{arg}-{pagina}.html"
        driver.get(url)
        time.sleep(1)

        imgs = driver.find_elements(By.CSS_SELECTOR, "img.solutionsImage, #solutionsImage, img[src*='imageSolution'], img[src*='/quiz/']")
        trovate = 0

        for img in imgs:
            src = img.get_attribute("src") or ""
            if not src or "trasparent" in src:
                continue

            # Ottieni domanda vicina
            try:
                container = img.find_element(By.XPATH, "./ancestor::li | ./ancestor::div[@class]")
                testo = container.text[:300]
            except:
                testo = ""

            fname = f"{arg}_{pagina}_{trovate}.png"

            # Scarica immagine tramite JS (evita problemi CORS)
            try:
                img_b64 = driver.execute_script("""
                    var img = arguments[0];
                    var canvas = document.createElement('canvas');
                    canvas.width = img.naturalWidth;
                    canvas.height = img.naturalHeight;
                    canvas.getContext('2d').drawImage(img, 0, 0);
                    return canvas.toDataURL('image/png').split(',')[1];
                """, img)
                if img_b64 and len(img_b64) > 100:
                    with open(f"quiz_images/{fname}", "wb") as f:
                        f.write(base64.b64decode(img_b64))
                    mapping[fname] = {"url": src, "testo": testo}
                    trovate += 1
                    print(f"  ✓ {fname}")
            except Exception as e:
                print(f"  ✗ {e}")

        if trovate == 0:
            vuote_consecutive += 1
            if vuote_consecutive >= 2:
                break
        else:
            vuote_consecutive = 0

        pagina += 1
        time.sleep(0.5)

driver.quit()

with open("quiz_images/mapping.json", "w", encoding="utf-8") as f:
    json.dump(mapping, f, ensure_ascii=False, indent=2)

print(f"\n🎉 {len(mapping)} immagini salvate!")
print("Comprimi: tar -czf quiz_images.tar.gz quiz_images/")

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const https = require('https');

const BASE = 'https://www.patentisuperiori.com';
const USER = 'andreadromi92';
const PASS = '@Div44354';
const GITHUB_TOKEN = process.argv[2] || '';
const REPO = 'andreadromi/Patente-C';

const ARGOMENTI = [
  ['disposizioni-guida-riposo', 'guida_riposo'],
  ['impiego-cronotachigrafo', 'cronotachigrafo'],
  ['disposizioni-trasporto-persone', 'trasporto_persone'],
  ['documenti-circolazione-trasporto', 'documenti'],
  ['comportamento-in-caso-incidente', 'incidente'],
  ['rimozione-sostituzione-ruote', 'ruote'],
  ['dimensione-massa-velocita', 'dimensioni'],
  ['limitazione-campo-visivo', 'visivo'],
  ['responsabilita-persone-trasportate', 'caricamento'],
  ['rimorchi-semirimorchi', 'rimorchi'],
  ['motori-sistemi-alimentazione', 'motori'],
  ['lubrificazione-protezione-gelo', 'lubrificazione'],
  ['pneumatici', 'pneumatici'],
  ['freno-acceleratore', 'freni'],
  ['guasti-sospensioni-ammortizzatori', 'guasti'],
  ['manutenzione-riparazioni', 'manutenzione'],
  ['trasporto-consegna-merci', 'merci'],
];

async function uploadToGithub(fname, content) {
  if (!GITHUB_TOKEN) return;
  const data = JSON.stringify({ message: `Add ${fname}`, content: content.toString('base64') });
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.github.com',
      path: `/repos/${REPO}/contents/public/quiz_images/${fname}`,
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'scraper',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      console.log(`  Upload ${fname}: ${res.statusCode}`);
      resolve();
    });
    req.on('error', (e) => { console.log(`  Upload err ${fname}: ${e.message}`); resolve(); });
    req.write(data);
    req.end();
  });
}

(async () => {
  if (!fs.existsSync('quiz_images')) fs.mkdirSync('quiz_images');
  const mapping = {};

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Documents and Settings\\sshuser\\.cache\\puppeteer\\chrome\\win64-142.0.7444.59\\chrome-win64\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0');

  // Login
  console.log('Login...');
  await page.goto(`${BASE}/login/registrati.php`, { waitUntil: 'networkidle2' });
  await page.type('input[name="username"]', USER);
  await page.type('input[name="password"]', PASS);
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
  console.log('Login fatto!');

  for (const [argUrl, argCode] of ARGOMENTI) {
    console.log(`\nArgomento: ${argCode}`);
    let pagina = 1;
    let vuote = 0;

    while (pagina <= 500) {
      const url = `${BASE}/quiz-patente-c/argomento/${argUrl}-${pagina}.html`;
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});

      // Trova immagine domanda (NON imageSolution, ma img con classe quiz o dentro .pat-question)
      const imgData = await page.evaluate(() => {
        // Cerca immagini che non siano UI elements
        const skip = ['statIcon','stampa','back','next','resume','edit','trueI','falseI','trasparent','logo','mezzi','scorecard','imageSolution'];
        const imgs = Array.from(document.querySelectorAll('img'));
        for (const img of imgs) {
          const src = img.src || '';
          if (skip.some(s => src.includes(s))) continue;
          if (!src || src.endsWith('.gif')) continue;
          // Trova testo vicino
          const container = img.closest('li') || img.closest('.pat-question') || img.closest('div');
          const testo = container ? container.innerText.substring(0, 300) : '';
          return { src, testo, width: img.naturalWidth, height: img.naturalHeight };
        }
        return null;
      });

      if (!imgData || !imgData.src) {
        vuote++;
        if (vuote >= 3) break;
        pagina++;
        continue;
      }

      vuote = 0;
      console.log(`  p${pagina}: ${imgData.src.substring(imgData.src.lastIndexOf('/')+1)} ${imgData.width}x${imgData.height}px`);

      // Screenshot dell'immagine
      const imgElement = await page.$(`img[src="${imgData.src.replace(BASE,'')}"], img[src="${imgData.src}"]`);
      const fname = `${argCode}_${String(pagina).padStart(4,'0')}.png`;

      if (imgElement) {
        try {
          await imgElement.screenshot({ path: `quiz_images/${fname}` });
          const buf = fs.readFileSync(`quiz_images/${fname}`);
          mapping[fname] = { testo: imgData.testo, capitolo: argCode, pagina, src: imgData.src };
          console.log(`  Salvato: ${fname} (${buf.length}B) - ${imgData.testo.substring(0,50)}`);
          if (GITHUB_TOKEN) await uploadToGithub(fname, buf);
        } catch(e) {
          console.log(`  Screenshot err: ${e.message}`);
        }
      }

      pagina++;
      await new Promise(r => setTimeout(r, 300));
    }
  }

  // Salva mapping
  fs.writeFileSync('quiz_images/mapping.json', JSON.stringify(mapping, null, 2), 'utf-8');
  console.log(`\nFINITO! ${Object.keys(mapping).length} immagini`);

  if (GITHUB_TOKEN) {
    await uploadToGithub('mapping.json', Buffer.from(JSON.stringify(mapping, null, 2)));
  }

  await browser.close();
})();

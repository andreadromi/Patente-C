const puppeteer = require('puppeteer');
const fs = require('fs');
const https = require('https');

const BASE = 'https://www.patentisuperiori.com';
const GITHUB_TOKEN = process.argv[2] || '';
const REPO = 'andreadromi/Patente-C';

// Cookie di sessione da Firefox (già loggato)
const COOKIES = [
  { name: 'PHPSESSID', value: '9ef776d21f54a09cb178a77bdfbcb341', domain: 'www.patentisuperiori.com', path: '/' },
  { name: '_ga', value: 'GA1.1.600161829.1774938363', domain: '.patentisuperiori.com', path: '/' },
];

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
  const data = JSON.stringify({ message: `Add ${fname}`, content: Buffer.from(content).toString('base64') });
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
    req.on('error', (e) => { console.log(`  Err ${fname}: ${e.message}`); resolve(); });
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

  // Setta cookies prima di navigare
  await page.goto(BASE, { waitUntil: 'networkidle2' });
  for (const cookie of COOKIES) {
    await page.setCookie(cookie);
  }

  // Verifica login
  await page.goto(`${BASE}/quiz-patente-c/argomento/dimensione-massa-velocita-1.html`, { waitUntil: 'networkidle2' });
  
  // Cerca se c'è il bottone soluzione (indica che siamo loggati)
  const isLogged = await page.evaluate(() => {
    return document.title !== '' && !document.querySelector('.pat-login-form') !== null;
  });
  console.log('Pagina caricata, cerco immagini quiz...');

  // Intercetta le richieste per catturare le immagini reali
  const imgRequests = new Map();
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('imageSolution.php') || 
        (url.includes(BASE) && url.match(/\.(jpg|jpeg|png|gif)/) && 
         !url.match(/statIcon|stampa|back|next|resume|edit|trueI|falseI|trasparent|logo|mezzi/))) {
      try {
        const buf = await response.buffer();
        if (buf.length > 2000) { // Solo immagini grandi (non barre risposta)
          imgRequests.set(url, buf);
        }
      } catch(e) {}
    }
  });

  for (const [argUrl, argCode] of ARGOMENTI) {
    console.log(`\nArgomento: ${argCode}`);
    let pagina = 1;
    let vuote = 0;

    while (pagina <= 500) {
      imgRequests.clear();
      const url = `${BASE}/quiz-patente-c/argomento/${argUrl}-${pagina}.html`;
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
      await new Promise(r => setTimeout(r, 500)); // aspetta JS

      // Clicca su "Soluzione" per rivelare l'immagine
      const solBtn = await page.$('a[href*="soluzione"], button.pat-solution, .pat-sol, a:has-text("Soluzione"), a:has-text("soluzione")').catch(() => null);
      if (solBtn) {
        await solBtn.click().catch(() => {});
        await new Promise(r => setTimeout(r, 800));
      }

      // Guarda le immagini intercettate
      let found = false;
      for (const [imgUrl, buf] of imgRequests.entries()) {
        if (buf.length > 2000) {
          const fname = `${argCode}_${String(pagina).padStart(4,'0')}.png`;
          
          // Testo domanda
          const testo = await page.evaluate(() => {
            const el = document.querySelector('.pat-question, li.uk-open, .quiz-text, p');
            return el ? el.innerText.substring(0, 300) : '';
          }).catch(() => '');

          fs.writeFileSync(`quiz_images/${fname}`, buf);
          mapping[fname] = { testo, capitolo: argCode, pagina, src: imgUrl, size: buf.length };
          console.log(`  OK p${pagina}: ${fname} (${buf.length}B) ${imgUrl.split('/').pop().substring(0,30)}`);
          if (GITHUB_TOKEN) await uploadToGithub(fname, buf);
          found = true;
          break;
        }
      }

      if (!found) {
        vuote++;
        if (vuote >= 3) break;
      } else {
        vuote = 0;
      }

      pagina++;
      await new Promise(r => setTimeout(r, 250));
    }
  }

  fs.writeFileSync('quiz_images/mapping.json', JSON.stringify(mapping, null, 2), 'utf-8');
  console.log(`\nFINITO! ${Object.keys(mapping).length} immagini`);
  if (GITHUB_TOKEN) await uploadToGithub('mapping.json', Buffer.from(JSON.stringify(mapping, null, 2)));

  await browser.close();
})();

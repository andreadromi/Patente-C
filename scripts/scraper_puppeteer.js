const puppeteer = require('puppeteer');
const fs = require('fs');
const https = require('https');

const BASE = 'https://www.patentisuperiori.com';
const USER = 'andreadromi92';
const PASS = '@Div44354';
const GITHUB_TOKEN = process.argv[2] || '';
const REPO = 'andreadromi/Patente-C';
const CHROME = 'C:\\Documents and Settings\\sshuser\\.cache\\puppeteer\\chrome\\win64-142.0.7444.59\\chrome-win64\\chrome.exe';

async function uploadToGithub(fname, content) {
  if (!GITHUB_TOKEN) return;
  const data = JSON.stringify({ message: `Add ${fname}`, content: Buffer.from(content).toString('base64') });
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.github.com',
      path: `/repos/${REPO}/contents/public/quiz_images/${fname}`,
      method: 'PUT',
      headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Content-Type': 'application/json', 'User-Agent': 'scraper', 'Content-Length': Buffer.byteLength(data) }
    }, (res) => { console.log(`  Upload ${fname}: ${res.statusCode}`); resolve(); });
    req.on('error', () => resolve());
    req.write(data); req.end();
  });
}

(async () => {
  if (!fs.existsSync('quiz_images')) fs.mkdirSync('quiz_images');
  const mapping = {};

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: CHROME,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0');
  await page.setViewport({ width: 1280, height: 900 });

  // LOGIN via fetch diretto nella pagina
  console.log('Login...');
  await page.goto(`${BASE}/login/registrati.php`, { waitUntil: 'networkidle2' });
  
  // Usa fetch dalla pagina per fare il POST con i cookie
  const loginResult = await page.evaluate(async (user, pass, base) => {
    const body = new URLSearchParams();
    body.append('username', user);
    body.append('password', pass);
    body.append('tryToLog', 'true');
    body.append('menu_login', 'true');
    const r = await fetch(base + '/login/registrati.php', {
      method: 'POST',
      body: body,
      credentials: 'include',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    const text = await r.text();
    return {
      ok: r.ok,
      url: r.url,
      hasLogout: text.toLowerCase().includes('logout'),
      hasUser: text.toLowerCase().includes(user.toLowerCase()),
      snippet: text.substring(0, 200)
    };
  }, USER, PASS, BASE);
  
  console.log('Login result:', JSON.stringify(loginResult));
  
  // Ricarica la pagina per applicare i cookie
  await page.reload({ waitUntil: 'networkidle2' });
  
  const isLogged = loginResult.hasLogout || loginResult.hasUser;
  console.log(`Login: ${isLogged ? 'OK ✓' : 'FALLITO'}`);

  // Test: vai su una pagina quiz con immagine nota e vedi cosa c'è
  await page.goto(`${BASE}/quiz-patente-c/argomento/dimensione-massa-velocita-1.html`, { waitUntil: 'networkidle2' });
  
  const testImgs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('img')).map(img => ({
      src: img.src, w: img.naturalWidth, h: img.naturalHeight
    })).filter(i => i.w > 0 && i.h > 0 && i.w !== 516); // escludi logo 516px
  });
  console.log(`Immagini non-logo trovate nella pagina test: ${testImgs.length}`);
  testImgs.forEach(i => console.log(`  ${i.w}x${i.h} ${i.src.split('/').pop().substring(0,40)}`));

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

  for (const [argUrl, argCode] of ARGOMENTI) {
    console.log(`\nArgomento: ${argCode}`);
    let pagina = 1;
    let vuote = 0;

    while (pagina <= 500) {
      await page.goto(`${BASE}/quiz-patente-c/argomento/${argUrl}-${pagina}.html`, { waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
      await new Promise(r => setTimeout(r, 600));

      // Cerca immagini che non siano il logo (516px wide), non siano icone UI
      const quizImgs = await page.evaluate(() => {
        const SKIP_SRCS = ['statIcon','stampa','back','next','resume','edit','trueI','falseI','trasparent','mezzi','scorecard'];
        return Array.from(document.querySelectorAll('img'))
          .map(img => ({ src: img.src, w: img.naturalWidth, h: img.naturalHeight }))
          .filter(i => {
            if (!i.src || i.w === 0) return false;
            if (i.w === 516 && i.h === 68) return false; // logo
            if (SKIP_SRCS.some(s => i.src.includes(s))) return false;
            if (i.w < 50 || i.h < 50) return false; // troppo piccola
            return true;
          });
      });

      if (quizImgs.length === 0) {
        vuote++;
        if (vuote >= 3) break;
        pagina++;
        continue;
      }

      vuote = 0;
      const img = quizImgs[0];
      const fname = `${argCode}_${String(pagina).padStart(4,'0')}.png`;

      // Screenshot dell'elemento immagine
      try {
        const el = await page.$(`img[src="${img.src}"]`);
        if (el) {
          await el.screenshot({ path: `quiz_images/${fname}` });
          const buf = fs.readFileSync(`quiz_images/${fname}`);
          
          // Testo domanda
          const testo = await page.evaluate(() => {
            for (const sel of ['.pat-question', 'li.uk-open p', 'form p', 'p']) {
              const el = document.querySelector(sel);
              if (el && el.innerText && el.innerText.length > 20) return el.innerText.substring(0, 300);
            }
            return '';
          });

          mapping[fname] = { testo, capitolo: argCode, pagina, src: img.src, size: buf.length, dims: `${img.w}x${img.h}` };
          console.log(`  OK p${pagina}: ${fname} (${buf.length}B) ${img.w}x${img.h} - ${testo.substring(0,40)}`);
          if (GITHUB_TOKEN) await uploadToGithub(fname, buf);
        }
      } catch(e) {
        console.log(`  ERR p${pagina}: ${e.message}`);
      }

      pagina++;
      await new Promise(r => setTimeout(r, 250));
    }
  }

  fs.writeFileSync('quiz_images/mapping.json', JSON.stringify(mapping, null, 2));
  console.log(`\nFINITO! ${Object.keys(mapping).length} immagini`);
  if (GITHUB_TOKEN) await uploadToGithub('mapping.json', Buffer.from(JSON.stringify(mapping, null, 2)));

  await browser.close();
})();

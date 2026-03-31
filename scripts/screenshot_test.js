const puppeteer = require('puppeteer');
const fs = require('fs');

const BASE = 'https://www.patentisuperiori.com';
const USER = 'andreadromi92';
const PASS = '@Div44354';
const CHROME = 'C:\\Documents and Settings\\sshuser\\.cache\\puppeteer\\chrome\\win64-142.0.7444.59\\chrome-win64\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    headless: true, executablePath: CHROME,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0');

  // Login via fetch
  await page.goto(`${BASE}/login/registrati.php`, { waitUntil: 'networkidle2' });
  await page.evaluate(async (user, pass, base) => {
    const body = new URLSearchParams();
    body.append('username', user); body.append('password', pass);
    body.append('tryToLog', 'true'); body.append('menu_login', 'true');
    await fetch(base + '/login/registrati.php', { method: 'POST', body, credentials: 'include', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
  }, USER, PASS, BASE);

  await page.reload({ waitUntil: 'networkidle2' });
  console.log('Login fatto');

  // Vai su una pagina con segnale raffigurato (argomento dimensioni che ha segnali)
  // Prova diverse pagine finché non trovi un'immagine
  for (let i = 1; i <= 20; i++) {
    await page.goto(`${BASE}/quiz-patente-c/argomento/dimensione-massa-velocita-${i}.html`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    
    // Screenshot della pagina intera
    await page.screenshot({ path: `page_${i}.png`, fullPage: true });
    
    // Log tutte le immagini
    const imgs = await page.evaluate(() => 
      Array.from(document.querySelectorAll('img'))
        .map(img => `${img.naturalWidth}x${img.naturalHeight} ${img.src.split('/').pop().substring(0,50)}`)
    );
    console.log(`Pagina ${i}:`, imgs.join(' | '));
    
    // Se c'è un'immagine interessante fermati
    const hasInteresting = imgs.some(s => !s.includes('statIcon') && !s.includes('stampa') && 
      !s.includes('back') && !s.includes('next') && !s.includes('resume') && 
      !s.includes('edit') && !s.includes('trueI') && !s.includes('falseI') && 
      !s.includes('trasparent') && !s.includes('logo') && !s.includes('356x9'));
    if (hasInteresting) {
      console.log('TROVATA IMMAGINE INTERESSANTE a pagina', i);
      break;
    }
  }
  
  await browser.close();
})();

# CONTESTO PER NUOVA CHAT - Simulatore Patente C

## APP LIVE
- URL: https://patente-c.vercel.app
- Repository: https://github.com/andreadromi/Patente-C
- Deploy: automatico su push a main (Vercel)

## CREDENZIALI E ACCESSI
- GitHub user: andreadromi
- GitHub token: IL_TUO_TOKEN_GITHUB (revoca dopo uso!)
- Vercel: account andreadromi
- DB Neon PostgreSQL: ep-noisy-firefly-agmg9wok-pooler.c-2.eu-central-1.aws.neon.tech
- JWT_SECRET: patente-c-quiz-andrea-2026-segreto
- Admin login: username=admin password=Admin2025 → /admin/login
- patentisuperiori.com: andreadromi92 / @Div44354

## PC WINDOWS REMOTO (SSH invisibile)
- IP Tailscale: 100.68.241.29
- User: sshuser / Pass: SshPass2024!
- Connessione: ssh sshuser@100.68.241.29 (dopo aver attivato Tailscale sul telefono)
- Comandi dal telefono via Termux
- Sul PC NON si vede nulla sullo schermo

## PUSH SU GITHUB DAL PC
```cmd
git config --global user.email "andrea.dromi@onviewstudio.com"
git config --global user.name "andreadromi"
git push https://andreadromi:TOKEN@github.com/andreadromi/Patente-C.git
```

## STACK TECNICO APP
- Next.js + TypeScript, Prisma, PostgreSQL Neon, Tailwind CSS
- Lucide React icons, deploy Vercel
- Seed DB: GitHub Actions workflow manuale (.github/workflows/seed.yml)
- 3.073 domande Vero/Falso, 68 simulazioni tematiche

## COSA MANCA: IMMAGINI QUIZ
- ~272 domande hanno immagini (segnali stradali, pannelli ADR, schemi)
- Il sito patentisuperiori.com carica le immagini via JavaScript
- imageSolution.php = barra visuale risposte (NON l'immagine della domanda)
- Le immagini reali delle domande si vedono nel browser loggato
- Puppeteer installato sul PC con Chrome in cache:
  C:\Documents and Settings\sshuser\.cache\puppeteer\chrome\win64-142.0.7444.59\chrome-win64\chrome.exe
- Node.js v24, npm, puppeteer installati in C:\Users\sshuser\
- Script scraper_new.js già sul PC con login funzionante (via fetch)
- Script sstest.js DA SCARICARE:
  powershell -Command "Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/andreadromi/Patente-C/main/scripts/screenshot_test.js' -OutFile 'sstest.js'"

## PROSSIMO PASSO
1. Connettiti SSH al PC
2. Scarica sstest.js e eseguilo: node sstest.js
3. Carica gli screenshot page_1.png etc su GitHub per vederli
4. Capire la struttura HTML delle domande con immagini
5. Scraper definitivo

## STRUTTURA APP (pagine principali)
- /login — login con solo username
- /dashboard — carosello quiz con frecce
- /simulations/[id] — quiz 40 domande
- /user-simulations/[userSimId]/report — risultati
- /riepilogo — griglia 5 col tutti i 68 quiz
- /focus — lista argomenti tematici con progress
- /weak-points — punti deboli
- /weak-points/practice — allenamento punti deboli

## DESIGN SYSTEM
- Background: #030712, Card: #0C111D, Border: #1F2937
- Accent blu: #2563EB, Verde: #4ADE80, Rosso: #F87171
- Zero emoji, solo icone Lucide
- Bottom nav: Home / Focus / Riepilogo / Punti deboli
- Auto-avanzamento quiz: 0.9s corretto, 1.8s sbagliato

## COSA C'È DA SISTEMARE (TODO)
- [ ] Immagini quiz (principale problema aperto)
- [ ] Verificare nav a 4 voci su weak-points/practice
- [ ] Revocare token GitHub esposto in chat

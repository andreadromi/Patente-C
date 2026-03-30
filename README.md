# Patente C - Simulatore Esame

Simulatore web per l'esame di teoria della **Patente C (camion)**.

🌐 **Deploy**: collega questo repo a Vercel

## Come funziona

- **3.241 domande** ministeriali Vero/Falso dai 17 capitoli ufficiali
- **41 simulazioni** da 40 domande senza mai ripetere
- **40 minuti** di tempo, max **4 errori** per essere promossi
- **Punti deboli**: traccia gli errori e allenati su di essi (3 risposte corrette = eliminato)
- Login con solo username (nessuna password per gli utenti)

## Setup

```bash
npm install
cp .env.example .env
# Aggiungi DATABASE_URL e JWT_SECRET nel .env

npx prisma db push
npm run db:seed   # Importa tutte le 3.241 domande
npm run dev
```

## Deploy su Vercel

1. Collega questo repo su vercel.com
2. Aggiungi le variabili d'ambiente: `DATABASE_URL`, `JWT_SECRET`
3. Deploy → poi esegui una volta: `npx prisma db push` e `npm run db:seed`

## Credenziali admin

- URL: `/admin/login`
- Username: `admin`
- Password: `Admin2025`

## Stack

- Next.js 15 + TypeScript
- PostgreSQL (Neon) + Prisma
- Tailwind CSS
- Vercel

## Variabili d'ambiente

Aggiungi su Vercel → Settings → Environment Variables:

```
DATABASE_URL=postgresql://neondb_owner:npg_biZDsIB0rH5m@ep-noisy-firefly-agmg9wok-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=patente-c-quiz-andrea-2026-segreto
```

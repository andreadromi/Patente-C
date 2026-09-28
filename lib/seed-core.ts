import type { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import * as fs from 'fs'
import * as path from 'path'
import { PRIMO_NUMERO_MANUALE, materialeSimulazione } from './esame-generato'

/**
 * Logica di popolamento condivisa fra lo script `prisma/seed.ts`
 * e la rotta `/api/admin/seed`.
 *
 * Sorgenti dei dati (cartella `data/`), tutte ricavate dal listato
 * ministeriale dei quiz per la patente C/CE da `scripts/archivio_scrivi.py`:
 *  - `argomenti.json`   → gli argomenti dell'esame (codice, nome, quante domande escono)
 *  - `import_*.json`    → le domande, una per riga, col codice del listato
 *  - `simulations.json` → le simulazioni fisse, come liste di codici
 */

export interface ImportedQuestion {
  argomentoCode: string
  code: string
  questionGroup?: string | null
  text: string
  risposta: boolean
  image?: string | null
}

export interface ArgomentoSeed {
  code: string
  name: string
  nEsame: number
}

export interface SimulationSeed {
  number: number
  titolo?: string
  /** Codici delle domande (40), gli stessi del listato. */
  domande: string[]
}

const dataDir = () => path.join(process.cwd(), 'data')

const readJson = <T>(file: string): T =>
  JSON.parse(fs.readFileSync(path.join(dataDir(), file), 'utf-8'))

export function readArgomenti(): ArgomentoSeed[] {
  return readJson<{ argomenti: ArgomentoSeed[] }>('argomenti.json').argomenti
}

/** Legge tutti i `data/import_*.json` in ordine alfabetico. */
export function readImportedQuestions(): ImportedQuestion[] {
  const files = fs.readdirSync(dataDir())
    .filter(f => f.startsWith('import_') && f.endsWith('.json'))
    .sort()
  return files.flatMap(f => readJson<ImportedQuestion[]>(f))
}

export function readSimulations(): SimulationSeed[] {
  return readJson<SimulationSeed[]>('simulations.json')
}

/**
 * L'utente `admin`, con la password della variabile ADMIN_PASSWORD. La
 * password non sta nel codice: chiunque lo legga entrerebbe nel pannello.
 * Si riscrive a ogni seed, così per cambiarla basta cambiare la variabile.
 * Senza variabile l'admin non si crea (e uno già esistente resta com'è).
 */
export async function seedAdmin(prisma: PrismaClient): Promise<boolean> {
  const password = process.env.ADMIN_PASSWORD?.trim()
  if (!password) return false
  const hash = await bcrypt.hash(password, 10)
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: { password: hash, isAdmin: true },
    create: { username: 'admin', password: hash, isAdmin: true },
  })
  return true
}

/**
 * Riscrive gli argomenti dell'esame dal file e restituisce la mappa code → id.
 * L'id è la posizione nel file, cioè l'ordine della scheda: un argomento che
 * cambia posto cambia id, per questo si chiama solo con l'archivio vuoto.
 */
async function seedArgomenti(prisma: PrismaClient): Promise<Record<string, number>> {
  const argomenti = readArgomenti()
  await prisma.argomento.deleteMany()
  await prisma.argomento.createMany({
    data: argomenti.map((a, i) => ({ id: i + 1, code: a.code, name: a.name, nEsame: a.nEsame })),
  })
  return Object.fromEntries(argomenti.map((a, i) => [a.code, i + 1]))
}

/**
 * Sostituisce l'intero archivio (argomenti e domande) con i file di `data/`.
 * Presuppone che le tabelle dipendenti (answer, weakPoint, simulazioni...)
 * siano già state svuotate dal chiamante.
 */
export async function seedQuestions(prisma: PrismaClient): Promise<number> {
  await prisma.question.deleteMany()
  const idPerCodice = await seedArgomenti(prisma)
  const questions = readImportedQuestions()

  const rows = questions
    .filter(q => idPerCodice[q.argomentoCode])
    .map(q => ({
      code: q.code,
      argomentoId: idPerCodice[q.argomentoCode],
      text: q.text,
      risposta: q.risposta,
      questionGroup: q.questionGroup || null,
      image: q.image || null,
    }))

  for (let i = 0; i < rows.length; i += 500) {
    await prisma.question.createMany({ data: rows.slice(i, i + 500) })
  }
  return prisma.question.count()
}

/**
 * Ricostruisce le simulazioni fisse collegandole alle domande presenti a DB.
 * Usa `upsert` sul numero della simulazione: gli id restano stabili e lo
 * storico degli utenti (UserSimulation) non viene perso.
 */
export async function seedSimulations(prisma: PrismaClient): Promise<{ created: number; skipped: number[]; rimosse: number }> {
  const simData = readSimulations()

  // Simulazioni rimaste da un archivio precedente: puntando a domande non più
  // esistenti comparirebbero negli elenchi senza potersi aprire.
  const rimosse = await rimuoviSimulazioniObsolete(prisma, simData.map(s => s.number))
  const righe = await prisma.question.findMany({ select: { id: true, code: true } })
  const perCodice = new Map(righe.map(r => [r.code, r]))

  let created = 0
  const skipped: number[] = []
  for (const sim of simData) {
    const scelte = sim.domande.map(c => perCodice.get(c)).filter((d): d is NonNullable<typeof d> => !!d)
    if (scelte.length < sim.domande.length) { skipped.push(sim.number); continue }

    const data = {
      tipo: 'simulazione',
      titolo: sim.titolo || `Simulazione ${sim.number}`,
      ...materialeSimulazione(scelte),
    }
    await prisma.simulation.upsert({
      where: { number: sim.number },
      update: data,
      create: { number: sim.number, ...data },
    })
    created++
  }
  return { created, skipped, rimosse }
}

/** Cancella le simulazioni che non stanno più in `simulations.json`. */
async function rimuoviSimulazioniObsolete(prisma: PrismaClient, numeriValidi: number[]) {
  const obsolete = await prisma.simulation.findMany({
    // gli esami generati non stanno nel file: sono degli utenti, non
    // dell'archivio; e nemmeno le simulazioni create a mano dall'admin
    where: { generata: false, number: { notIn: numeriValidi, lt: PRIMO_NUMERO_MANUALE } },
    select: { id: true },
  })
  if (!obsolete.length) return 0

  const ids = obsolete.map(s => s.id)
  // Prima lo storico che vi si appoggia, altrimenti le chiavi esterne bloccano
  const tentativi = await prisma.userSimulation.findMany({
    where: { simulationId: { in: ids } },
    select: { id: true },
  })
  if (tentativi.length) {
    const tIds = tentativi.map(t => t.id)
    await prisma.answer.deleteMany({ where: { userSimulationId: { in: tIds } } })
    await prisma.argomentoResult.deleteMany({ where: { userSimulationId: { in: tIds } } })
    await prisma.userSimulation.deleteMany({ where: { id: { in: tIds } } })
  }
  await prisma.simulation.deleteMany({ where: { id: { in: ids } } })
  return obsolete.length
}

/**
 * Cancella lo storico degli utenti, necessario prima di rimpiazzare le
 * domande: tutto quello che vi punta. Anche le simulazioni fisse, che il seed
 * ricostruisce subito dopo: le create a mano dall'admin puntano a domande che
 * stanno per sparire e non si potrebbero più aprire.
 */
export async function clearUserData(prisma: PrismaClient) {
  await prisma.argomentoResult.deleteMany()
  await prisma.answer.deleteMany()
  await prisma.userSimulation.deleteMany()
  await prisma.simulation.deleteMany()
  await prisma.weakPoint.deleteMany()
  // Anche l'avanzamento nello Studio: le risposte salvate puntano a domande
  // che stanno per essere sostituite, quindi non varrebbero più nulla.
  await prisma.focusProgress.deleteMany()
}

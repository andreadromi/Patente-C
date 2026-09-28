/**
 * Controlla l'archivio in data/ come lo legge il seed, con le regole
 * dell'app:
 *
 * - gli argomenti danno insieme 40 domande alla scheda, e ognuno ne ha
 *   almeno quante gliene chiede l'esame; ognuno ha la sua icona;
 * - ogni domanda ha un codice unico, un testo, una risposta V/F e un
 *   argomento che esiste; le figure stanno in public/figure/;
 * - ogni domanda sta in una e una sola simulazione fissa: nessuna resta
 *   fuori, nessuna si ripete, nessuna simulazione supera le 40 domande.
 *
 * Uso: npm run verifica
 */
import * as fs from 'fs'
import * as path from 'path'
import { readArgomenti, readImportedQuestions, readSimulations } from '../lib/seed-core'
import { DOMANDE_PER_ESAME } from '../lib/esame'
import { CODICI_ARGOMENTI } from '../lib/argomenti'

const problemi: string[] = []
const argomenti = readArgomenti()
const domande = readImportedQuestions()
const sims = readSimulations()

const codiciArgomenti = new Set(argomenti.map(a => a.code))
if (codiciArgomenti.size !== argomenti.length) problemi.push('argomenti.json: codici doppi')
const somma = argomenti.reduce((n, a) => n + a.nEsame, 0)
if (somma !== DOMANDE_PER_ESAME) problemi.push(`gli argomenti danno ${somma} domande alla scheda, non ${DOMANDE_PER_ESAME}`)
for (const a of argomenti) {
  if (!CODICI_ARGOMENTI.includes(a.code)) problemi.push(`argomento ${a.code}: manca l'icona in lib/argomenti.ts`)
  const n = domande.filter(d => d.argomentoCode === a.code).length
  if (n < a.nEsame) problemi.push(`argomento ${a.code}: ${n} domande, l'esame ne chiede ${a.nEsame}`)
}

const codici = new Set<string>()
for (const d of domande) {
  if (codici.has(d.code)) problemi.push(`codice doppio: ${d.code}`)
  codici.add(d.code)
  if (!codiciArgomenti.has(d.argomentoCode)) problemi.push(`${d.code}: argomento ${d.argomentoCode} inesistente`)
  if (!d.text?.trim()) problemi.push(`${d.code}: testo vuoto`)
  if (typeof d.risposta !== 'boolean') problemi.push(`${d.code}: risposta non V/F`)
  if (d.image && !fs.existsSync(path.join(process.cwd(), 'public', 'figure', d.image)))
    problemi.push(`${d.code}: manca la figura public/figure/${d.image}`)
}

const volte = new Map<string, number>()
for (const s of sims) {
  if (s.domande.length > DOMANDE_PER_ESAME) problemi.push(`simulazione ${s.number}: ${s.domande.length} domande`)
  for (const c of s.domande) {
    if (!codici.has(c)) problemi.push(`simulazione ${s.number}: la domanda ${c} non esiste`)
    volte.set(c, (volte.get(c) ?? 0) + 1)
  }
}
const fuori = [...codici].filter(c => !volte.has(c))
const ripetute = [...volte].filter(([, n]) => n > 1).map(([c]) => c)
if (fuori.length) problemi.push(`${fuori.length} domande in nessuna simulazione: ${fuori.slice(0, 20).join(', ')}`)
if (ripetute.length) problemi.push(`${ripetute.length} domande ripetute: ${ripetute.slice(0, 20).join(', ')}`)

if (problemi.length) {
  console.error('❌ Archivio:')
  for (const p of problemi.slice(0, 100)) console.error('  -', p)
  process.exit(1)
}
console.log(`✅ ${argomenti.length} argomenti (${somma} domande a scheda), ${domande.length} domande, ${sims.length} simulazioni: ogni domanda in una sola`)

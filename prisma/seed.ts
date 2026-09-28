import { PrismaClient } from '@prisma/client'
import type { ImportedQuestion } from '../lib/seed-core'
import { clearUserData, readArgomenti, readImportedQuestions, readSimulations, seedAdmin, seedQuestions, seedSimulations } from '../lib/seed-core'
import { PRIMO_NUMERO_MANUALE } from '../lib/esame-generato'

const prisma = new PrismaClient()

/**
 * Il DB è allineato a `data/` se ha gli stessi argomenti, nello stesso ordine
 * e con le stesse quote, e esattamente le stesse domande: stesso numero,
 * quesito, testo, risposta, argomento e figura.
 *
 * Il confronto è esatto e si fa in memoria: sono qualche migliaio di righe, e farlo in SQL
 * richiederebbe un ordinamento, che fra la collation di Postgres e quella di
 * JavaScript può differire sugli accenti — una falsa differenza qui
 * cancellerebbe lo storico degli utenti a ogni deploy.
 */
async function archivioAllineato(attese: ImportedQuestion[]) {
  const argomenti = readArgomenti()
  const aDbArgomenti = await prisma.argomento.findMany({ orderBy: { id: 'asc' } })
  const chiaveArg = (a: { code: string; name: string; nEsame: number }, i: number) => `${i}\u0000${a.code}\u0000${a.name}\u0000${a.nEsame}`
  if (aDbArgomenti.map((a, i) => chiaveArg(a, i)).join('\n') !== argomenti.map((a, i) => chiaveArg(a, i)).join('\n')) return false

  const righe = await prisma.question.findMany({
    select: { code: true, quesito: true, text: true, risposta: true, image: true, argomento: { select: { code: true } } },
  })
  if (righe.length !== attese.length) return false
  const chiave = (q: { code: string; quesito: number; text: string; risposta: boolean; image?: string | null }, argomento: string) =>
    [q.code, q.quesito, q.text, q.risposta, q.image || '', argomento].join('\u0000')
  const aDb = new Set(righe.map(r => chiave(r, r.argomento.code)))
  return attese.every(q => aDb.has(chiave(q, q.argomentoCode)))
}

async function main() {
  const qCount = await prisma.question.count()
  const sCount = await prisma.simulation.count({ where: { generata: false } })
  console.log(`DB: ${qCount} domande, ${sCount} simulazioni`)

  // Admin: la password viene da ADMIN_PASSWORD, mai dal codice
  console.log(await seedAdmin(prisma)
    ? '✅ Admin aggiornato (password da ADMIN_PASSWORD)'
    : 'ℹ️  ADMIN_PASSWORD non impostata: nessun admin creato o modificato')

  const attese = readImportedQuestions()
  const forzato = process.env.FORCE_RESET === 'true'
  const allineato = !forzato && await archivioAllineato(attese)

  // FORCE_RESET serve una volta sola, per rimettere in riga un DB che il
  // confronto non riesce a riconoscere. Lasciato acceso cancella lo storico
  // a ogni deploy, in silenzio: qui almeno lo dice, e il log del build è
  // l'unico posto dove ci si accorge che è rimasto lì.
  if (forzato) {
    console.log('⚠️  FORCE_RESET è attivo: questo deploy cancella risposte, punti deboli,')
    console.log('⚠️  avanzamento dello Studio ed esami generati di tutti gli utenti.')
    console.log('⚠️  Toglilo dalle variabili d\'ambiente: senza, l\'archivio si riallinea da solo')
    console.log('⚠️  quando cambia davvero, e lo storico resta.')
  }

  if (!allineato) {
    // Il DB non corrisponde all'archivio (prima installazione, oppure archivio
    // aggiornato dopo un merge): va riscritto, altrimenti le correzioni alle
    // domande non arrivano mai all'utente. Lo storico delle risposte non può
    // sopravvivere, perché le domande a cui puntava vengono sostituite.
    console.log(forzato
      ? '🔄 FORCE_RESET attivo — reimporto l\'archivio...'
      : `🔄 Archivio disallineato (a DB ${qCount} domande, attese ${attese.length}) — riallineo...`)
    await clearUserData(prisma)
    const total = await seedQuestions(prisma)
    console.log(`✅ ${total} domande importate da data/import_*.json`)
    const { created, skipped, rimosse } = await seedSimulations(prisma)
    console.log(`✅ ${created} simulazioni ricostruite${rimosse ? `, ${rimosse} obsolete rimosse` : ''}${skipped.length ? ` (saltate: ${skipped.join(', ')})` : ''}`)
    console.log('🎉 Allineamento completato!')
    return
  }

  // Archivio a posto: restano da sistemare le simulazioni mancanti, quelle
  // scollegate dalle domande (`questions: '[]'`) e quelle di troppo, rimaste
  // da un archivio precedente. Il confronto è sul numero atteso, non su una
  // soglia fissa: con più simulazioni del previsto un `<` non se ne accorge.
  // Quelle create a mano dall'admin non stanno nel file e non si contano.
  const simAttese = readSimulations().length
  const sFisse = await prisma.simulation.count({ where: { generata: false, number: { lt: PRIMO_NUMERO_MANUALE } } })
  const brokenSims = await prisma.simulation.count({ where: { questions: '[]' } })
  if (sFisse !== simAttese || brokenSims > 0) {
    const { created, skipped, rimosse } = await seedSimulations(prisma)
    console.log(`✅ ${created} simulazioni ricostruite${rimosse ? `, ${rimosse} obsolete rimosse` : ''}${skipped.length ? ` (saltate: ${skipped.join(', ')})` : ''}`)
  } else {
    console.log('✅ DB allineato all\'archivio — nulla da fare')
  }

  console.log('🎉 Seed completato!')
}

main().catch(e => { console.error('❌ Seed error:', e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())

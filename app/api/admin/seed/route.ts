import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { clearUserData, seedAdmin, seedQuestions, seedSimulations, readImportedQuestions, readSimulations } from '@/lib/seed-core'

// Questa rotta, con force, cancella risposte e punti deboli e reimporta
// l'archivio: e' esposta su internet come tutto il resto dell'app. Un valore
// di ripiego scritto qui dentro non e' una chiave, e' una porta con la
// serratura disegnata sopra. Senza SEED_TOKEN configurato la rotta non
// esiste: il seed del deploy fa gia' lo stesso lavoro da solo.
const TOKEN = (process.env.SEED_TOKEN || '').trim()

export async function POST(request: NextRequest) {
  if (!TOKEN) return NextResponse.json({ error: 'Non disponibile' }, { status: 404 })
  const { token, force } = await request.json().catch(() => ({}))
  if (token !== TOKEN) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  try {
    const attese = readImportedQuestions().length
    const simAttese = readSimulations().length
    const qCount = await prisma.question.count()
    const sCount = await prisma.simulation.count({ where: { generata: false } })
    const brokenSims = await prisma.simulation.count({ where: { questions: '[]' } })

    // Skip se l'archivio è già quello ufficiale e le simulazioni sono collegate
    if (!force && qCount === attese && sCount >= simAttese && brokenSims === 0) {
      return NextResponse.json({ message: 'Già completo', domande: qCount, simulazioni: sCount })
    }

    // Admin: la password viene da ADMIN_PASSWORD, mai dal codice
    await seedAdmin(prisma)

    // Archivio domande: reimporta se non corrisponde a data/import_*.json
    let domande = qCount
    if (force || qCount !== attese) {
      await clearUserData(prisma)
      domande = await seedQuestions(prisma)
    }

    // Simulazioni: sempre ricostruite se le domande sono cambiate
    const { created, skipped } = await seedSimulations(prisma)

    return NextResponse.json({
      success: true,
      domande,
      simulazioni: created,
      saltate: skipped,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

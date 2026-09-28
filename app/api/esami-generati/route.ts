import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { DURATA_ESAME } from '@/lib/esame'
import { caricaDomandeEVolte, coperturaPerArgomento, creaEsame } from '@/lib/esame-generato'

/** Gli esami reali dell'utente e quanta parte dell'archivio ha affrontato. */
export async function GET() {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const [{ domande, volte }, esami, argomentiDb] = await Promise.all([
    caricaDomandeEVolte(prisma, user.userId),
    prisma.simulation.findMany({
      where: { generata: true, userId: user.userId },
      orderBy: { number: 'desc' },
      select: { id: true, number: true, titolo: true, tipo: true },
    }),
    // stessi nomi e stesso ordine di Focus, quelli a DB
    prisma.argomento.findMany({ orderBy: { id: 'asc' }, select: { code: true, name: true } }),
  ])

  const perArgomento = coperturaPerArgomento(domande, volte)
  const argomenti = argomentiDb
    .filter(a => perArgomento[a.code])
    .map(a => ({ code: a.code, name: a.name, ...perArgomento[a.code] }))
  const affrontate = argomenti.reduce((n, a) => n + a.affrontate, 0)
  const totale = argomenti.reduce((n, a) => n + a.totale, 0)

  return NextResponse.json({ esami, copertura: { affrontate, totale, argomenti } })
}

/**
 * Un Esame reale nuovo. Se ce n'è uno lasciato a metà e non ancora scaduto si
 * riprende quello: altrimenti ogni tocco sul pulsante ne aprirebbe un altro e
 * l'elenco si riempirebbe di esami abbandonati.
 */
export async function POST() {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const aMeta = await prisma.userSimulation.findFirst({
    where: {
      userId: user.userId, status: 'IN_PROGRESS',
      startedAt: { gt: new Date(Date.now() - DURATA_ESAME * 1000) },
      simulation: { generata: true },
    },
    orderBy: { startedAt: 'desc' },
    select: { simulationId: true, simulation: { select: { titolo: true } } },
  })
  if (aMeta) return NextResponse.json({ id: aMeta.simulationId, titolo: aMeta.simulation.titolo, ripreso: true })
  // Composto ma mai aperto (due tocchi di fila, o si è tornati indietro prima
  // che la pagina d'esame partisse): è ancora nuovo, si usa quello
  const maiAperto = await prisma.simulation.findFirst({
    where: { generata: true, userId: user.userId, userSimulations: { none: {} } },
    orderBy: { number: 'desc' },
    select: { id: true, titolo: true },
  })
  if (maiAperto) return NextResponse.json({ id: maiAperto.id, titolo: maiAperto.titolo, ripreso: true })

  try {
    const esame = await creaEsame(prisma, user.userId)
    return NextResponse.json({ id: esame.id, titolo: esame.titolo, ripreso: false })
  } catch (e: unknown) {
    console.error('Errore esame generato:', e)
    return NextResponse.json({ error: 'Impossibile comporre l\'esame: ' + (e as Error).message }, { status: 500 })
  }
}

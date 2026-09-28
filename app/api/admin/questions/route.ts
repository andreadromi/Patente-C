import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

/**
 * Tutte le domande dell'archivio, nell'ordine del listato: la pagina admin le
 * cerca e le sfoglia da sé. Nessun tetto: con un limite fisso metà
 * dell'archivio sparirebbe dalla pagina senza avvisi.
 *
 * Solo lettura: l'archivio sta in data/ e il seed ce lo riallinea a ogni
 * deploy. Una domanda cambiata o tolta da qui farebbe sembrare il DB diverso
 * dall'archivio, e il deploy successivo lo reimporterebbe da capo, storico
 * degli utenti compreso.
 */
export async function GET() {
  const user = await requireAuth()
  if (!user?.isAdmin) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  const questions = await prisma.question.findMany({
    orderBy: [{ argomentoId: 'asc' }, { code: 'asc' }],
    select: { id: true, code: true, quesito: true, text: true, risposta: true, image: true, argomento: { select: { code: true, name: true } } },
  })
  return NextResponse.json({ questions })
}

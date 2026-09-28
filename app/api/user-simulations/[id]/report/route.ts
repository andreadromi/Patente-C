import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ERRORI_AMMESSI, valuta } from '@/lib/esame'

// Stessa regola di complete/route.ts per decidere se l'esame è superato:
// la correzione viene da lib/esame.ts, per entrambe.

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const userSim = await prisma.userSimulation.findUnique({
    where: { id },
    include: { simulation: true, answers: true },
  })

  if (!userSim || userSim.userId !== user.userId)
    return NextResponse.json({ error: 'Non trovato' }, { status: 404 })

  // Tutte le domande della scheda, nell'ordine in cui sono uscite: anche
  // quelle in bianco compaiono, come sbagliate, altrimenti un esame chiuso
  // senza risposte mostrerebbe un report vuoto.
  const questionIds: string[] = userSim.questionOrder
    ? JSON.parse(userSim.questionOrder)
    : JSON.parse(userSim.simulation.questions)
  const domande = await prisma.question.findMany({
    where: { id: { in: questionIds } },
    include: { argomento: true },
  })
  const perId = new Map(domande.map(q => [q.id, q]))
  const ordinate = questionIds.map(qid => perId.get(qid)).filter((q): q is NonNullable<typeof q> => !!q)
  const risposte = new Map(userSim.answers.map(a => [a.questionId, a]))
  const esito = valuta(
    ordinate.map(q => ({ id: q.id, argomentoCode: q.argomento.code })),
    qid => risposte.get(qid)?.isCorrect === true,
  )
  const nomi = new Map(ordinate.map(q => [q.argomento.code, q.argomento.name]))

  return NextResponse.json({
    simulationId: userSim.simulationId,
    simulationNumber: userSim.simulation.number,
    titolo: userSim.simulation.titolo,
    generata: userSim.simulation.generata,
    tipo: userSim.simulation.tipo,
    status: userSim.status,
    passed: esito.superato,
    score: esito.giuste,
    errors: esito.errori,
    total: esito.totali,
    erroriAmmessi: ERRORI_AMMESSI,
    timeElapsed: Math.max(0, userSim.timeElapsed ?? 0),
    argomenti: esito.argomenti.map(a => ({ ...a, nome: nomi.get(a.argomento) ?? a.argomento })),
    // Le domande una per una: la risposta data, quella giusta, l'esito
    domande: ordinate.map(q => {
      const data = risposte.get(q.id)?.userAnswer ?? null
      return {
        code: q.code,
        argomentoCode: q.argomento.code,
        gruppo: q.questionGroup,
        testo: q.text,
        figura: q.image,
        risposta: q.risposta,
        data,
        esito: data === null ? 'vuoto' : data === q.risposta ? 'giusto' : 'sbagliato',
      }
    }),
  })
}

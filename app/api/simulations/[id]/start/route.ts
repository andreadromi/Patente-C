import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireAuth()
    if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

    const simulation = await prisma.simulation.findUnique({ where: { id } })
    if (!simulation) return NextResponse.json({ error: 'Simulazione non trovata' }, { status: 404 })
    // Un esame generato è di chi l'ha generato: per gli altri non esiste
    if (simulation.generata && simulation.userId !== user.userId)
      return NextResponse.json({ error: 'Simulazione non trovata' }, { status: 404 })

    const questionIds: string[] = JSON.parse(simulation.questions)
    if (!questionIds.length) return NextResponse.json({ error: 'Nessuna domanda trovata' }, { status: 500 })

    // Cerca simulazione in corso
    let userSim = await prisma.userSimulation.findFirst({
      where: { userId: user.userId, simulationId: id, status: 'IN_PROGRESS' },
      orderBy: { startedAt: 'desc' }
    })

    if (!userSim) {
      userSim = await prisma.userSimulation.create({
        data: {
          userId: user.userId,
          simulationId: id,
          status: 'IN_PROGRESS',
          questionOrder: JSON.stringify(questionIds),
        }
      })
    }

    const savedOrder: string[] = userSim.questionOrder
      ? JSON.parse(userSim.questionOrder)
      : questionIds

    const questions = await prisma.question.findMany({
      where: { id: { in: savedOrder } },
      include: { argomento: true }
    })
    const qMap = new Map(questions.map(q => [q.id, q]))

    const orderedQuestions = savedOrder
      .map(qid => qMap.get(qid))
      .filter((q): q is NonNullable<typeof q> => !!q)
      .map(q => ({
        id: q.id,
        code: q.code,
        text: q.text,
        image: q.image || null,
        argomento: q.argomento.name,
        argomentoCode: q.argomento.code,
        // La risposta giusta: in Studio la pagina corregge subito
        risposta: q.risposta,
      }))

    const existingAnswers = await prisma.answer.findMany({
      where: { userSimulationId: userSim.id }
    })
    const answersMap = Object.fromEntries(
      existingAnswers.map(a => [a.questionId, a.userAnswer])
    )

    return NextResponse.json({
      userSimulationId: userSim.id,
      simulationId: id,
      tipo: simulation.tipo,
      titolo: simulation.titolo,
      questions: orderedQuestions,
      totalQuestions: orderedQuestions.length,   // 40
      existingAnswers: answersMap,
      // Risposte di cui si è già vista la correzione: la pagina le blocca
      rivelate: existingAnswers.filter(a => a.rivelata).map(a => a.questionId),
      startedAt: userSim.startedAt,
      // Secondi passati dall'inizio, misurati qui: la pagina d'esame ne
      // ricava il tempo che resta senza fidarsi dell'orologio del telefono
      elapsed: Math.floor((Date.now() - userSim.startedAt.getTime()) / 1000),
    })
  } catch (error: any) {
    console.error('Errore start simulazione:', error)
    return NextResponse.json({ error: 'Errore interno: ' + error.message }, { status: 500 })
  }
}

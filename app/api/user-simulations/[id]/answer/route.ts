import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { DURATA_ESAME } from '@/lib/esame'

// Salva una risposta (vero, falso, o null per toglierla).
//
// Con `blocca` la risposta diventa definitiva: da quel momento non si cambia
// più, nemmeno ricaricando la pagina. Succede in Studio, perché la correzione
// è già comparsa a schermo: senza il blocco bastava vederla e toccare l'altro
// pulsante. Nell'Esame reale invece, come all'esame vero, le risposte si
// cambiano fino alla consegna.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const questionId = typeof body.questionId === 'string' ? body.questionId : ''
  const userAnswer: boolean | null = typeof body.userAnswer === 'boolean' ? body.userAnswer : null
  const blocca = body.blocca === true
  if (!questionId) return NextResponse.json({ error: 'Domanda mancante' }, { status: 400 })

  const userSim = await prisma.userSimulation.findUnique({
    where: { id },
    include: { simulation: { select: { tipo: true, questions: true } } },
  })
  if (!userSim || userSim.userId !== user.userId || userSim.status === 'COMPLETED') {
    return NextResponse.json({ error: 'Simulazione non valida' }, { status: 400 })
  }
  // Solo le domande di questa scheda: una risposta a un'altra falserebbe
  // copertura e statistiche
  const domande: string[] = JSON.parse(userSim.questionOrder ?? userSim.simulation.questions)
  if (!domande.includes(questionId)) {
    return NextResponse.json({ error: 'Domanda estranea a questa simulazione' }, { status: 400 })
  }
  // Esame reale a tempo scaduto: come all'esame, non si risponde più (qualche
  // secondo di margine per la rete). La pagina a quel punto consegna.
  if (userSim.simulation.tipo === 'reale' && Date.now() - userSim.startedAt.getTime() > (DURATA_ESAME + 30) * 1000) {
    return NextResponse.json({ error: 'Tempo scaduto' }, { status: 410 })
  }

  const question = await prisma.question.findUnique({ where: { id: questionId } })
  if (!question) return NextResponse.json({ error: 'Domanda non trovata' }, { status: 404 })

  const esistente = await prisma.answer.findUnique({
    where: { userSimulationId_questionId: { userSimulationId: id, questionId } },
  })
  if (esistente?.rivelata) {
    return NextResponse.json({
      error: 'Risposta già data: non si cambia più',
      rivelata: true,
      userAnswer: esistente.userAnswer,
      isCorrect: esistente.isCorrect,
      correctAnswer: question.risposta,
    }, { status: 409 })
  }

  const isCorrect = userAnswer !== null ? userAnswer === question.risposta : null
  const rivelata = blocca && userAnswer !== null

  await prisma.answer.upsert({
    where: { userSimulationId_questionId: { userSimulationId: id, questionId } },
    update: { userAnswer, isCorrect, answeredAt: new Date(), rivelata },
    create: { userSimulationId: id, questionId, userAnswer, isCorrect, rivelata, answeredAt: new Date() },
  })

  return NextResponse.json({ isCorrect, correctAnswer: question.risposta, rivelata })
}

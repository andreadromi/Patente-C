import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await requireAuth(request)
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const simulation = await prisma.simulation.findUnique({ where: { id } })
  if (!simulation) return NextResponse.json({ error: 'Simulazione non trovata' }, { status: 404 })

  const questionIds: string[] = JSON.parse(simulation.questions)

  // Controlla se esiste già una simulazione in corso per questo utente
  let userSim = await prisma.userSimulation.findFirst({
    where: { userId: user.id, simulationId: id, status: 'IN_PROGRESS' },
    orderBy: { startedAt: 'desc' }
  })

  // Se non esiste, creane una nuova
  if (!userSim) {
    userSim = await prisma.userSimulation.create({
      data: {
        userId: user.id,
        simulationId: id,
        status: 'IN_PROGRESS',
        questionOrder: JSON.stringify(questionIds),
      }
    })
  }

  const savedOrder: string[] = userSim.questionOrder
    ? JSON.parse(userSim.questionOrder)
    : questionIds

  // Carica domande
  const questions = await prisma.question.findMany({
    where: { id: { in: savedOrder } },
    include: { capitolo: true }
  })
  const questionMap = new Map(questions.map(q => [q.id, q]))

  const orderedQuestions = savedOrder
    .map(qid => questionMap.get(qid))
    .filter(Boolean)
    .map((q: any) => ({
      id: q.id,
      text: q.text,
      capitolo: q.capitolo.name,
      capitoloCode: q.capitolo.code,
    }))

  // Carica risposte già date
  const existingAnswers = await prisma.answer.findMany({
    where: { userSimulationId: userSim.id }
  })
  const answersMap = Object.fromEntries(
    existingAnswers.map(a => [a.questionId, { userAnswer: a.userAnswer, isCorrect: a.isCorrect }])
  )

  return NextResponse.json({
    userSimulationId: userSim.id,
    questions: orderedQuestions,
    totalQuestions: 40,
    existingAnswers: answersMap,
  })
}

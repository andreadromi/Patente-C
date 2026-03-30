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

  // Crea UserSimulation
  const userSim = await prisma.userSimulation.create({
    data: {
      userId: user.id,
      simulationId: id,
      status: 'IN_PROGRESS',
      questionOrder: JSON.stringify(questionIds),
    }
  })

  // Carica domande nell'ordine fisso
  const questionMap = new Map<string, any>()
  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
    include: { capitolo: true }
  })
  questions.forEach(q => questionMap.set(q.id, q))

  const orderedQuestions = questionIds
    .map(qid => questionMap.get(qid))
    .filter(Boolean)
    .map(q => ({
      id: q.id,
      text: q.text,
      capitolo: q.capitolo.name,
      capitoloCode: q.capitolo.code,
    }))

  return NextResponse.json({
    userSimulationId: userSim.id,
    questions: orderedQuestions,
    totalQuestions: 40,
  })
}

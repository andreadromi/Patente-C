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

  const body = await request.json()
  const { questionId, userAnswer } = body // userAnswer: true | false | null

  const userSim = await prisma.userSimulation.findUnique({ where: { id } })
  if (!userSim || userSim.userId !== user.id || userSim.status === 'COMPLETED') {
    return NextResponse.json({ error: 'Simulazione non valida' }, { status: 400 })
  }

  const question = await prisma.question.findUnique({ where: { id: questionId } })
  if (!question) return NextResponse.json({ error: 'Domanda non trovata' }, { status: 404 })

  const isCorrect = userAnswer !== null ? userAnswer === question.risposta : null

  await prisma.answer.upsert({
    where: { userSimulationId_questionId: { userSimulationId: id, questionId } },
    update: { userAnswer, isCorrect, answeredAt: new Date() },
    create: { userSimulationId: id, questionId, userAnswer, isCorrect }
  })

  return NextResponse.json({ isCorrect, correctAnswer: question.risposta })
}

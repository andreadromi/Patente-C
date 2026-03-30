import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const userSim = await prisma.userSimulation.findUnique({
    where: { id },
    include: {
      simulation: true,
      answers: { include: { question: { include: { capitolo: true } } } },
      capitoloResults: { include: { capitolo: true } },
    }
  })

  if (!userSim || userSim.userId !== user.userId) {
    return NextResponse.json({ error: 'Non trovata' }, { status: 404 })
  }

  const questionIds: string[] = userSim.questionOrder
    ? JSON.parse(userSim.questionOrder)
    : JSON.parse(userSim.simulation.questions)

  const answerMap = new Map(userSim.answers.map(a => [a.questionId, a]))

  const orderedAnswers = questionIds.map((qid, idx) => {
    const answer = answerMap.get(qid)
    if (!answer) return null
    return {
      index: idx + 1,
      questionId: qid,
      text: answer.question.text,
      risposta: answer.question.risposta,
      userAnswer: answer.userAnswer,
      isCorrect: answer.isCorrect,
      capitolo: answer.question.capitolo.name,
    }
  }).filter(Boolean)

  return NextResponse.json({
    id: userSim.id,
    simulationNumber: userSim.simulation.number,
    status: userSim.status,
    passed: userSim.passed,
    score: userSim.score,
    errors: userSim.errors,
    timeElapsed: userSim.timeElapsed,
    startedAt: userSim.startedAt,
    completedAt: userSim.completedAt,
    answers: orderedAnswers,
    capitoloResults: userSim.capitoloResults.map(cr => ({
      capitolo: cr.capitolo.name,
      capitoloCode: cr.capitolo.code,
      total: cr.totalQuestions,
      correct: cr.correctAnswers,
      accuracy: cr.accuracy,
    }))
  })
}

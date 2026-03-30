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

  const userSim = await prisma.userSimulation.findUnique({
    where: { id },
    include: {
      simulation: true,
      answers: { include: { question: true } }
    }
  })

  if (!userSim || userSim.userId !== user.id) {
    return NextResponse.json({ error: 'Simulazione non trovata' }, { status: 404 })
  }
  if (userSim.status === 'COMPLETED') {
    return NextResponse.json({ error: 'Già completata' }, { status: 400 })
  }

  const body = await request.json()
  const timeElapsed = body.timeElapsed || 0

  // Recupera ordine domande
  const questionIds: string[] = userSim.questionOrder
    ? JSON.parse(userSim.questionOrder)
    : JSON.parse(userSim.simulation.questions)

  // Verifica che tutte siano state risposte
  const answeredIds = new Set(userSim.answers.map(a => a.questionId))
  const unanswered = questionIds.filter(id => !answeredIds.has(id))
  if (unanswered.length > 0) {
    return NextResponse.json({
      error: `${unanswered.length} domande non ancora risposte`
    }, { status: 400 })
  }

  // Calcola risultati
  const correctAnswers = userSim.answers.filter(a => a.isCorrect).length
  const errors = 40 - correctAnswers
  const passed = errors <= 4  // Patente C: max 4 errori

  // Risultati per capitolo
  const byCapitolo: Record<number, { total: number; correct: number }> = {}
  for (const answer of userSim.answers) {
    const capId = answer.question.capitoloId
    if (!byCapitolo[capId]) byCapitolo[capId] = { total: 0, correct: 0 }
    byCapitolo[capId].total++
    if (answer.isCorrect) byCapitolo[capId].correct++
  }

  // Salva
  await prisma.userSimulation.update({
    where: { id },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      timeElapsed,
      score: correctAnswers,
      errors,
      passed,
    }
  })

  // CapitoloResult
  await prisma.capitoloResult.deleteMany({ where: { userSimulationId: id } })
  for (const [capIdStr, stats] of Object.entries(byCapitolo)) {
    await prisma.capitoloResult.create({
      data: {
        userSimulationId: id,
        capitoloId: parseInt(capIdStr),
        totalQuestions: stats.total,
        correctAnswers: stats.correct,
        accuracy: (stats.correct / stats.total) * 100,
      }
    })
  }

  // Weak points per risposte sbagliate
  for (const answer of userSim.answers) {
    if (!answer.isCorrect) {
      await prisma.weakPoint.upsert({
        where: { userId_questionId: { userId: user.id, questionId: answer.questionId } },
        update: { consecutiveCorrect: 0, totalAttempts: { increment: 1 } },
        create: { userId: user.id, questionId: answer.questionId, totalAttempts: 1 }
      })
    }
  }

  return NextResponse.json({ passed, score: correctAnswers, errors })
}

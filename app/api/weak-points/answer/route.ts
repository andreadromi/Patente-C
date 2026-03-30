import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { questionId, userAnswer } = await request.json() // userAnswer: boolean

  const question = await prisma.question.findUnique({ where: { id: questionId } })
  if (!question) return NextResponse.json({ error: 'Domanda non trovata' }, { status: 404 })

  const isCorrect = userAnswer === question.risposta

  const weakPoint = await prisma.weakPoint.findUnique({
    where: { userId_questionId: { userId: user.userId, questionId } }
  })
  if (!weakPoint) return NextResponse.json({ error: 'Punto debole non trovato' }, { status: 404 })

  let removed = false
  if (isCorrect) {
    const newCount = weakPoint.consecutiveCorrect + 1
    if (newCount >= 3) {
      await prisma.weakPoint.delete({ where: { id: weakPoint.id } })
      removed = true
    } else {
      await prisma.weakPoint.update({
        where: { id: weakPoint.id },
        data: { consecutiveCorrect: newCount, totalAttempts: { increment: 1 } }
      })
    }
  } else {
    await prisma.weakPoint.update({
      where: { id: weakPoint.id },
      data: { consecutiveCorrect: 0, totalAttempts: { increment: 1 } }
    })
  }

  return NextResponse.json({
    isCorrect,
    correctAnswer: question.risposta,
    removed,
    consecutiveCorrect: isCorrect ? (weakPoint.consecutiveCorrect + 1) : 0
  })
}

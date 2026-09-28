import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function POST() {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const weakPoints = await prisma.weakPoint.findMany({
    where: { userId: user.userId },
    include: { question: { include: { argomento: true } } },
    orderBy: { consecutiveCorrect: 'asc' }
  })

  const questions = weakPoints.map(wp => ({
    weakPointId: wp.id,
    questionId: wp.questionId,
    code: wp.question.code,
    text: wp.question.text,
    image: wp.question.image || null,
    argomento: wp.question.argomento.name,
    argomentoCode: wp.question.argomento.code,
    consecutiveCorrect: wp.consecutiveCorrect,
    totalAttempts: wp.totalAttempts,
  }))

  return NextResponse.json({ questions, total: questions.length })
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const weakPoints = await prisma.weakPoint.findMany({
    where: { userId: user.id },
    include: { question: { include: { capitolo: true } } },
    orderBy: { consecutiveCorrect: 'asc' }
  })

  const questions = weakPoints.map(wp => ({
    weakPointId: wp.id,
    questionId: wp.questionId,
    text: wp.question.text,
    capitolo: wp.question.capitolo.name,
    consecutiveCorrect: wp.consecutiveCorrect,
    totalAttempts: wp.totalAttempts,
  }))

  return NextResponse.json({ questions, total: questions.length })
}

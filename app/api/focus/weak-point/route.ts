import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { questionId } = await request.json()

  await prisma.weakPoint.upsert({
    where: { userId_questionId: { userId: user.userId, questionId } },
    update: { consecutiveCorrect: 0, totalAttempts: { increment: 1 } },
    create: { userId: user.userId, questionId, totalAttempts: 1, consecutiveCorrect: 0 },
  })

  return NextResponse.json({ ok: true })
}

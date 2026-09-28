import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { questionId, isCorrect } = await request.json()

  if (!isCorrect) {
    // Sbagliata → aggiunge/resetta weak point
    await prisma.weakPoint.upsert({
      where: { userId_questionId: { userId: user.userId, questionId } },
      update: { consecutiveCorrect: 0, totalAttempts: { increment: 1 } },
      create: { userId: user.userId, questionId, totalAttempts: 1, consecutiveCorrect: 0 },
    })
  } else {
    // Corretta → aggiorna consecutiveCorrect se esiste già come weak point
    const wp = await prisma.weakPoint.findUnique({
      where: { userId_questionId: { userId: user.userId, questionId } }
    })
    if (wp) {
      const newConsecutive = wp.consecutiveCorrect + 1
      if (newConsecutive >= 3) {
        // 3 risposte corrette consecutive → elimina dal weak point
        await prisma.weakPoint.delete({
          where: { userId_questionId: { userId: user.userId, questionId } }
        })
      } else {
        await prisma.weakPoint.update({
          where: { userId_questionId: { userId: user.userId, questionId } },
          data: { consecutiveCorrect: newConsecutive }
        })
      }
    }
  }

  return NextResponse.json({ ok: true })
}

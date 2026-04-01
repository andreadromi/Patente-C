import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const capitoli = await prisma.capitolo.findMany({
    orderBy: { id: 'asc' },
    include: { _count: { select: { questions: true } } }
  })

  return NextResponse.json({
    capitoli: capitoli.map(c => ({
      id: c.id,
      code: c.code,
      name: c.name,
      nEsame: c.nEsame,
      totalQuestions: c._count.questions,
    }))
  })
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

/** Gli argomenti dell'esame, nell'ordine della scheda, con quante domande ha ciascuno. */
export async function GET() {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const argomenti = await prisma.argomento.findMany({
    orderBy: { id: 'asc' },
    include: { _count: { select: { questions: true } } },
  })

  return NextResponse.json({
    argomenti: argomenti.map(a => ({
      id: a.id,
      code: a.code,
      name: a.name,
      nEsame: a.nEsame,
      totalQuestions: a._count.questions,
    })),
  })
}

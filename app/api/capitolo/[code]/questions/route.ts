import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const capitolo = await prisma.capitolo.findUnique({ where: { code } })
  if (!capitolo) return NextResponse.json({ error: 'Capitolo non trovato' }, { status: 404 })

  const questions = await prisma.question.findMany({
    where: { capitoloId: capitolo.id },
    select: { id: true, text: true, image: true, risposta: true },
    orderBy: { id: 'asc' }
  })

  return NextResponse.json({
    capitolo: { code: capitolo.code, name: capitolo.name, nEsame: capitolo.nEsame },
    questions,
    total: questions.length
  })
}

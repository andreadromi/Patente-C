import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

/** Tutte le domande di un argomento, nell'ordine del listato: le studia la pagina Focus. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const argomento = await prisma.argomento.findUnique({ where: { code } })
  if (!argomento) return NextResponse.json({ error: 'Argomento non trovato' }, { status: 404 })

  const questions = await prisma.question.findMany({
    where: { argomentoId: argomento.id },
    orderBy: { code: 'asc' },
    select: { id: true, code: true, text: true, image: true, risposta: true, questionGroup: true },
  })

  return NextResponse.json({
    argomento: { code: argomento.code, name: argomento.name, nEsame: argomento.nEsame },
    questions,
    total: questions.length
  })
}

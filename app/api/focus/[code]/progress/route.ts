import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

/**
 * Avanzamento nello Studio di un argomento.
 * GET    → risposte date e domanda su cui si era rimasti
 * PUT    → salva l'avanzamento
 * DELETE → ricomincia l'argomento da capo
 */

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  const { code } = await params

  const row = await prisma.focusProgress.findUnique({
    where: { userId_argomentoCode: { userId: user.userId, argomentoCode: code } }
  })
  if (!row) return NextResponse.json({ answers: {}, currentIdx: 0, updatedAt: null })

  let answers: Record<string, boolean> = {}
  try { answers = JSON.parse(row.answers) } catch { answers = {} }
  return NextResponse.json({ answers, currentIdx: row.currentIdx, updatedAt: row.updatedAt })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  const { code } = await params

  const body = await request.json().catch(() => ({}))
  const currentIdx = Number.isInteger(body.currentIdx) && body.currentIdx >= 0 ? body.currentIdx : 0

  // Tiene solo le risposte vere/false: scarta null e valori non booleani
  const answers: Record<string, boolean> = {}
  for (const [k, v] of Object.entries(body.answers || {})) {
    if (typeof v === 'boolean') answers[k] = v
  }

  const data = { answers: JSON.stringify(answers), currentIdx }
  await prisma.focusProgress.upsert({
    where: { userId_argomentoCode: { userId: user.userId, argomentoCode: code } },
    update: data,
    create: { userId: user.userId, argomentoCode: code, ...data },
  })
  return NextResponse.json({ ok: true, salvate: Object.keys(answers).length })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  const { code } = await params

  await prisma.focusProgress.deleteMany({
    where: { userId: user.userId, argomentoCode: code }
  })
  return NextResponse.json({ ok: true })
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function POST() {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  await prisma.weakPoint.deleteMany({ where: { userId: user.userId } })
  return NextResponse.json({ ok: true })
}

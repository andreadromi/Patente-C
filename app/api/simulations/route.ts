import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    const simulations = await prisma.simulation.findMany({
      orderBy: { number: 'asc' },
      select: { id: true, number: true, capitoloCode: true, titolo: true }
    })
    return NextResponse.json({ simulations })
  } catch {
    return NextResponse.json({ error: 'Errore' }, { status: 500 })
  }
}

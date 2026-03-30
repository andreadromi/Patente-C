import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const user = await requireAuth(request)
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const simulations = await prisma.simulation.findMany({
    orderBy: { number: 'asc' },
    include: { _count: { select: { userSimulations: true } } }
  })

  return NextResponse.json({ simulations })
}

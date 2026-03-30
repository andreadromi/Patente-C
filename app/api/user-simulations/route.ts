import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const user = await requireAuth(request)
  if (!user) return NextResponse.json([], { status: 200 })

  const userSims = await prisma.userSimulation.findMany({
    where: { userId: user.id },
    orderBy: { startedAt: 'desc' },
    select: {
      id: true, simulationId: true, status: true,
      passed: true, score: true, errors: true, startedAt: true
    }
  })

  return NextResponse.json(userSims)
}

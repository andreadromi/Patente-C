import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const userSim = await prisma.userSimulation.findUnique({ where: { id } })
  if (!userSim || userSim.userId !== user.userId)
    return NextResponse.json({ error: 'Non trovata' }, { status: 404 })
  // Azzerare riporta la simulazione a "da fare", finita o in corso che sia:
  // cancella TUTTI i tentativi, così Home, Riepilogo e percorso tornano insieme.
  // I punti deboli già raccolti restano: sono errori veri, da ripassare
  const allSims = await prisma.userSimulation.findMany({
    where: { userId: user.userId, simulationId: userSim.simulationId }
  })

  // Anche i punti deboli nati da questa simulazione se ne vanno: azzerarla
  // vuol dire ricominciarla da zero. Sono quelli delle sue domande
  const simulazione = await prisma.simulation.findUnique({
    where: { id: userSim.simulationId }, select: { questions: true },
  })
  const domande = new Set<string>()
  for (const s of [...allSims.map(a => a.questionOrder), simulazione?.questions]) {
    if (!s) continue
    try { for (const q of JSON.parse(s) as string[]) domande.add(q) } catch { /* elenco illeggibile: si salta */ }
  }
  if (domande.size) {
    await prisma.weakPoint.deleteMany({ where: { userId: user.userId, questionId: { in: [...domande] } } })
  }
  for (const s of allSims) {
    await prisma.answer.deleteMany({ where: { userSimulationId: s.id } })
    await prisma.argomentoResult.deleteMany({ where: { userSimulationId: s.id } })
  }
  await prisma.userSimulation.deleteMany({
    where: { userId: user.userId, simulationId: userSim.simulationId }
  })

  // Un esame generato esiste solo per questo tentativo: senza, resterebbe
  // a DB un esame che nessuno può più aprire
  const sim = await prisma.simulation.findUnique({
    where: { id: userSim.simulationId }, select: { generata: true, userId: true },
  })
  if (sim?.generata && sim.userId === user.userId) {
    await prisma.simulation.delete({ where: { id: userSim.simulationId } })
  }

  return NextResponse.json({ ok: true })
}

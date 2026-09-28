import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

/**
 * Statistiche dell'utente per il Riepilogo: dove fa più fatica. I dati per
 * argomento li scrive `ArgomentoResult` a ogni simulazione completata; qui si
 * mettono insieme.
 */
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const [risultati, deboli, argomentiDb] = await Promise.all([
    prisma.argomentoResult.findMany({
      where: { userSimulation: { userId: user.userId, status: 'COMPLETED' } },
      select: { argomentoCode: true, correct: true, total: true },
    }),
    prisma.weakPoint.findMany({
      where: { userId: user.userId },
      select: { question: { select: { argomento: { select: { code: true } } } } },
    }),
    // I nomi degli argomenti sono quelli a DB, gli stessi che mostra Focus
    prisma.argomento.findMany({ orderBy: { id: 'asc' }, select: { code: true, name: true } }),
  ])

  const perArgomento: Record<string, { corrette: number; totali: number; deboli: number }> = {}
  const slot = (code: string) => (perArgomento[code] ||= { corrette: 0, totali: 0, deboli: 0 })
  for (const r of risultati) { const s = slot(r.argomentoCode); s.corrette += r.correct; s.totali += r.total }
  for (const w of deboli) { const c = w.question?.argomento?.code; if (c) slot(c).deboli++ }

  const argomenti = argomentiDb
    .filter(a => perArgomento[a.code])
    .map(a => {
      const s = perArgomento[a.code]
      return {
        code: a.code,
        name: a.name,
        corrette: s.corrette,
        totali: s.totali,
        accuratezza: s.totali > 0 ? Math.round((s.corrette / s.totali) * 100) : null,
        deboli: s.deboli,
      }
    })

  return NextResponse.json({ argomenti })
}

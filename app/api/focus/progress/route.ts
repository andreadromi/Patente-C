import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

/**
 * Quante risposte l'utente ha già dato nello Studio, argomento per argomento:
 * la pagina Focus lo mostra su ogni argomento, così si vede a che punto si è
 * senza aprirle una per una.
 */
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const righe = await prisma.focusProgress.findMany({
    where: { userId: user.userId },
    select: { argomentoCode: true, answers: true },
  })
  const risposte: Record<string, number> = {}
  for (const r of righe) {
    try { risposte[r.argomentoCode] = Object.keys(JSON.parse(r.answers)).length } catch { risposte[r.argomentoCode] = 0 }
  }
  return NextResponse.json({ risposte })
}

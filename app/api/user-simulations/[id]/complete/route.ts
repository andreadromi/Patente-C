import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { DURATA_ESAME, valuta } from '@/lib/esame'

/** Tetto al tempo di una simulazione, che non ha cronometro: un giorno. */
const UN_GIORNO = 86400

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const userSim = await prisma.userSimulation.findUnique({
    where: { id },
    include: { simulation: true, answers: true }
  })

  if (!userSim || userSim.userId !== user.userId)
    return NextResponse.json({ error: 'Simulazione non trovata' }, { status: 404 })
  if (userSim.status === 'COMPLETED')
    return NextResponse.json({ error: 'Già completata' }, { status: 400 })

  const body = await request.json().catch(() => ({}))
  const forceComplete = body.forceComplete === true
  // Nell'Esame reale il tempo lo misura il server, da quando l'esame è
  // cominciato, e non va oltre la durata della prova. Nelle simulazioni lo
  // manda la pagina, che lo conta solo mentre è aperta.
  const timeElapsed = userSim.simulation.tipo === 'reale'
    ? Math.max(0, Math.min(DURATA_ESAME, Math.round((Date.now() - userSim.startedAt.getTime()) / 1000)))
    : Math.max(0, Math.min(UN_GIORNO, Math.round(Number(body.timeElapsed) || 0)))

  const questionIds: string[] = userSim.questionOrder
    ? JSON.parse(userSim.questionOrder)
    : JSON.parse(userSim.simulation.questions)

  // "Risposto" vuol dire vero o falso: una risposta tolta (null) è in bianco
  const risposte = new Map(userSim.answers.map(a => [a.questionId, a]))
  const unanswered = questionIds.filter(qid => risposte.get(qid)?.userAnswer == null)
  if (unanswered.length > 0 && !forceComplete) {
    return NextResponse.json({ error: `${unanswered.length} domande non ancora risposte` }, { status: 400 })
  }

  // Il punteggio si conta su TUTTE le domande della scheda, non solo su
  // quelle con una risposta: una domanda in bianco è sbagliata, come
  // all'esame. Contando solo le risposte, un esame terminato senza toccare
  // niente risulterebbe superato.
  const domande = await prisma.question.findMany({
    where: { id: { in: questionIds } },
    select: { id: true, argomento: { select: { code: true } } },
  })
  const perId = new Map(domande.map(d => [d.id, d]))
  const ordinate = questionIds.map(qid => perId.get(qid)).filter((d): d is NonNullable<typeof d> => !!d)
  const giusta = (qid: string) => risposte.get(qid)?.isCorrect === true

  // Si supera con al massimo 4 errori su 40 (vedi lib/esame.ts)
  const esito = valuta(ordinate.map(d => ({ id: d.id, argomentoCode: d.argomento.code })), giusta)

  // Per il Riepilogo si tiene anche il conto per argomento: solo le domande
  // con una risposta. Una lasciata in bianco non dice niente su come si va in
  // quell'argomento (magari si è solo usciti prima)
  const risposta = (qid: string) => risposte.get(qid)?.userAnswer != null
  const perArgomento: Record<string, { total: number; correct: number }> = {}
  for (const d of ordinate) {
    if (!risposta(d.id)) continue
    const a = (perArgomento[d.argomento.code] ||= { total: 0, correct: 0 })
    a.total++
    if (giusta(d.id)) a.correct++
  }

  // Si chiude una volta sola: due consegne insieme (il tempo che scade mentre
  // si tocca "Termina") non devono contare due volte gli errori
  const chiusa = await prisma.userSimulation.updateMany({
    where: { id, status: 'IN_PROGRESS' },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      timeElapsed,
      score: esito.giuste,
      errors: esito.errori,
      passed: esito.superato,
    }
  })
  if (chiusa.count === 0) return NextResponse.json({ error: 'Già completata' }, { status: 400 })

  await prisma.argomentoResult.createMany({
    data: Object.entries(perArgomento).map(([argomentoCode, s]) => ({
      userSimulationId: id,
      argomentoCode,
      total: s.total,
      correct: s.correct,
      accuracy: (s.correct / s.total) * 100,
    })),
  })

  // Punti deboli: solo le domande sbagliate davvero. Quelle in bianco
  // restano fuori, altrimenti chi chiude un esame a metà si ritroverebbe
  // tutto l'esame da ripassare
  for (const d of ordinate) {
    if (!risposta(d.id) || giusta(d.id)) continue
    await prisma.weakPoint.upsert({
      where: { userId_questionId: { userId: user.userId, questionId: d.id } },
      update: { consecutiveCorrect: 0, totalAttempts: { increment: 1 } },
      create: { userId: user.userId, questionId: d.id, totalAttempts: 1 }
    })
  }

  return NextResponse.json({
    passed: esito.superato,
    score: esito.giuste,
    errors: esito.errori,
    total: esito.totali,
    argomenti: esito.argomenti,
  })
}

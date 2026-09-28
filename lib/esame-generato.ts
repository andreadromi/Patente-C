import type { PrismaClient } from '@prisma/client'
import { DOMANDE_PER_ESAME } from './esame'

/**
 * L'Esame reale: una scheda composta sul momento, come la compone il giorno
 * dell'esame il sistema della Motorizzazione. Ogni argomento dà il suo numero
 * fisso di domande (`nEsame`), pescate a caso fra le sue: 40 in tutto. Da un
 * quesito del listato ne esce al massimo una: le sue affermazioni parlano
 * della stessa cosa, spesso dello stesso cartello, e due nella stessa scheda
 * si risponderebbero a vicenda.
 *
 * Vive nella tabella delle simulazioni, con `generata` e `userId`: così la
 * pagina d'esame, le risposte, il completamento e il report funzionano come
 * per le simulazioni fisse. Cambia solo chi sceglie le domande.
 */

export { DOMANDE_PER_ESAME }

/** Le simulazioni fisse sono numerate da 1; gli esami generati partono da qui. */
export const PRIMO_NUMERO_GENERATO = 10001

/**
 * Le simulazioni create a mano dall'admin usano numeri da qui in su: sotto
 * ci sono quelle del file dell'archivio, che il seed riallinea e ripulisce.
 */
export const PRIMO_NUMERO_MANUALE = 1000

export interface Domanda {
  id: string
  code: string       // numero della domanda nel listato ministeriale
  quesito: number    // quesito del listato a cui appartiene
  argomento: string  // codice dell'argomento
}

export interface QuotaArgomento { code: string; nEsame: number }

/** Una copia della lista in ordine casuale. */
function mescola<T>(lista: T[], caso: () => number): T[] {
  return lista.map(x => ({ x, k: caso() })).sort((a, b) => a.k - b.k).map(v => v.x)
}

/**
 * Compone una scheda: per ogni argomento, nell'ordine in cui arrivano (quello
 * della scheda d'esame), `nEsame` domande a caso fra le sue, ognuna da un
 * quesito diverso. Se un argomento avesse meno quesiti che domande da dare,
 * le mancanti si prendono comunque, fra le domande rimaste.
 */
export function componiEsame(domande: Iterable<Domanda>, argomenti: QuotaArgomento[], caso: () => number = Math.random): Domanda[] {
  const perArgomento = new Map<string, Map<number, Domanda[]>>()
  for (const d of domande) {
    const quesiti = perArgomento.get(d.argomento) ?? new Map<number, Domanda[]>()
    const lista = quesiti.get(d.quesito) ?? []
    lista.push(d)
    quesiti.set(d.quesito, lista)
    perArgomento.set(d.argomento, quesiti)
  }
  const scelte: Domanda[] = []
  for (const a of argomenti) {
    const quesiti = mescola([...(perArgomento.get(a.code)?.values() ?? [])], caso).map(q => mescola(q, caso))
    const prese = quesiti.slice(0, a.nEsame).map(q => q[0])
    if (prese.length < a.nEsame) {
      const resto = mescola(quesiti.flatMap(q => q.slice(1)), caso)
      prese.push(...resto.slice(0, a.nEsame - prese.length))
    }
    scelte.push(...mescola(prese, caso))
  }
  return scelte
}

/**
 * Quante volte l'utente ha affrontato ogni domanda: i tentativi, fissi o
 * generati, finiti o lasciati a metà, in cui le ha dato una risposta. Una
 * risposta per tentativo (Answer è unica per tentativo e domanda), quindi
 * basta contarle.
 */
export function contaVolte(risposte: { questionId: string }[]): Map<string, number> {
  const volte = new Map<string, number>()
  for (const r of risposte) volte.set(r.questionId, (volte.get(r.questionId) ?? 0) + 1)
  return volte
}

/** Per ogni argomento, quante domande l'utente ha affrontato almeno una volta. */
export function coperturaPerArgomento(domande: Iterable<Domanda>, volte: Map<string, number>) {
  const per: Record<string, { affrontate: number; totale: number }> = {}
  for (const d of domande) {
    const s = (per[d.argomento] ||= { affrontate: 0, totale: 0 })
    s.totale++
    if ((volte.get(d.id) ?? 0) > 0) s.affrontate++
  }
  return per
}

/** `questions` di una simulazione: gli id delle domande, nell'ordine in cui escono. */
export function materialeSimulazione(scelte: { id: string }[]) {
  return { questions: JSON.stringify(scelte.map(d => d.id)) }
}

/** Un codice scritto a mano: senza spazi e in maiuscolo, come nel listato. */
export function normalizzaCodice(c: string) {
  return c.toUpperCase().replace(/\s+/g, '')
}

/** I codici delle domande dal corpo di una richiesta admin: un array, o una stringa JSON di array. */
export function leggiCodici(questions: unknown): string[] | null {
  try {
    const lista = typeof questions === 'string' ? JSON.parse(questions) : questions
    if (!Array.isArray(lista) || !lista.every(c => typeof c === 'string')) return null
    return (lista as string[]).map(c => c.trim()).filter(Boolean)
  } catch { return null }
}

/** Le domande corrispondenti a una lista di codici, nello stesso ordine, e i codici che non esistono. */
export async function domandeDaCodici(prisma: PrismaClient, codici: string[]) {
  const righe = await prisma.question.findMany({
    where: { code: { in: codici.map(normalizzaCodice) } },
    select: { id: true, code: true },
  })
  const perCodice = new Map(righe.map(r => [r.code, r]))
  const trovate: { id: string; code: string }[] = [], mancanti: string[] = []
  for (const c of codici) {
    const d = perCodice.get(normalizzaCodice(c))
    if (d) trovate.push(d); else mancanti.push(c)
  }
  return { trovate, mancanti }
}

/** Tutte le domande dell'archivio, nell'ordine del listato, con l'argomento. */
export async function caricaDomande(prisma: PrismaClient): Promise<Domanda[]> {
  const righe = await prisma.question.findMany({
    select: { id: true, code: true, quesito: true, argomento: { select: { code: true } } },
    orderBy: [{ argomentoId: 'asc' }, { code: 'asc' }],
  })
  return righe.map(r => ({ id: r.id, code: r.code, quesito: r.quesito, argomento: r.argomento.code }))
}

export async function caricaDomandeEVolte(prisma: PrismaClient, userId: string) {
  const [domande, risposte] = await Promise.all([
    caricaDomande(prisma),
    prisma.answer.findMany({
      where: { userSimulation: { userId }, userAnswer: { not: null } },
      select: { questionId: true },
    }),
  ])
  return { domande, volte: contaVolte(risposte) }
}

/**
 * Crea a DB un Esame reale per l'utente: una scheda nuova, con le quote di
 * ogni argomento.
 */
export async function creaEsame(prisma: PrismaClient, userId: string) {
  const [domande, argomenti] = await Promise.all([
    caricaDomande(prisma),
    prisma.argomento.findMany({ orderBy: { id: 'asc' }, select: { code: true, nEsame: true } }),
  ])
  const scelte = componiEsame(domande, argomenti)
  if (scelte.length < DOMANDE_PER_ESAME) throw new Error(`archivio insufficiente, ${scelte.length} domande`)

  // "Esame reale 1", "Esame reale 2"…: il progressivo è per utente, e non
  // torna indietro se un esame abbandonato viene cancellato.
  const prefisso = 'Esame reale'
  const miei = await prisma.simulation.findMany({ where: { generata: true, userId }, select: { titolo: true } })
  const daTitolo = new RegExp(`^${prefisso} (\\d+)$`)
  const progressivo = miei.reduce((n, s) => Math.max(n, parseInt(daTitolo.exec(s.titolo ?? '')?.[1] ?? '0', 10)), 0) + 1

  // Il numero è unico in tutta la tabella: se due esami nascono nello stesso istante uno riprova
  for (let tentativo = 0; ; tentativo++) {
    const ultimo = await prisma.simulation.aggregate({ _max: { number: true }, where: { generata: true } })
    const number = Math.max(PRIMO_NUMERO_GENERATO - 1, ultimo._max.number ?? 0) + 1
    try {
      return await prisma.simulation.create({
        data: {
          number, generata: true, userId, tipo: 'reale', titolo: `${prefisso} ${progressivo}`,
          ...materialeSimulazione(scelte),
        },
      })
    } catch (e: unknown) {
      if ((e as { code?: string })?.code !== 'P2002' || tentativo >= 2) throw e
    }
  }
}

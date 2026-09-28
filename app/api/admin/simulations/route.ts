import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { leggiCodici, materialeSimulazione, domandeDaCodici } from '@/lib/esame-generato'

// GET /api/admin/simulations - Lista simulazioni
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    // Solo le simulazioni fisse: gli esami generati sono degli utenti
    const simulations = await prisma.simulation.findMany({
      where: { generata: false },
      orderBy: { number: 'asc' },
    })

    // Quante domande ha ogni simulazione
    const simulationsWithCount = simulations.map((sim) => ({
      ...sim,
      questionCount: (JSON.parse(sim.questions || '[]') as string[]).length,
    }))

    return NextResponse.json({ simulations: simulationsWithCount })
  } catch (error) {
    console.error('[GET /api/admin/simulations] Error:', error)
    return NextResponse.json(
      { error: 'Errore durante il caricamento delle simulazioni' },
      { status: 500 }
    )
  }
}

// POST /api/admin/simulations - Crea nuova simulazione dai codici delle domande del listato
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const { number, questions, titolo } = body

    if (!number || !questions) {
      return NextResponse.json(
        { error: 'Numero e domande sono obbligatori' },
        { status: 400 }
      )
    }

    const n = parseInt(number)
    if (!Number.isInteger(n) || n <= 0) {
      return NextResponse.json({ error: 'Numero simulazione non valido' }, { status: 400 })
    }

    // Le domande arrivano come codici del listato, non come id
    const codici = leggiCodici(questions)
    if (!codici || !codici.length) {
      return NextResponse.json(
        { error: 'Formato domande non valido. Deve essere un array JSON di codici delle domande del listato' },
        { status: 400 }
      )
    }

    const existingSimulation = await prisma.simulation.findUnique({ where: { number: n } })
    if (existingSimulation) {
      return NextResponse.json(
        { error: 'Numero simulazione già esistente' },
        { status: 400 }
      )
    }

    const { trovate, mancanti } = await domandeDaCodici(prisma, codici)
    if (mancanti.length) {
      return NextResponse.json(
        { error: `Codici non trovati: ${mancanti.join(', ')}` },
        { status: 400 }
      )
    }

    const simulation = await prisma.simulation.create({
      data: {
        number: n,
        titolo: typeof titolo === 'string' && titolo.trim() ? titolo.trim() : `Simulazione ${n}`,
        tipo: 'simulazione',
        ...materialeSimulazione(trovate),
      },
    })

    return NextResponse.json({ simulation }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/admin/simulations] Error:', error)
    return NextResponse.json(
      { error: 'Errore durante la creazione della simulazione' },
      { status: 500 }
    )
  }
}

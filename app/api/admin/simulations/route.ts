import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/simulations - Lista simulazioni
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const simulations = await prisma.simulation.findMany({
      orderBy: { number: 'asc' },
    })

    // Conta quante domande per simulazione
    const simulationsWithCount = simulations.map((sim) => ({
      ...sim,
      questionCount: JSON.parse(sim.questions).length,
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

// POST /api/admin/simulations - Crea nuova simulazione
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const body = await request.json()
    const { number, questions } = body

    // Validazione
    if (!number || !questions) {
      return NextResponse.json(
        { error: 'Numero e domande sono obbligatori' },
        { status: 400 }
      )
    }

    // Parse questions (deve essere array di codici)
    let questionCodes: string[]
    try {
      questionCodes =
        typeof questions === 'string' ? JSON.parse(questions) : questions

      if (!Array.isArray(questionCodes)) {
        throw new Error('Questions deve essere un array')
      }
    } catch (err) {
      return NextResponse.json(
        {
          error:
            'Formato domande non valido. Deve essere un array JSON di codici',
        },
        { status: 400 }
      )
    }

    // Verifica che il numero non esista già
    const existingSimulation = await prisma.simulation.findUnique({
      where: { number: parseInt(number) },
    })

    if (existingSimulation) {
      return NextResponse.json(
        { error: 'Numero simulazione già esistente' },
        { status: 400 }
      )
    }

    // Verifica che tutte le domande esistano
    const existingQuestions = await prisma.question.findMany({
      where: { code: { in: questionCodes } },
      select: { code: true },
    })

    if (existingQuestions.length !== questionCodes.length) {
      const foundCodes = existingQuestions.map((q) => q.code)
      const missingCodes = questionCodes.filter(
        (code) => !foundCodes.includes(code)
      )
      return NextResponse.json(
        {
          error: `Codici domanda non trovati: ${missingCodes.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Crea simulazione
    const simulation = await prisma.simulation.create({
      data: {
        number: parseInt(number),
        questions: JSON.stringify(questionCodes),
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

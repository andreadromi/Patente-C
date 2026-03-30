import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Props = {
  params: Promise<{
    id: string
  }>
}

// GET /api/admin/simulations/[id] - Dettaglio singola simulazione
export async function GET(request: NextRequest, props: Props) {
  const params = await props.params
  try {
    const user = await getCurrentUser()

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const simulation = await prisma.simulation.findUnique({
      where: { id: params.id },
    })

    if (!simulation) {
      return NextResponse.json(
        { error: 'Simulazione non trovata' },
        { status: 404 }
      )
    }

    return NextResponse.json({ simulation })
  } catch (error) {
    console.error('[GET /api/admin/simulations/[id]] Error:', error)
    return NextResponse.json(
      { error: 'Errore durante il caricamento della simulazione' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/simulations/[id] - Aggiorna simulazione
export async function PUT(request: NextRequest, props: Props) {
  const params = await props.params
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

    // Parse questions
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

    // Verifica che la simulazione esista
    const existingSimulation = await prisma.simulation.findUnique({
      where: { id: params.id },
    })

    if (!existingSimulation) {
      return NextResponse.json(
        { error: 'Simulazione non trovata' },
        { status: 404 }
      )
    }

    // Verifica che il numero non sia già usato da altra simulazione
    if (number !== existingSimulation.number) {
      const numberExists = await prisma.simulation.findUnique({
        where: { number: parseInt(number) },
      })

      if (numberExists) {
        return NextResponse.json(
          { error: 'Numero simulazione già esistente' },
          { status: 400 }
        )
      }
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

    // Aggiorna simulazione
    const simulation = await prisma.simulation.update({
      where: { id: params.id },
      data: {
        number: parseInt(number),
        questions: JSON.stringify(questionCodes),
      },
    })

    return NextResponse.json({ simulation })
  } catch (error) {
    console.error('[PUT /api/admin/simulations/[id]] Error:', error)
    return NextResponse.json(
      { error: "Errore durante l'aggiornamento della simulazione" },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/simulations/[id] - Elimina simulazione
export async function DELETE(request: NextRequest, props: Props) {
  const params = await props.params
  try {
    const user = await getCurrentUser()

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    // Verifica che la simulazione esista
    const existingSimulation = await prisma.simulation.findUnique({
      where: { id: params.id },
    })

    if (!existingSimulation) {
      return NextResponse.json(
        { error: 'Simulazione non trovata' },
        { status: 404 }
      )
    }

    // Verifica se la simulazione è stata usata da utenti
    const usedSimulation = await prisma.userSimulation.findFirst({
      where: { simulationId: params.id },
    })

    if (usedSimulation) {
      return NextResponse.json(
        {
          error:
            'Impossibile eliminare: simulazione già utilizzata da uno o più utenti',
        },
        { status: 400 }
      )
    }

    // Elimina simulazione
    await prisma.simulation.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/admin/simulations/[id]] Error:', error)
    return NextResponse.json(
      { error: "Errore durante l'eliminazione della simulazione" },
      { status: 500 }
    )
  }
}

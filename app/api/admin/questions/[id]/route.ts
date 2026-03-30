import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Props = {
  params: Promise<{
    id: string
  }>
}

// GET /api/admin/questions/[id] - Dettaglio singola domanda
export async function GET(request: NextRequest, props: Props) {
  const params = await props.params
  try {
    const user = await getCurrentUser()

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const question = await prisma.question.findUnique({
      where: { id: params.id },
      include: { area: true },
    })

    if (!question) {
      return NextResponse.json(
        { error: 'Domanda non trovata' },
        { status: 404 }
      )
    }

    return NextResponse.json({ question })
  } catch (error) {
    console.error('[GET /api/admin/questions/[id]] Error:', error)
    return NextResponse.json(
      { error: 'Errore durante il caricamento della domanda' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/questions/[id] - Aggiorna domanda
export async function PUT(request: NextRequest, props: Props) {
  const params = await props.params
  try {
    const user = await getCurrentUser()

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const body = await request.json()
    const {
      code,
      text,
      option1,
      option2,
      option3,
      option4,
      correctAnswer,
      areaId,
    } = body

    // Validazione
    if (
      !code ||
      !text ||
      !option1 ||
      !option2 ||
      !option3 ||
      !option4 ||
      !correctAnswer ||
      !areaId
    ) {
      return NextResponse.json(
        { error: 'Tutti i campi sono obbligatori' },
        { status: 400 }
      )
    }

    // Verifica che la domanda esista
    const existingQuestion = await prisma.question.findUnique({
      where: { id: params.id },
    })

    if (!existingQuestion) {
      return NextResponse.json(
        { error: 'Domanda non trovata' },
        { status: 404 }
      )
    }

    // Verifica che il codice non sia già usato da altra domanda
    if (code !== existingQuestion.code) {
      const codeExists = await prisma.question.findUnique({
        where: { code },
      })

      if (codeExists) {
        return NextResponse.json(
          { error: 'Codice domanda già esistente' },
          { status: 400 }
        )
      }
    }

    // Verifica che correctAnswer sia 1-4
    const correctAnswerNum = parseInt(correctAnswer)
    if (![1, 2, 3, 4].includes(correctAnswerNum)) {
      return NextResponse.json(
        { error: 'La risposta corretta deve essere 1, 2, 3 o 4' },
        { status: 400 }
      )
    }

    // Aggiorna domanda
    const question = await prisma.question.update({
      where: { id: params.id },
      data: {
        code,
        text,
        option1,
        option2,
        option3,
        option4,
        correctAnswer: correctAnswerNum,
        areaId,
      },
      include: {
        area: true,
      },
    })

    return NextResponse.json({ question })
  } catch (error) {
    console.error('[PUT /api/admin/questions/[id]] Error:', error)
    return NextResponse.json(
      { error: "Errore durante l'aggiornamento della domanda" },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/questions/[id] - Elimina domanda
export async function DELETE(request: NextRequest, props: Props) {
  const params = await props.params
  try {
    const user = await getCurrentUser()

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    // Verifica che la domanda esista
    const existingQuestion = await prisma.question.findUnique({
      where: { id: params.id },
    })

    if (!existingQuestion) {
      return NextResponse.json(
        { error: 'Domanda non trovata' },
        { status: 404 }
      )
    }

    // Verifica se la domanda è usata in simulazioni
    const usedInSimulations = await prisma.simulation.findFirst({
      where: {
        questions: {
          contains: existingQuestion.code,
        },
      },
    })

    if (usedInSimulations) {
      return NextResponse.json(
        {
          error:
            'Impossibile eliminare: domanda utilizzata in una o più simulazioni',
        },
        { status: 400 }
      )
    }

    // Elimina domanda (Prisma elimina automaticamente le risposte correlate con onDelete: Cascade)
    await prisma.question.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/admin/questions/[id]] Error:', error)
    return NextResponse.json(
      { error: "Errore durante l'eliminazione della domanda" },
      { status: 500 }
    )
  }
}

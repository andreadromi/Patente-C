import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/questions - Lista domande con paginazione e filtri
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const areaId = searchParams.get('areaId') || ''

    const skip = (page - 1) * limit

    // Costruisci filtri
    const where: any = {}

    if (search) {
      where.OR = [
        { code: { contains: search } },
        { text: { contains: search } },
      ]
    }

    if (areaId) {
      where.areaId = areaId
    }

    // Query con paginazione
    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        include: {
          area: true,
        },
        orderBy: { code: 'asc' },
        skip,
        take: limit,
      }),
      prisma.question.count({ where }),
    ])

    return NextResponse.json({
      questions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('[GET /api/admin/questions] Error:', error)
    return NextResponse.json(
      { error: 'Errore durante il caricamento delle domande' },
      { status: 500 }
    )
  }
}

// POST /api/admin/questions - Crea nuova domanda
export async function POST(request: NextRequest) {
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

    // Verifica che il codice non esista già
    const existingQuestion = await prisma.question.findUnique({
      where: { code },
    })

    if (existingQuestion) {
      return NextResponse.json(
        { error: 'Codice domanda già esistente' },
        { status: 400 }
      )
    }

    // Verifica che correctAnswer sia 1-4
    const correctAnswerNum = parseInt(correctAnswer)
    if (![1, 2, 3, 4].includes(correctAnswerNum)) {
      return NextResponse.json(
        { error: 'La risposta corretta deve essere 1, 2, 3 o 4' },
        { status: 400 }
      )
    }

    // Crea domanda
    const question = await prisma.question.create({
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

    return NextResponse.json({ question }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/admin/questions] Error:', error)
    return NextResponse.json(
      { error: 'Errore durante la creazione della domanda' },
      { status: 500 }
    )
  }
}

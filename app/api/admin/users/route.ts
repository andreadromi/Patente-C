import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/users - Lista utenti (escluso admin)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    // Carica utenti non-admin con conteggio simulazioni
    const users = await prisma.user.findMany({
      where: {
        isAdmin: false,
      },
      include: {
        _count: {
          select: {
            userSimulations: {
              where: { status: 'COMPLETED' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Formatta dati
    const usersWithStats = users.map((u) => ({
      id: u.id,
      username: u.username,
      createdAt: u.createdAt,
      completedSimulations: u._count.userSimulations,
    }))

    return NextResponse.json({ users: usersWithStats })
  } catch (error) {
    console.error('[GET /api/admin/users] Error:', error)
    return NextResponse.json(
      { error: 'Errore durante il caricamento degli utenti' },
      { status: 500 }
    )
  }
}

// POST /api/admin/users - Crea nuovo utente
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const body = await request.json()
    const { username } = body

    // Validazione
    if (!username || username.trim().length === 0) {
      return NextResponse.json(
        { error: 'Username è obbligatorio' },
        { status: 400 }
      )
    }

    // Verifica che username non esista già
    const existingUser = await prisma.user.findUnique({
      where: { username: username.trim() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username già esistente' },
        { status: 400 }
      )
    }

    // Crea utente (non-admin)
    const newUser = await prisma.user.create({
      data: {
        username: username.trim(),
        isAdmin: false,
      },
    })

    return NextResponse.json({ user: newUser }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/admin/users] Error:', error)
    return NextResponse.json(
      { error: "Errore durante la creazione dell'utente" },
      { status: 500 }
    )
  }
}

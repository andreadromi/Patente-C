import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Props = {
  params: Promise<{
    id: string
  }>
}

// GET /api/admin/users/[id] - Dettaglio utente
export async function GET(request: NextRequest, props: Props) {
  const params = await props.params
  try {
    const user = await getCurrentUser()

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Utente non trovato' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user: targetUser })
  } catch (error) {
    console.error('[GET /api/admin/users/[id]] Error:', error)
    return NextResponse.json(
      { error: "Errore durante il caricamento dell'utente" },
      { status: 500 }
    )
  }
}

// PUT /api/admin/users/[id] - Modifica username
export async function PUT(request: NextRequest, props: Props) {
  const params = await props.params
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

    // Verifica che l'utente esista
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Utente non trovato' },
        { status: 404 }
      )
    }

    // Impedisci di modificare admin
    if (existingUser.isAdmin) {
      return NextResponse.json(
        { error: 'Impossibile modificare un utente admin' },
        { status: 400 }
      )
    }

    // Verifica che il nuovo username non sia già in uso (se diverso)
    if (username.trim() !== existingUser.username) {
      const usernameExists = await prisma.user.findUnique({
        where: { username: username.trim() },
      })

      if (usernameExists) {
        return NextResponse.json(
          { error: 'Username già esistente' },
          { status: 400 }
        )
      }
    }

    // Aggiorna username
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        username: username.trim(),
      },
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('[PUT /api/admin/users/[id]] Error:', error)
    return NextResponse.json(
      { error: "Errore durante l'aggiornamento dell'utente" },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/users/[id] - Elimina utente
export async function DELETE(request: NextRequest, props: Props) {
  const params = await props.params
  try {
    const user = await getCurrentUser()

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    // Verifica che l'utente esista
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Utente non trovato' },
        { status: 404 }
      )
    }

    // Impedisci di eliminare admin
    if (existingUser.isAdmin) {
      return NextResponse.json(
        { error: 'Impossibile eliminare un utente admin' },
        { status: 400 }
      )
    }

    // Elimina dati collegati, poi utente
    const userSimIds = await prisma.userSimulation.findMany({
      where: { userId: params.id },
      select: { id: true }
    })
    const simIds = userSimIds.map(s => s.id)

    if (simIds.length > 0) {
      await prisma.capitoloResult.deleteMany({ where: { userSimulationId: { in: simIds } } })
      await prisma.answer.deleteMany({ where: { userSimulationId: { in: simIds } } })
    }
    await prisma.userSimulation.deleteMany({ where: { userId: params.id } })
    await prisma.weakPoint.deleteMany({ where: { userId: params.id } })
    await prisma.user.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/admin/users/[id]] Error:', error)
    return NextResponse.json(
      { error: "Errore durante l'eliminazione dell'utente" },
      { status: 500 }
    )
  }
}

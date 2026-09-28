import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    return NextResponse.json({
      user: {
        id: user.userId,
        username: user.username,
        isAdmin: user.isAdmin,
      },
    })
  } catch (error) {
    console.error('Errore verifica sessione:', error)
    return NextResponse.json({ error: 'Errore verifica sessione' }, { status: 500 })
  }
}

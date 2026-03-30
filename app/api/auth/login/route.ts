import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateToken } from '@/lib/jwt'
import { AUTH_COOKIE_NAME } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username } = body

    // Validazione input
    if (!username || typeof username !== 'string' || username.trim() === '') {
      return NextResponse.json({ error: 'Username richiesto' }, { status: 400 })
    }

    const trimmedUsername = username.trim()

    // Trova o crea utente (auto-registrazione per utenti normali)
    let user = await prisma.user.findUnique({
      where: { username: trimmedUsername },
    })

    // Se l'utente non esiste, crealo (solo se non è un tentativo di login admin)
    if (!user) {
      user = await prisma.user.create({
        data: {
          username: trimmedUsername,
          isAdmin: false, // Gli utenti creati via login normale non sono admin
        },
      })
    }

    // Se l'utente è admin, deve usare l'endpoint admin
    if (user.isAdmin) {
      return NextResponse.json(
        { error: 'Accesso admin non consentito. Usa /admin/login' },
        { status: 403 }
      )
    }

    // Genera JWT token
    const token = await generateToken({
      userId: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
    })

    // Crea response con cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin,
      },
    })

    // Imposta cookie con token (HttpOnly, Secure in production)
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 giorni
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Errore login:', error)
    return NextResponse.json({ error: 'Errore durante il login' }, { status: 500 })
  }
}

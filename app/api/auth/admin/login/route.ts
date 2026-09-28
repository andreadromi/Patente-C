import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateToken } from '@/lib/jwt'
import { AUTH_COOKIE_NAME } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    // Validazione input
    if (!username || typeof username !== 'string' || username.trim() === '') {
      return NextResponse.json({ error: 'Username richiesto' }, { status: 400 })
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password richiesta' }, { status: 400 })
    }

    const trimmedUsername = username.trim()

    // Cerca utente admin
    const user = await prisma.user.findUnique({
      where: { username: trimmedUsername },
    })

    // Verifica esistenza utente
    if (!user) {
      return NextResponse.json({ error: 'Credenziali non valide' }, { status: 401 })
    }

    // Verifica che sia admin
    if (!user.isAdmin) {
      return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })
    }

    // Verifica password
    if (!user.password) {
      return NextResponse.json({ error: 'Password non configurata per questo admin' }, { status: 401 })
    }

    const passwordMatch = await bcrypt.compare(password, user.password)

    if (!passwordMatch) {
      return NextResponse.json({ error: 'Credenziali non valide' }, { status: 401 })
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
    console.error('Errore login admin:', error)
    return NextResponse.json({ error: 'Errore durante il login' }, { status: 500 })
  }
}

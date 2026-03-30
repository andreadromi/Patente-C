import { NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME } from '@/lib/auth'

export async function POST() {
  // Crea response
  const response = NextResponse.json({ success: true })

  // Rimuovi cookie di autenticazione
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0, // Scaduto immediatamente
    path: '/',
  })

  return response
}

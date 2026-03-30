import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/jwt'
import { AUTH_COOKIE_NAME } from './lib/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Route pubbliche (non richiedono autenticazione)
  const publicRoutes = ['/', '/login', '/admin/login']
  const isPublicRoute = publicRoutes.includes(pathname)

  // Se è una route pubblica, permetti sempre accesso
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Route protette
  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/admin')
  const isAdminRoute = pathname.startsWith('/admin')

  // Se non è una route protetta, permetti accesso
  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  // Ottieni token dal cookie
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value

  // Se non c'è token, redirect al login
  if (!token) {
    const loginUrl = isAdminRoute ? '/admin/login' : '/login'
    return NextResponse.redirect(new URL(loginUrl, request.url))
  }

  // Verifica token
  const user = await verifyToken(token)

  // Se token invalido, redirect al login
  if (!user) {
    const loginUrl = isAdminRoute ? '/admin/login' : '/login'
    const response = NextResponse.redirect(new URL(loginUrl, request.url))

    // Rimuovi cookie invalido
    response.cookies.delete(AUTH_COOKIE_NAME)

    return response
  }

  // Se è route admin ma utente non è admin, redirect a dashboard utente
  if (isAdminRoute && !user.isAdmin) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Utente autenticato e autorizzato
  return NextResponse.next()
}

// Configura quali route devono passare per il middleware
export const config = {
  matcher: [
    /*
     * Match tutte le route eccetto:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

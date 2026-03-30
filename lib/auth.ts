import { cookies } from 'next/headers'
import { verifyToken, type JWTPayload } from './jwt'

export const AUTH_COOKIE_NAME = 'auth_token'

/**
 * Ottiene l'utente corrente dalla sessione (cookie)
 * @returns Payload JWT se autenticato, null altrimenti
 */
export async function getCurrentUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value

  if (!token) {
    return null
  }

  return await verifyToken(token)
}

/**
 * Verifica se l'utente è autenticato
 * @returns true se autenticato, false altrimenti
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return user !== null
}

/**
 * Verifica se l'utente è admin
 * @returns true se admin, false altrimenti
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.isAdmin === true
}

/**
 * Richiede autenticazione - lancia errore se non autenticato
 * @returns Payload JWT dell'utente autenticato
 * @throws Error se non autenticato
 */
export async function requireAuth(): Promise<JWTPayload> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Non autenticato')
  }

  return user
}

/**
 * Richiede che l'utente sia admin - lancia errore se non admin
 * @returns Payload JWT dell'admin
 * @throws Error se non autenticato o non admin
 */
export async function requireAdmin(): Promise<JWTPayload> {
  const user = await requireAuth()

  if (!user.isAdmin) {
    throw new Error('Accesso negato: richiesti privilegi admin')
  }

  return user
}

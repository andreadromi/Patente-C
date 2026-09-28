import { cookies } from 'next/headers'
import { verifyToken, AUTH_COOKIE_NAME, type JWTPayload } from './jwt'
import { prisma } from './prisma'

export { AUTH_COOKIE_NAME }

/** L'utente della richiesta. */
export type UtenteCorrente = JWTPayload

/**
 * Ottiene l'utente corrente dalla sessione (cookie)
 * @returns Payload JWT se autenticato, null altrimenti
 */
export async function getCurrentUser(): Promise<UtenteCorrente | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value

  if (!token) {
    return null
  }

  const payload = await verifyToken(token)
  if (!payload) return null

  // Il token vale finché non scade, ma l'utente potrebbe non esserci più
  // (cancellato dall'admin): si controlla a DB, e da lì arrivano anche nome
  // e ruolo aggiornati invece di quelli fotografati al login.
  const utente = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, username: true, isAdmin: true },
  })
  if (!utente) return null
  return {
    userId: utente.id, username: utente.username, isAdmin: utente.isAdmin,
  }
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
 * Utente della richiesta corrente, o null se non autenticato.
 *
 * Restituisce null invece di lanciare un'eccezione: ogni rotta che la usa
 * scrive `if (!user) return 401`, e con un throw quel controllo non veniva
 * mai raggiunto — Next rispondeva 500 al posto di 401.
 */
export async function requireAuth(): Promise<UtenteCorrente | null> {
  return await getCurrentUser()
}

/** Utente della richiesta corrente se è admin, altrimenti null. */
export async function requireAdmin(): Promise<UtenteCorrente | null> {
  const user = await getCurrentUser()
  return user?.isAdmin ? user : null
}

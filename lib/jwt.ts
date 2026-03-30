import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-key'
)

export interface JWTPayload {
  userId: string
  username: string
  isAdmin: boolean
}

/**
 * Genera un JWT token per l'utente
 * @param payload Dati utente da includere nel token
 * @param expiresIn Durata token (default: 7 giorni)
 * @returns JWT token string
 */
export async function generateToken(payload: JWTPayload, expiresIn: string = '7d'): Promise<string> {
  const token = await new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET)

  return token
}

/**
 * Verifica e decodifica un JWT token
 * @param token JWT token da verificare
 * @returns Payload decodificato se valido, null se invalido
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as JWTPayload
  } catch (error) {
    // Token invalido, scaduto o malformato
    return null
  }
}

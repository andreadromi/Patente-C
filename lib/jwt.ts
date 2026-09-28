import { SignJWT, jwtVerify } from 'jose'

/**
 * La chiave dei token. In produzione deve esserci JWT_SECRET: con una chiave
 * di ripiego scritta qui, chiunque legga il codice potrebbe firmarsi da solo
 * un token da amministratore. Senza, il login fallisce e nessun token vale;
 * in sviluppo si usa una chiave locale.
 */
function chiave() {
  const segreto = process.env.JWT_SECRET?.trim()
  if (segreto) return new TextEncoder().encode(segreto)
  if (process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET non configurato')
  return new TextEncoder().encode('solo-sviluppo-locale')
}

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
    .sign(chiave())

  return token
}

/**
 * Verifica e decodifica un JWT token
 * @param token JWT token da verificare
 * @returns Payload decodificato se valido, null se invalido
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, chiave())
    return payload as unknown as JWTPayload
  } catch (error) {
    // Token invalido, scaduto o malformato
    return null
  }
}

/** Nome del cookie di sessione. Sta qui, e non in auth.ts, perché il middleware (edge) non può importare Prisma. */
export const AUTH_COOKIE_NAME = 'auth_token'

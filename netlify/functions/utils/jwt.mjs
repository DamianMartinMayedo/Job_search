import { SignJWT, jwtVerify } from 'jose'

const isProd = process.env.NODE_ENV === 'production' || process.env.NETLIFY === 'true'
if (isProd && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET no configurado en producción')
}

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-change-in-production'
)

export async function createToken(email) {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload
  } catch {
    return null
  }
}

export function getSessionCookie(token) {
  return `session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${7 * 24 * 60 * 60}`
}

export function clearSessionCookie() {
  return 'session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'
}

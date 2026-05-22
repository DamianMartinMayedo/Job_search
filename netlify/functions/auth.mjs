import { createToken, verifyToken, getSessionCookie, clearSessionCookie } from './utils/jwt.mjs'
import { json, error, unauthorized } from './utils/response.mjs'

const AUTH_EMAIL = process.env.AUTH_EMAIL
const AUTH_PASSWORD = process.env.AUTH_PASSWORD

function getCookie(req, name) {
  const header = req.headers.get('cookie') || ''
  const match = header.match(new RegExp(`(^|;\\s*)${name}=([^;]*)`))
  return match ? decodeURIComponent(match[2]) : null
}

async function authenticate(req) {
  const token = getCookie(req, 'session')
  if (!token) return null
  const payload = await verifyToken(token)
  return payload
}

export default async function handler(req) {
  const url = new URL(req.url)
  const path = url.pathname.replace(/^\/api\/auth\/?/, '')

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Credentials': 'true',
      },
    })
  }

  if (path === 'login' && req.method === 'POST') {
    if (!AUTH_EMAIL || !AUTH_PASSWORD) {
      return error('Auth no configurado en el servidor', 500)
    }

    let body
    try {
      body = await req.json()
    } catch {
      return error('JSON inválido', 400)
    }

    const { email, password } = body

    if (email !== AUTH_EMAIL || password !== AUTH_PASSWORD) {
      return error('Email o contraseña incorrectos', 401)
    }

    const token = await createToken(email)
    const cookie = getSessionCookie(token)

    return json({ email }, 200, {
      'Set-Cookie': cookie,
    })
  }

  if (path === 'logout' && req.method === 'POST') {
    return json({ ok: true }, 200, {
      'Set-Cookie': clearSessionCookie(),
    })
  }

  if (path === 'me' && req.method === 'GET') {
    const user = await authenticate(req)
    if (!user) return unauthorized()
    return json({ email: user.email })
  }

  return json({ error: 'Not found' }, 404)
}

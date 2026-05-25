const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_RE.test(email)
}

export const FIELD_LIMITS = {
  name: 200,
  first_name: 100,
  last_name: 100,
  subject: 200,
  body: 50000,
  description: 5000,
  notes: 5000,
  url: 500,
  website: 500,
  linkedin_url: 500,
  job_portal_url: 500,
  domain: 255,
  city: 100,
  region: 100,
  country: 100,
  sector: 100,
  role: 200,
  phone: 50,
  reply_notes: 5000,
  my_name: 200,
  my_role: 200,
  my_web: 500,
  my_email: 320,
}

export const MAX_OFFSET = 100000

export function validateEmailFields(body, fields) {
  for (const f of fields) {
    const v = body[f]
    if (v && !isValidEmail(v)) return `El campo "${f}" no es un email válido`
  }
  return null
}

export function validateLengths(body, limits = FIELD_LIMITS) {
  for (const [field, max] of Object.entries(limits)) {
    const v = body[field]
    if (typeof v === 'string' && v.length > max) {
      return `El campo "${field}" excede la longitud máxima de ${max} caracteres`
    }
  }
  return null
}

export function validateBody(body, emailFields = []) {
  const lengthErr = validateLengths(body)
  if (lengthErr) return lengthErr
  const emailErr = validateEmailFields(body, emailFields)
  if (emailErr) return emailErr
  return null
}

export function clampOffset(page, limit) {
  const p = Math.max(1, parseInt(page) || 1)
  const l = Math.min(parseInt(limit) || 10, 100)
  const rawOffset = (p - 1) * l
  return { page: p, limit: l, offset: Math.min(rawOffset, MAX_OFFSET) }
}

import { verifyToken } from './utils/jwt.mjs'
import { json, error, unauthorized, notFound } from './utils/response.mjs'
import sql from './utils/db.mjs'

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

function parsePath(path) {
  const parts = path.replace(/^\/api\/?/, '').split('/').filter(Boolean)
  return parts
}

async function handleCompanies(method, id, req) {
  if (!sql) return error('Base de datos no configurada', 500)

  if (method === 'GET' && !id) {
    const url = new URL(req.url)
    const status = url.searchParams.get('status')
    const sector = url.searchParams.get('sector')
    const city = url.searchParams.get('city')
    const search = url.searchParams.get('search')
    const page = parseInt(url.searchParams.get('page')) || 1
    const limit = parseInt(url.searchParams.get('limit')) || 10
    const sortBy = url.searchParams.get('sortBy') || 'created_at'
    const sortDir = url.searchParams.get('sortDir') || 'DESC'
    const offset = (page - 1) * limit

    const validSortCols = ['name', 'sector', 'city', 'status', 'created_at', 'primary_email']
    const col = validSortCols.includes(sortBy) ? sortBy : 'created_at'
    const dir = sortDir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'

    const countResult = await sql`
      SELECT COUNT(*) as total FROM companies c
      WHERE 1=1
      ${status ? sql`AND c.status = ${status}` : sql``}
      ${sector ? sql`AND c.sector = ${sector}` : sql``}
      ${city ? sql`AND c.city = ${city}` : sql``}
      ${search ? sql`AND (c.name ILIKE ${'%' + search + '%'} OR c.domain ILIKE ${'%' + search + '%'})` : sql``}
    `

    const companies = await sql`
      SELECT c.*, ct.email as primary_email
      FROM companies c
      LEFT JOIN LATERAL (
        SELECT email FROM contacts
        WHERE company_id = c.id AND is_primary = true
        LIMIT 1
      ) ct ON true
      WHERE 1=1
      ${status ? sql`AND c.status = ${status}` : sql``}
      ${sector ? sql`AND c.sector = ${sector}` : sql``}
      ${city ? sql`AND c.city = ${city}` : sql``}
      ${search ? sql`AND (c.name ILIKE ${'%' + search + '%'} OR c.domain ILIKE ${'%' + search + '%'})` : sql``}
      ORDER BY ${col} ${dir}
      LIMIT ${limit}
      OFFSET ${offset}
    `
    return json({ companies, total: parseInt(countResult[0].total), page, limit })
  }

  if (method === 'GET' && id) {
    const [company] = await sql`SELECT * FROM companies WHERE id = ${id}`
    if (!company) return notFound()

    const contacts = await sql`SELECT * FROM contacts WHERE company_id = ${id} ORDER BY created_at DESC`
    const messages = await sql`
      SELECT m.*, c.first_name as contact_first_name, c.role as contact_role
      FROM messages m
      LEFT JOIN contacts c ON m.contact_id = c.id
      WHERE m.company_id = ${id}
      ORDER BY m.created_at DESC
    `
    const activity = await sql`
      SELECT * FROM activity_log WHERE company_id = ${id} ORDER BY created_at DESC LIMIT 50
    `

    return json({ ...company, contacts, messages, activity })
  }

  if (method === 'POST') {
    const body = await req.json()

    if (body.domain) {
      const [existing] = await sql`SELECT id FROM companies WHERE domain = ${body.domain}`
      if (existing) return error('Ya existe una empresa con ese dominio', 409)
    }

    const keys = Object.keys(body).filter((k) => body[k] !== undefined)
    const [company] = await sql`
      INSERT INTO companies ${sql(body, ...keys)}
      RETURNING *
    `

    await sql`
      INSERT INTO activity_log ${sql({
        company_id: company.id,
        type: 'status_change',
        description: 'Empresa creada',
        metadata: JSON.stringify({}),
      }, 'company_id', 'type', 'description', 'metadata')}
    `

    return json(company, 201)
  }

  if (method === 'PATCH' && id) {
    const body = await req.json()
    const keys = Object.keys(body).filter((k) => body[k] !== undefined)
    const [company] = await sql`
      UPDATE companies SET ${sql(body, ...keys)}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `
    if (!company) return notFound()

    if (body.status) {
      await sql`
        INSERT INTO activity_log ${sql({
          company_id: id,
          type: 'status_change',
          description: `Estado cambiado a '${body.status}'`,
          metadata: JSON.stringify({ to: body.status }),
        }, 'company_id', 'type', 'description', 'metadata')}
      `
    }

    return json(company)
  }

  if (method === 'DELETE' && id) {
    const [company] = await sql`DELETE FROM companies WHERE id = ${id} RETURNING id`
    if (!company) return notFound()
    return json({ ok: true })
  }

  return json({ error: 'Method not allowed' }, 405)
}

async function handleContacts(method, id, req) {
  if (!sql) return error('Base de datos no configurada', 500)

  if (method === 'GET' && !id) {
    const url = new URL(req.url)
    const companyId = url.searchParams.get('company_id')

    const contacts = await sql`
      SELECT c.*, co.name as company_name
      FROM contacts c
      JOIN companies co ON c.company_id = co.id
      ${companyId ? sql`WHERE c.company_id = ${companyId}` : sql``}
      ORDER BY c.created_at DESC
    `

    return json(contacts)
  }

  if (method === 'POST') {
    const body = await req.json()

    if (body.is_primary) {
      await sql`UPDATE contacts SET is_primary = false WHERE company_id = ${body.company_id}`
    }

    const keys = Object.keys(body).filter((k) => body[k] !== undefined)
    const [contact] = await sql`
      INSERT INTO contacts ${sql(body, ...keys)}
      RETURNING *
    `

    await sql`
      INSERT INTO activity_log ${sql({
        company_id: contact.company_id,
        type: 'contact_added',
        description: `Contacto añadido: ${contact.first_name} ${contact.last_name || ''}`,
        metadata: JSON.stringify({ contact_id: contact.id }),
      }, 'company_id', 'type', 'description', 'metadata')}
    `

    return json(contact, 201)
  }

  if (method === 'PATCH' && id) {
    const body = await req.json()

    if (body.is_primary && body.company_id) {
      await sql`UPDATE contacts SET is_primary = false WHERE company_id = ${body.company_id}`
    }

    const keys = Object.keys(body).filter((k) => body[k] !== undefined)
    const [contact] = await sql`
      UPDATE contacts SET ${sql(body, ...keys)}
      WHERE id = ${id}
      RETURNING *
    `
    if (!contact) return notFound()
    return json(contact)
  }

  if (method === 'DELETE' && id) {
    const [contact] = await sql`DELETE FROM contacts WHERE id = ${id} RETURNING id`
    if (!contact) return notFound()
    return json({ ok: true })
  }

  return json({ error: 'Method not allowed' }, 405)
}

async function handleMessages(method, id, req) {
  if (!sql) return error('Base de datos no configurada', 500)

  if (method === 'GET' && !id) {
    const url = new URL(req.url)
    const status = url.searchParams.get('status')
    const today = new Date().toISOString().split('T')[0]

    const messages = await sql`
      SELECT m.*, co.name as company_name, co.sector,
             c.first_name as contact_first_name, c.role as contact_role
      FROM messages m
      JOIN companies co ON m.company_id = co.id
      LEFT JOIN contacts c ON m.contact_id = c.id
      ${status === 'follow_up'
        ? sql`WHERE m.follow_up_at <= ${today} AND m.follow_up_done = false`
        : status
          ? sql`WHERE m.status = ${status}`
          : sql``}
      ${status === 'follow_up'
        ? sql`ORDER BY m.follow_up_at ASC`
        : sql`ORDER BY m.created_at DESC`}
    `
    return json(messages)
  }

  if (method === 'POST') {
    const body = await req.json()

    let followUpAt = null
    if (body.status === 'sent') {
      body.sent_at = new Date().toISOString()
      followUpAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }

    const insertData = { ...body, follow_up_at: followUpAt }
    const keys = Object.keys(insertData).filter((k) => insertData[k] !== undefined)
    const [message] = await sql`
      INSERT INTO messages ${sql(insertData, ...keys)}
      RETURNING *
    `

    await sql`
      INSERT INTO activity_log ${sql({
        company_id: message.company_id,
        type: body.status === 'sent' ? 'message_sent' : 'status_change',
        description: body.status === 'sent' ? 'Mensaje enviado' : 'Borrador creado',
        metadata: JSON.stringify({ message_id: message.id }),
      }, 'company_id', 'type', 'description', 'metadata')}
    `

    return json(message, 201)
  }

  if (method === 'PATCH' && id) {
    const body = await req.json()

    if (body.status === 'sent' && !body.sent_at) {
      body.sent_at = new Date().toISOString()
      body.follow_up_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }

    if (body.status === 'replied') {
      body.replied_at = new Date().toISOString()
    }

    const keys = Object.keys(body).filter((k) => body[k] !== undefined)
    const [message] = await sql`
      UPDATE messages SET ${sql(body, ...keys)}
      WHERE id = ${id}
      RETURNING *
    `
    if (!message) return notFound()

    if (body.status === 'sent') {
      await sql`
        INSERT INTO activity_log ${sql({
          company_id: message.company_id,
          type: 'message_sent',
          description: 'Mensaje marcado como enviado',
          metadata: JSON.stringify({ message_id: id }),
        }, 'company_id', 'type', 'description', 'metadata')}
      `
    } else if (body.status === 'replied') {
      await sql`
        INSERT INTO activity_log ${sql({
          company_id: message.company_id,
          type: 'reply_received',
          description: 'Respuesta recibida',
          metadata: JSON.stringify({ message_id: id }),
        }, 'company_id', 'type', 'description', 'metadata')}
      `
    }

    return json(message)
  }

  return json({ error: 'Method not allowed' }, 405)
}

async function handleTemplates(method, id, req) {
  if (!sql) return error('Base de datos no configurada', 500)

  if (method === 'GET' && !id) {
    const templates = await sql`SELECT * FROM email_templates ORDER BY created_at DESC`
    return json(templates)
  }

  if (method === 'GET' && id) {
    const [template] = await sql`SELECT * FROM email_templates WHERE id = ${id}`
    if (!template) return notFound()
    return json(template)
  }

  if (method === 'POST') {
    const body = await req.json()
    const keys = Object.keys(body).filter((k) => body[k] !== undefined)
    const [template] = await sql`
      INSERT INTO email_templates ${sql(body, ...keys)}
      RETURNING *
    `
    return json(template, 201)
  }

  if (method === 'PATCH' && id) {
    const body = await req.json()
    const keys = Object.keys(body).filter((k) => body[k] !== undefined)
    const [template] = await sql`
      UPDATE email_templates SET ${sql(body, ...keys)}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `
    if (!template) return notFound()
    return json(template)
  }

  if (method === 'DELETE' && id) {
    const [template] = await sql`DELETE FROM email_templates WHERE id = ${id} RETURNING id`
    if (!template) return notFound()
    return json({ ok: true })
  }

  return json({ error: 'Method not allowed' }, 405)
}

async function handleSettings(method, req) {
  if (!sql) return error('Base de datos no configurada', 500)

  if (method === 'GET') {
    const [settings] = await sql`SELECT * FROM settings ORDER BY created_at DESC LIMIT 1`
    return json(settings || {})
  }

  if (method === 'POST' || method === 'PUT') {
    const body = await req.json()
    const [existing] = await sql`SELECT id FROM settings LIMIT 1`

    if (existing) {
      const keys = Object.keys(body).filter((k) => body[k] !== undefined)
      const [updated] = await sql`
        UPDATE settings SET ${sql(body, ...keys)}, updated_at = NOW()
        WHERE id = ${existing.id}
        RETURNING *
      `
      return json(updated)
    } else {
      const keys = Object.keys(body).filter((k) => body[k] !== undefined)
      const [created] = await sql`
        INSERT INTO settings ${sql(body, ...keys)}
        RETURNING *
      `
      return json(created, 201)
    }
  }

  return json({ error: 'Method not allowed' }, 405)
}

async function handleActivity(method, req) {
  if (!sql) return error('Base de datos no configurada', 500)

  const url = new URL(req.url)
  const limit = parseInt(url.searchParams.get('limit')) || 20

  if (method === 'GET') {
    const activities = await sql`
      SELECT al.*, co.name as company_name
      FROM activity_log al
      JOIN companies co ON al.company_id = co.id
      ORDER BY al.created_at DESC
      LIMIT ${limit}
    `
    return json(activities)
  }

  return json({ error: 'Method not allowed' }, 405)
}

async function handlePlaces(req) {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const apiKey = process.env.VITE_GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    return error('Google Places API key no configurada', 500)
  }

  let body
  try {
    body = await req.json()
  } catch {
    return error('JSON inválido', 400)
  }

  const { query, city } = body
  if (!query || !city) {
    return error('query y city son requeridos', 400)
  }

  const textQuery = `${query} en ${city}`

  const response = await fetch(
    'https://places.googleapis.com/v1/places:searchText',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask':
          'places.displayName,places.websiteUri,places.formattedAddress,places.nationalPhoneNumber',
      },
      body: JSON.stringify({
        textQuery,
        languageCode: 'es',
      }),
    }
  )

  const data = await response.json()
  return json(data)
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Credentials': 'true',
      },
    })
  }

  const user = await authenticate(req)
  if (!user) return unauthorized()

  const url = new URL(req.url)
  const [resource, id] = parsePath(url.pathname)

  try {
    switch (resource) {
      case 'companies':
        return handleCompanies(req.method, id, req)
      case 'contacts':
        return handleContacts(req.method, id, req)
      case 'messages':
        return handleMessages(req.method, id, req)
      case 'templates':
        return handleTemplates(req.method, id, req)
      case 'settings':
        return handleSettings(req.method, req)
      case 'activity':
        return handleActivity(req.method, req)
      case 'places':
        return handlePlaces(req)
      default:
        return json({ error: 'Not found' }, 404)
    }
  } catch (err) {
    console.error('API Error:', err)
    return error('Error interno del servidor', 500)
  }
}

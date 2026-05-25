import { verifyToken } from './utils/jwt.mjs'
import { json, error, unauthorized, notFound } from './utils/response.mjs'
import sql from './utils/db.mjs'
import { validateBody, clampOffset } from './utils/validate.mjs'
import { sendEmail } from './utils/mailer.mjs'
import { runAllSources } from './utils/fetchers/index.mjs'
import { getEmailIngestStatus } from './utils/email/imap.mjs'
import { pollEmails, getRecentIngestLog } from './utils/email/router.mjs'

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
    const sortBy = url.searchParams.get('sortBy') || 'created_at'
    const sortDir = url.searchParams.get('sortDir') || 'DESC'
    const { page, limit, offset } = clampOffset(url.searchParams.get('page'), url.searchParams.get('limit'))

    const validSortCols = ['name', 'sector', 'city', 'status', 'interest_level', 'created_at', 'primary_email']
    const col = validSortCols.includes(sortBy) ? sortBy : 'created_at'
    const dir = sortDir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'

    let whereClause = ''
    const params = []
    if (status) {
      params.push(status)
      whereClause += ` AND c.status = $${params.length}`
    } else {
      whereClause += ` AND c.status != 'archived'`
    }
    if (sector) { params.push(sector); whereClause += ` AND c.sector = $${params.length}` }
    if (city) { params.push(`%${city}%`); whereClause += ` AND c.city ILIKE $${params.length}` }
    if (search) { params.push(`%${search}%`); whereClause += ` AND (c.name ILIKE $${params.length} OR c.domain ILIKE $${params.length})` }

    const rows = await sql.unsafe(
      `SELECT c.*, ct.email as primary_email, COUNT(*) OVER ()::int as total_count
       FROM companies c
       LEFT JOIN LATERAL (
         SELECT email FROM contacts
         WHERE company_id = c.id AND is_primary = true
         LIMIT 1
       ) ct ON true
       WHERE 1=1 ${whereClause}
       ORDER BY ${col} ${dir}
       LIMIT ${limit} OFFSET ${offset}`,
      params
    )

    let total = rows[0]?.total_count ?? 0
    if (rows.length === 0) {
      const [{ total: t }] = await sql.unsafe(
        `SELECT COUNT(*)::int as total FROM companies c WHERE 1=1 ${whereClause}`,
        params
      )
      total = t
    }
    const companies = rows.map(({ total_count, ...rest }) => rest)

    return json({ companies, total, page, limit })
  }

  if (method === 'GET' && id) {
    const [company] = await sql`SELECT * FROM companies WHERE id = ${id}`
    if (!company) return notFound()

    const [contacts, messages, activity] = await Promise.all([
      sql`SELECT * FROM contacts WHERE company_id = ${id} ORDER BY created_at DESC`,
      sql`
        SELECT m.*, c.first_name as contact_first_name, c.role as contact_role, c.email as contact_email,
               et.name as template_name
        FROM messages m
        LEFT JOIN contacts c ON m.contact_id = c.id
        LEFT JOIN email_templates et ON m.template_id = et.id
        WHERE m.company_id = ${id}
        ORDER BY m.created_at DESC
      `,
      sql`
        SELECT * FROM activity_log WHERE company_id = ${id} ORDER BY created_at DESC LIMIT 50
      `,
    ])

    return json({ ...company, contacts, messages, activity })
  }

  if (method === 'POST') {
    const body = await req.json()

    const valErr = validateBody(body, ['email'])
    if (valErr) return error(valErr, 400)

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

    const valErr = validateBody(body, ['email'])
    if (valErr) return error(valErr, 400)

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

  if (method === 'POST' && id === 'batch') {
    const body = await req.json()
    const { ids, action, status, interest_level } = body
    if (!ids || !Array.isArray(ids) || ids.length === 0)
      return error('ids requerido (array de UUIDs)', 400)
    if (!['archive', 'delete', 'status', 'interest'].includes(action))
      return error('acción no válida', 400)
    if (action === 'status' && !status)
      return error('status requerido para la acción status', 400)
    if (action === 'interest' && (interest_level == null || interest_level < 1 || interest_level > 5))
      return error('interest_level requerido (1-5) para la acción interest', 400)

    if (action === 'delete') {
      await sql`DELETE FROM companies WHERE id = ANY(${ids})`
      return json({ ok: true, count: ids.length })
    }

    if (action === 'archive') {
      await sql`UPDATE companies SET status = 'archived', updated_at = NOW() WHERE id = ANY(${ids})`
      for (const companyId of ids) {
        await sql`
          INSERT INTO activity_log ${sql({
            company_id: companyId,
            type: 'status_change',
            description: 'Empresa archivada',
            metadata: JSON.stringify({ to: 'archived' }),
          }, 'company_id', 'type', 'description', 'metadata')}
        `
      }
      return json({ ok: true, count: ids.length })
    }

    if (action === 'status') {
      await sql`UPDATE companies SET status = ${status}, updated_at = NOW() WHERE id = ANY(${ids})`
      for (const companyId of ids) {
        await sql`
          INSERT INTO activity_log ${sql({
            company_id: companyId,
            type: 'status_change',
            description: `Estado cambiado a '${status}'`,
            metadata: JSON.stringify({ to: status }),
          }, 'company_id', 'type', 'description', 'metadata')}
        `
      }
      return json({ ok: true, count: ids.length })
    }

    if (action === 'interest') {
      await sql`UPDATE companies SET interest_level = ${interest_level}, updated_at = NOW() WHERE id = ANY(${ids})`
      return json({ ok: true, count: ids.length })
    }
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
    const { page, limit, offset } = clampOffset(url.searchParams.get('page'), url.searchParams.get('limit'))

    let whereClause = ''
    const params = []
    if (companyId) {
      params.push(companyId)
      whereClause = `WHERE c.company_id = $1`
    }

    const rows = await sql.unsafe(
      `SELECT c.*, co.name as company_name, COUNT(*) OVER ()::int as total_count
       FROM contacts c
       JOIN companies co ON c.company_id = co.id
       ${whereClause}
       ORDER BY c.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    )

    let total = rows[0]?.total_count ?? 0
    if (rows.length === 0) {
      const [{ total: t }] = await sql.unsafe(
        `SELECT COUNT(*)::int as total FROM contacts c ${whereClause}`,
        params
      )
      total = t
    }
    const contacts = rows.map(({ total_count, ...rest }) => rest)

    return json({ contacts, total, page, limit })
  }

  if (method === 'POST') {
    const body = await req.json()

    const valErr = validateBody(body, ['email'])
    if (valErr) return error(valErr, 400)

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

    const valErr = validateBody(body, ['email'])
    if (valErr) return error(valErr, 400)

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

  if (method === 'POST' && id === 'batch') {
    const body = await req.json()
    const { ids } = body
    if (!ids || !Array.isArray(ids) || ids.length === 0)
      return error('ids requerido (array de UUIDs)', 400)

    await sql`DELETE FROM contacts WHERE id = ANY(${ids})`
    return json({ ok: true, count: ids.length })
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
    const { page, limit, offset } = clampOffset(url.searchParams.get('page'), url.searchParams.get('limit'))
    const today = new Date().toISOString().split('T')[0]

    let whereClause = ''
    let orderClause = 'ORDER BY m.created_at DESC'
    const params = []

    if (status === 'follow_up') {
      params.push(today)
      whereClause = `WHERE m.follow_up_at <= $1 AND m.follow_up_done = false`
      orderClause = 'ORDER BY m.follow_up_at ASC'
    } else if (status) {
      params.push(status)
      whereClause = `WHERE m.status = $1`
    }

    const baseQuery = `FROM messages m
      JOIN companies co ON m.company_id = co.id
      LEFT JOIN contacts c ON m.contact_id = c.id
      LEFT JOIN email_templates et ON m.template_id = et.id
      ${whereClause}`

    const rows = await sql.unsafe(
      `SELECT m.*, co.name as company_name, co.sector,
              c.first_name as contact_first_name, c.role as contact_role, c.email as contact_email,
              et.name as template_name,
              COUNT(*) OVER ()::int as total_count
       ${baseQuery}
       ${orderClause}
       LIMIT ${limit} OFFSET ${offset}`,
      params
    )

    let total = rows[0]?.total_count ?? 0
    if (rows.length === 0) {
      const [{ total: t }] = await sql.unsafe(
        `SELECT COUNT(*)::int as total ${baseQuery}`,
        params
      )
      total = t
    }
    const messages = rows.map(({ total_count, ...rest }) => rest)

    return json({ messages, total, page, limit })
  }

  if (method === 'POST') {
    const body = await req.json()

    const valErr = validateBody(body, ['recipient_email'])
    if (valErr) return error(valErr, 400)

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

    const valErr = validateBody(body, ['recipient_email'])
    if (valErr) return error(valErr, 400)

    if (body.status === 'sent' && !body.sent_at) {
      body.sent_at = new Date().toISOString()
      body.follow_up_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }

    if (body.status === 'replied' && !body.replied_at) {
      body.replied_at = new Date().toISOString()
    }

    if (body.status === 'replied' || body.status === 'closed') {
      body.follow_up_done = true
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

  if (method === 'POST' && id === 'batch') {
    const body = await req.json()
    const { ids, action, status } = body
    if (!ids || !Array.isArray(ids) || ids.length === 0)
      return error('ids requerido (array de UUIDs)', 400)
    if (!['delete', 'status'].includes(action))
      return error('acción no válida', 400)
    if (action === 'status' && !status)
      return error('status requerido para la acción status', 400)

    if (action === 'delete') {
      const msgs = await sql`SELECT id, company_id FROM messages WHERE id = ANY(${ids})`
      await sql`DELETE FROM messages WHERE id = ANY(${ids})`
      for (const m of msgs) {
        await sql`
          INSERT INTO activity_log ${sql({
            company_id: m.company_id,
            type: 'status_change',
            description: 'Mensaje eliminado',
            metadata: JSON.stringify({ message_id: m.id }),
          }, 'company_id', 'type', 'description', 'metadata')}
        `
      }
      return json({ ok: true, count: ids.length })
    }

    if (action === 'status') {
      if (status === 'sent') {
        const now = new Date().toISOString()
        const followUpAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        await sql`
          UPDATE messages SET status = 'sent', sent_at = ${now}, follow_up_at = ${followUpAt}
          WHERE id = ANY(${ids})
        `
      } else if (status === 'replied') {
        await sql`
          UPDATE messages SET status = 'replied', replied_at = ${new Date().toISOString()}
          WHERE id = ANY(${ids})
        `
      } else if (status === 'closed') {
        await sql`
          UPDATE messages SET status = 'closed', follow_up_done = true
          WHERE id = ANY(${ids})
        `
      } else {
        await sql`UPDATE messages SET status = ${status} WHERE id = ANY(${ids})`
      }
      return json({ ok: true, count: ids.length })
    }
  }

  if (method === 'DELETE' && id) {
    const [message] = await sql`DELETE FROM messages WHERE id = ${id} RETURNING id, company_id`
    if (!message) return notFound()

    await sql`
      INSERT INTO activity_log ${sql({
        company_id: message.company_id,
        type: 'status_change',
        description: 'Mensaje eliminado',
        metadata: JSON.stringify({ message_id: id }),
      }, 'company_id', 'type', 'description', 'metadata')}
    `

    return json({ ok: true, company_id: message.company_id })
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
    const valErr = validateBody(body)
    if (valErr) return error(valErr, 400)
    const keys = Object.keys(body).filter((k) => body[k] !== undefined)
    const [template] = await sql`
      INSERT INTO email_templates ${sql(body, ...keys)}
      RETURNING *
    `
    return json(template, 201)
  }

  if (method === 'PATCH' && id) {
    const body = await req.json()
    const valErr = validateBody(body)
    if (valErr) return error(valErr, 400)
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
    const valErr = validateBody(body, ['my_email'])
    if (valErr) return error(valErr, 400)
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
  if (!response.ok) {
    return error(data?.error?.message || 'Error en la búsqueda de Google Places', response.status)
  }
  return json(data)
}

async function handleSendMessage(req) {
  if (!sql) return error('Base de datos no configurada', 500)
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const body = await req.json()
  const { messageId, pair_name } = body
  if (!messageId) return error('messageId requerido', 400)

  const [message] = await sql`SELECT * FROM messages WHERE id = ${messageId}`
  if (!message) return notFound()
  if (message.smtp_sent_at) return error('El mensaje ya fue entregado por SMTP', 409)

  let to = message.recipient_email
  if (!to && message.contact_id) {
    const [contact] = await sql`SELECT email FROM contacts WHERE id = ${message.contact_id}`
    to = contact?.email
  }
  if (!to) {
    const [company] = await sql`SELECT email FROM companies WHERE id = ${message.company_id}`
    to = company?.email
  }
  if (!to) return error('No se pudo resolver el destinatario', 400)

  try {
    let attachments = null
    if (pair_name) {
      const docs = await sql`SELECT * FROM documents WHERE pair_name = ${pair_name} AND company_id IS NULL`
      if (docs.length > 0) {
        attachments = docs
          .filter((d) => d.content)
          .map((d) => ({
            filename: d.name,
            content: d.content,
          }))
      }
    }

    const result = await sendEmail({
      to,
      subject: message.subject,
      body: message.body,
      attachments,
    })

    // Activity log primero: si SMTP entregó, queremos evidencia aunque el UPDATE
    // posterior falle. El smtp_message_id queda recuperable desde el log.
    await sql`
      INSERT INTO activity_log ${sql({
        company_id: message.company_id,
        type: 'message_sent',
        description: `Mensaje enviado a ${to}`,
        metadata: JSON.stringify({
          message_id: messageId,
          smtp_message_id: result.messageId,
          to,
        }),
      }, 'company_id', 'type', 'description', 'metadata')}
    `

    const nowIso = new Date().toISOString()
    const followUpAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0]

    await sql`
      UPDATE messages SET
        status = 'sent',
        sent_at = COALESCE(sent_at, ${nowIso}),
        smtp_sent_at = ${nowIso},
        smtp_message_id = ${result.messageId || null},
        follow_up_at = ${followUpAt},
        follow_up_done = false,
        recipient_email = COALESCE(recipient_email, ${to})
      WHERE id = ${messageId}
    `

    return json({ ok: true, messageId: result.messageId, to, company_id: message.company_id })
  } catch (err) {
    console.error('Error enviando email:', err)
    return error(`Error al enviar: ${err.message}`, 500)
  }
}

async function handleDocuments(method, id, req) {
  if (!sql) return error('Base de datos no configurada', 500)

  if (method === 'GET' && !id) {
    const url = new URL(req.url)
    const type = url.searchParams.get('type')
    const docs = type
      ? await sql`SELECT id, type, name, company_id, created_at, updated_at FROM documents WHERE type = ${type} ORDER BY created_at DESC`
      : await sql`SELECT id, type, name, company_id, created_at, updated_at FROM documents ORDER BY created_at DESC`
    return json(docs)
  }

  if (method === 'GET' && id) {
    const [doc] = await sql`SELECT * FROM documents WHERE id = ${id}`
    if (!doc) return notFound()
    return json({
      ...doc,
      content: doc.content ? doc.content.toString('base64') : null,
    })
  }

  if (method === 'POST') {
    const body = await req.json()
    if (!body.type || !body.name) return error('type y name son requeridos', 400)
    if (!['cv', 'cover_letter'].includes(body.type)) return error('type debe ser cv o cover_letter', 400)

    const content = body.content ? Buffer.from(body.content, 'base64') : null

    // Si es doc genérico (sin company_id), reemplazar el existente del mismo type
    if (!body.company_id) {
      const [existing] = await sql`SELECT id FROM documents WHERE type = ${body.type} AND company_id IS NULL`
      if (existing) {
        const [updated] = await sql`
          UPDATE documents SET name = ${body.name}, content = ${content}, updated_at = NOW()
          WHERE id = ${existing.id}
          RETURNING id, type, name, company_id, created_at, updated_at
        `
        return json(updated)
      }
    }

    const [doc] = await sql`
      INSERT INTO documents (type, name, content, company_id)
      VALUES (${body.type}, ${body.name}, ${content}, ${body.company_id || null})
      RETURNING id, type, name, company_id, created_at, updated_at
    `
    return json(doc, 201)
  }

  if (method === 'DELETE' && id) {
    const [doc] = await sql`DELETE FROM documents WHERE id = ${id} RETURNING id`
    if (!doc) return notFound()
    return json({ ok: true })
  }

  return json({ error: 'Method not allowed' }, 405)
}

async function handleDocumentPairs(method, id, req) {
  if (!sql) return error('Base de datos no configurada', 500)

  if (method === 'GET') {
    const rows = await sql`
      SELECT
        pair_name,
        jsonb_object_agg(
          type,
          jsonb_build_object(
            'id', id,
            'type', type,
            'name', name,
            'pair_name', pair_name,
            'created_at', created_at,
            'updated_at', updated_at
          )
        ) AS docs
      FROM documents
      WHERE pair_name IS NOT NULL AND company_id IS NULL
      GROUP BY pair_name
      ORDER BY pair_name
    `
    const pairs = rows.map((r) => ({
      pair_name: r.pair_name,
      cv: r.docs?.cv || null,
      cover: r.docs?.cover_letter || null,
    }))
    return json(pairs)
  }

  if (method === 'POST') {
    const { pair_name, cv, cover } = await req.json()
    if (!pair_name) return error('pair_name requerido', 400)
    if (!cv?.name || !cover?.name) return error('CV y carta requeridos', 400)

    // Eliminar docs existentes del par
    await sql`DELETE FROM documents WHERE pair_name = ${pair_name} AND company_id IS NULL`

    const cvContent = cv.content ? Buffer.from(cv.content, 'base64') : null
    const coverContent = cover.content ? Buffer.from(cover.content, 'base64') : null

    const [newCv] = await sql`
      INSERT INTO documents (type, name, content, pair_name)
      VALUES ('cv', ${cv.name}, ${cvContent}, ${pair_name})
      RETURNING id, type, name, pair_name, created_at, updated_at
    `
    const [newCover] = await sql`
      INSERT INTO documents (type, name, content, pair_name)
      VALUES ('cover_letter', ${cover.name}, ${coverContent}, ${pair_name})
      RETURNING id, type, name, pair_name, created_at, updated_at
    `

    return json({ pair_name, cv: newCv, cover: newCover }, 201)
  }

  if (method === 'DELETE' && id) {
    const pairName = decodeURIComponent(id)
    const deleted = await sql`
      DELETE FROM documents WHERE pair_name = ${pairName} AND company_id IS NULL
      RETURNING id
    `
    if (deleted.length === 0) return notFound()
    return json({ ok: true })
  }

  return json({ error: 'Method not allowed' }, 405)
}

async function handleJobOffers(method, id, req) {
  if (!sql) return error('Base de datos no configurada', 500)

  if (method === 'GET' && !id) {
    const url = new URL(req.url)
    const status = url.searchParams.get('status')
    const sourceId = url.searchParams.get('source_id')
    const companyId = url.searchParams.get('company_id')
    const search = url.searchParams.get('search')
    const sortBy = url.searchParams.get('sortBy') || 'posted_at'
    const { page, limit, offset } = clampOffset(url.searchParams.get('page'), url.searchParams.get('limit'))

    const validSort = { posted_at: 'o.posted_at DESC NULLS LAST', scraped_at: 'o.scraped_at DESC', match_score: 'o.match_score DESC NULLS LAST', title: 'o.title ASC' }
    const orderBy = validSort[sortBy] || validSort.posted_at

    let whereClause = 'WHERE 1=1'
    const params = []
    if (status) { params.push(status); whereClause += ` AND o.status = $${params.length}` }
    if (sourceId) { params.push(sourceId); whereClause += ` AND o.source_id = $${params.length}` }
    if (companyId) { params.push(companyId); whereClause += ` AND o.company_id = $${params.length}` }
    if (search) { params.push(`%${search}%`); whereClause += ` AND (o.title ILIKE $${params.length} OR o.company_name ILIKE $${params.length})` }

    const baseQuery = `FROM job_offers o
      LEFT JOIN job_sources s ON o.source_id = s.id
      LEFT JOIN companies c ON o.company_id = c.id
      ${whereClause}`

    const rows = await sql.unsafe(
      `SELECT o.*, s.name as source_name, c.name as company_known_name,
              COUNT(*) OVER ()::int as total_count
       ${baseQuery}
       ORDER BY ${orderBy}
       LIMIT ${limit} OFFSET ${offset}`,
      params
    )

    let total = rows[0]?.total_count ?? 0
    if (rows.length === 0) {
      const [{ total: t }] = await sql.unsafe(
        `SELECT COUNT(*)::int as total ${baseQuery}`,
        params
      )
      total = t
    }
    const offers = rows.map(({ total_count, ...rest }) => rest)

    return json({ offers, total, page, limit })
  }

  if (method === 'GET' && id) {
    const [offer] = await sql`
      SELECT o.*, s.name as source_name, c.name as company_known_name
      FROM job_offers o
      LEFT JOIN job_sources s ON o.source_id = s.id
      LEFT JOIN companies c ON o.company_id = c.id
      WHERE o.id = ${id}
    `
    if (!offer) return notFound()
    return json(offer)
  }

  if (method === 'PATCH' && id) {
    const body = await req.json()
    const valErr = validateBody(body)
    if (valErr) return error(valErr, 400)
    const keys = Object.keys(body).filter((k) => body[k] !== undefined)
    const [offer] = await sql`
      UPDATE job_offers SET ${sql(body, ...keys)}
      WHERE id = ${id}
      RETURNING *
    `
    if (!offer) return notFound()
    return json(offer)
  }

  if (method === 'POST' && id === 'batch') {
    const body = await req.json()
    const { ids, action, status } = body
    if (!ids || !Array.isArray(ids) || ids.length === 0)
      return error('ids requerido (array de UUIDs)', 400)
    if (!['delete', 'status'].includes(action))
      return error('acción no válida', 400)
    if (action === 'status' && !status)
      return error('status requerido para la acción status', 400)

    if (action === 'delete') {
      await sql`DELETE FROM job_offers WHERE id = ANY(${ids})`
    } else {
      await sql`UPDATE job_offers SET status = ${status} WHERE id = ANY(${ids})`
    }
    return json({ ok: true, count: ids.length })
  }

  if (method === 'DELETE' && id) {
    const [offer] = await sql`DELETE FROM job_offers WHERE id = ${id} RETURNING id`
    if (!offer) return notFound()
    return json({ ok: true })
  }

  return json({ error: 'Method not allowed' }, 405)
}

async function handleDashboard(method, id, req) {
  if (!sql) return error('Base de datos no configurada', 500)

  if (id === 'stats' && method === 'GET') {
    const today = new Date().toISOString().split('T')[0]
    const [
      newOffers7d,
      drafts,
      waitingReply,
      followupsToday,
      response30d,
      byStatus,
    ] = await Promise.all([
      sql`SELECT COUNT(*)::int AS n FROM job_offers WHERE status = 'new' AND scraped_at >= NOW() - INTERVAL '7 days'`,
      sql`SELECT COUNT(*)::int AS n FROM messages WHERE status = 'draft'`,
      sql`SELECT COUNT(*)::int AS n FROM messages WHERE status = 'sent' AND replied_at IS NULL`,
      sql`SELECT COUNT(*)::int AS n FROM messages WHERE follow_up_at <= ${today} AND follow_up_done = false`,
      sql`
        SELECT
          COUNT(*) FILTER (WHERE sent_at >= NOW() - INTERVAL '30 days')::int AS sent_30d,
          COUNT(*) FILTER (WHERE sent_at >= NOW() - INTERVAL '30 days' AND replied_at IS NOT NULL)::int AS replied_30d
        FROM messages
      `,
      sql`
        SELECT status, COUNT(*)::int AS n
        FROM companies
        WHERE status != 'archived'
        GROUP BY status
      `,
    ])

    const sent30d = response30d[0]?.sent_30d || 0
    const replied30d = response30d[0]?.replied_30d || 0
    const responseRate = sent30d > 0 ? Math.round((replied30d / sent30d) * 100) : null

    const companyByStatus = Object.fromEntries(byStatus.map((r) => [r.status, r.n]))

    return json({
      newOffers7d: newOffers7d[0].n,
      drafts: drafts[0].n,
      waitingReply: waitingReply[0].n,
      followupsToday: followupsToday[0].n,
      responseRate,           // null si no hay sent en 30d
      responseRateSent: sent30d,
      responseRateReplied: replied30d,
      companyByStatus,
    })
  }

  return json({ error: 'Method not allowed' }, 405)
}

async function handleJobSources(method, id, req) {
  if (!sql) return error('Base de datos no configurada', 500)

  if (id === 'run-now' && method === 'POST') {
    const body = await req.json().catch(() => ({}))
    const opts = {}
    if (body.source_id) opts.sourceId = body.source_id
    if (body.language) opts.language = body.language
    const results = await runAllSources(opts)
    return json({ ok: true, sources: results })
  }

  if (id === 'email-status' && method === 'GET') {
    return json(getEmailIngestStatus())
  }

  if (id === 'poll-emails-now' && method === 'POST') {
    try {
      const summary = await pollEmails()
      return json({ ok: true, ...summary })
    } catch (err) {
      console.error('poll-emails-now error:', err)
      return error(`Error al leer emails: ${err.message}`, 500)
    }
  }

  if (id === 'email-log' && method === 'GET') {
    const url = new URL(req.url)
    const limit = Math.min(parseInt(url.searchParams.get('limit')) || 20, 100)
    const log = await getRecentIngestLog({ limit })
    return json(log)
  }

  if (method === 'GET' && !id) {
    const sources = await sql`
      SELECT s.*, COUNT(o.id)::int as offers_count
      FROM job_sources s
      LEFT JOIN job_offers o ON o.source_id = s.id
      GROUP BY s.id
      ORDER BY s.name
    `
    return json(sources)
  }

  if (method === 'POST') {
    const body = await req.json()
    const valErr = validateBody(body)
    if (valErr) return error(valErr, 400)
    if (!body.name || !body.url || !body.type) return error('name, url y type requeridos', 400)
    const keys = Object.keys(body).filter((k) => body[k] !== undefined)
    const [source] = await sql`
      INSERT INTO job_sources ${sql(body, ...keys)}
      RETURNING *
    `
    return json(source, 201)
  }

  if (method === 'PATCH' && id) {
    const body = await req.json()
    const valErr = validateBody(body)
    if (valErr) return error(valErr, 400)
    const keys = Object.keys(body).filter((k) => body[k] !== undefined)
    const [source] = await sql`
      UPDATE job_sources SET ${sql(body, ...keys)}
      WHERE id = ${id}
      RETURNING *
    `
    if (!source) return notFound()
    return json(source)
  }

  if (method === 'DELETE' && id) {
    const [source] = await sql`DELETE FROM job_sources WHERE id = ${id} RETURNING id`
    if (!source) return notFound()
    return json({ ok: true })
  }

  return json({ error: 'Method not allowed' }, 405)
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
      case 'send-message':
        return handleSendMessage(req)
      case 'documents':
        return handleDocuments(req.method, id, req)
      case 'document_pairs':
        return handleDocumentPairs(req.method, id, req)
      case 'job-offers':
        return handleJobOffers(req.method, id, req)
      case 'job-sources':
        return handleJobSources(req.method, id, req)
      case 'dashboard':
        return handleDashboard(req.method, id, req)
      default:
        return json({ error: 'Not found' }, 404)
    }
  } catch (err) {
    console.error('API Error:', err)
    return error('Error interno del servidor', 500)
  }
}

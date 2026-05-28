import sql from '../db.mjs'
import { fetchUnreadMessages, markAsRead, markAsUnreadByMessageIds } from './imap.mjs'
import * as linkedin from './parsers/linkedin.mjs'
import * as infojobs from './parsers/infojobs.mjs'

// Orden de evaluación: cada parser tiene su `match()`. El primero que matchea gana.
// Los parsers que necesiten un selector más específico van antes que los genéricos.
const PARSERS = [linkedin, infojobs]

function pickParser(msg) {
  for (const p of PARSERS) {
    try {
      if (p.match(msg)) return p
    } catch (err) {
      console.error(`[email-router] parser.match crashed (${p.name}):`, err.message)
    }
  }
  return null
}

function extractDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return null
  }
}

async function resolveCompanyId(offer) {
  const domain = extractDomain(offer.url)
  if (domain) {
    const [byDomain] = await sql`
      SELECT id FROM companies WHERE LOWER(domain) = ${domain} LIMIT 1
    `
    if (byDomain) return byDomain.id
  }
  const name = offer.company_name?.trim()
  if (name) {
    const [byName] = await sql`
      SELECT id FROM companies WHERE name ILIKE ${name} LIMIT 1
    `
    if (byName) return byName.id
  }
  return null
}

async function findOrCreateEmailSource(parserName) {
  // Una "fuente virtual" por parser para que la oferta tenga source_name legible
  // en la UI y para que aparezca dentro del grupo España.
  const fakeUrl = `email://${parserName}`
  const [existing] = await sql`SELECT * FROM job_sources WHERE url = ${fakeUrl}`
  if (existing) return existing
  const label = parserName.charAt(0).toUpperCase() + parserName.slice(1)
  const [created] = await sql`
    INSERT INTO job_sources (name, type, url, language, region, enabled)
    VALUES (${label + ' (email)'}, 'email', ${fakeUrl}, 'es', 'Email', true)
    RETURNING *
  `
  return created
}

async function logIngest({ messageId, from, subject, receivedAt, parser, offersExtracted = 0, error = null }) {
  try {
    await sql`
      INSERT INTO email_ingest_log
        (message_id, from_addr, subject, received_at, parser, offers_extracted, error)
      VALUES (
        ${messageId}, ${from || 'unknown'}, ${subject || null},
        ${receivedAt || new Date()}, ${parser}, ${offersExtracted}, ${error}
      )
      ON CONFLICT (message_id) DO NOTHING
    `
  } catch (err) {
    console.error('[email-router] no se pudo logear ingest:', err.message)
  }
}

async function insertOffers(offers, source) {
  let inserted = 0
  for (const offer of offers) {
    // Dedup por external_id: si la oferta ya existe (mismo id + source) la saltamos.
    // Esto es necesario para parsers de email como Infojobs, donde la url de tracking
    // cambia con cada email aunque la oferta sea la misma.
    if (offer.external_id) {
      const [existing] = await sql`
        SELECT id FROM job_offers
        WHERE source_id = ${source.id} AND external_id = ${offer.external_id}
        LIMIT 1
      `
      if (existing) continue
    }

    const company_id = await resolveCompanyId(offer)
    const row = {
      source_id: source.id,
      external_id: offer.external_id,
      url: offer.url,
      title: offer.title,
      company_name: offer.company_name,
      company_id,
      location: offer.location,
      remote: offer.remote,
      description: offer.description,
      posted_at: offer.posted_at,
    }
    const result = await sql`
      INSERT INTO job_offers ${sql(row, ...Object.keys(row))}
      ON CONFLICT (url) DO NOTHING
      RETURNING id
    `
    if (result.length > 0) inserted++
  }
  return inserted
}

/**
 * Procesa el INBOX:
 *  - Lee mensajes sin leer.
 *  - Por cada uno: dedup por message_id en email_ingest_log → match parser → inserta ofertas.
 *  - Marca como leídos sólo los procesados con éxito (los fallidos vuelven en el siguiente cron).
 *
 * Devuelve un resumen para mostrar al usuario.
 */
export async function pollEmails({ limit = 50 } = {}) {
  console.log(`[email-router] pollEmails(limit=${limit})`)
  const messages = await fetchUnreadMessages({ limit })
  if (messages.length === 0) {
    return { fetched: 0, processed: 0, totalOffers: 0, byParser: {}, errors: [] }
  }

  const okUids = []
  const byParser = {}
  const errors = []
  let totalOffers = 0
  let processed = 0

  for (const msg of messages) {
    if (!msg.messageId) {
      errors.push({ uid: msg.uid, error: 'Sin Message-Id' })
      continue
    }

    // Dedup: si ya hay log con este message_id, marcar leído y saltar.
    const [exists] = await sql`SELECT id FROM email_ingest_log WHERE message_id = ${msg.messageId}`
    if (exists) {
      okUids.push(msg.uid)
      continue
    }

    const parser = pickParser(msg)
    if (!parser) {
      await logIngest({
        messageId: msg.messageId,
        from: msg.from,
        subject: msg.subject,
        receivedAt: msg.date,
        parser: 'unmatched',
      })
      okUids.push(msg.uid) // marcamos leído para no procesar de nuevo; el usuario puede revisar el log
      continue
    }

    try {
      const offers = parser.parse(msg)
      const source = await findOrCreateEmailSource(parser.name)
      const inserted = await insertOffers(offers, source)
      await logIngest({
        messageId: msg.messageId,
        from: msg.from,
        subject: msg.subject,
        receivedAt: msg.date,
        parser: parser.name,
        offersExtracted: inserted,
      })
      byParser[parser.name] = (byParser[parser.name] || 0) + inserted
      totalOffers += inserted
      processed++
      okUids.push(msg.uid)
    } catch (err) {
      console.error(`[email-router] parser ${parser.name} crashed para uid=${msg.uid}:`, err)
      await logIngest({
        messageId: msg.messageId,
        from: msg.from,
        subject: msg.subject,
        receivedAt: msg.date,
        parser: parser.name,
        error: err.message?.slice(0, 500) || String(err),
      })
      errors.push({ uid: msg.uid, parser: parser.name, error: err.message })
      // NO marcamos como leído → próximo cron reintenta.
    }
  }

  if (okUids.length > 0) {
    try {
      await markAsRead(okUids)
    } catch (err) {
      console.error('[email-router] markAsRead falló:', err.message)
    }
  }

  return {
    fetched: messages.length,
    processed,
    totalOffers,
    byParser,
    errors,
  }
}

/**
 * Re-encola los emails que en su día se loguearon como `unmatched`:
 *   1. Los marca como NO leídos en Gmail (vía búsqueda por Message-Id).
 *   2. Borra sus filas del email_ingest_log para anular el dedup.
 * El siguiente `pollEmails()` los traerá de nuevo y, si ya hay un parser
 * que los matchea (p.ej. acabamos de añadir Infojobs), se procesarán bien.
 *
 * Devuelve resumen { found, reopened, missingInGmail, logsDeleted }.
 */
export async function reprocessUnmatched({ limit = 200 } = {}) {
  const rows = await sql`
    SELECT message_id FROM email_ingest_log
    WHERE parser = 'unmatched' AND message_id IS NOT NULL
    ORDER BY processed_at DESC
    LIMIT ${limit}
  `
  if (rows.length === 0) {
    return { found: 0, reopened: 0, missingInGmail: 0, logsDeleted: 0 }
  }
  const messageIds = rows.map((r) => r.message_id)
  let matched = []
  let missing = []
  try {
    const result = await markAsUnreadByMessageIds(messageIds)
    matched = result.matched
    missing = result.missing
  } catch (err) {
    console.error('[email-router] reprocessUnmatched: markAsUnread falló:', err.message)
    throw err
  }

  // Borramos del log SOLO los que pudimos reabrir en Gmail. Los `missing`
  // (emails que ya no están en el folder) los dejamos para no perder traza.
  let logsDeleted = 0
  if (matched.length > 0) {
    const deleted = await sql`
      DELETE FROM email_ingest_log
      WHERE message_id IN ${sql(matched)}
      RETURNING id
    `
    logsDeleted = deleted.length
  }

  return {
    found: rows.length,
    reopened: matched.length,
    missingInGmail: missing.length,
    logsDeleted,
  }
}

export async function getRecentIngestLog({ limit = 20 } = {}) {
  return sql`
    SELECT id, message_id, from_addr, subject, received_at, parser, offers_extracted, error, processed_at
    FROM email_ingest_log
    ORDER BY processed_at DESC
    LIMIT ${limit}
  `
}

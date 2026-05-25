import sql from '../db.mjs'
import { fetchRssOffers } from './rss.mjs'

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

async function runSource(source) {
  let offers
  if (source.type === 'rss') {
    offers = await fetchRssOffers(source)
  } else {
    throw new Error(`Tipo de fuente no soportado todavía: ${source.type}`)
  }

  let inserted = 0
  for (const offer of offers) {
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

  return { fetched: offers.length, inserted }
}

export async function runAllSources({ sourceId } = {}) {
  const sources = sourceId
    ? await sql`SELECT * FROM job_sources WHERE id = ${sourceId}`
    : await sql`SELECT * FROM job_sources WHERE enabled = true ORDER BY name`

  const results = []
  for (const source of sources) {
    const startedAt = Date.now()
    try {
      const r = await runSource(source)
      await sql`
        UPDATE job_sources SET last_run_at = NOW(), last_error = NULL WHERE id = ${source.id}
      `
      results.push({ source_id: source.id, source: source.name, ok: true, ms: Date.now() - startedAt, ...r })
    } catch (err) {
      console.error(`Error en fuente ${source.name}:`, err)
      await sql`
        UPDATE job_sources SET last_run_at = NOW(), last_error = ${err.message} WHERE id = ${source.id}
      `
      results.push({ source_id: source.id, source: source.name, ok: false, ms: Date.now() - startedAt, error: err.message })
    }
  }
  return results
}

import sql from './utils/db.mjs'
import { fetchRssOffers } from './utils/fetchers/rss.mjs'

async function runSource(source) {
  let offers
  if (source.type === 'rss') {
    offers = await fetchRssOffers(source)
  } else {
    throw new Error(`Tipo de fuente no soportado todavía: ${source.type}`)
  }

  let inserted = 0
  for (const offer of offers) {
    const row = {
      source_id: source.id,
      external_id: offer.external_id,
      url: offer.url,
      title: offer.title,
      company_name: offer.company_name,
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

export default async function handler() {
  if (!sql) {
    console.error('scheduled-fetch-offers: DATABASE_URL no configurada')
    return new Response(JSON.stringify({ error: 'DB not configured' }), { status: 500 })
  }

  const sources = await sql`SELECT * FROM job_sources WHERE enabled = true ORDER BY name`
  const results = []

  for (const source of sources) {
    const startedAt = Date.now()
    try {
      const r = await runSource(source)
      await sql`
        UPDATE job_sources SET last_run_at = NOW(), last_error = NULL WHERE id = ${source.id}
      `
      results.push({ source: source.name, ok: true, ms: Date.now() - startedAt, ...r })
    } catch (err) {
      console.error(`Error en fuente ${source.name}:`, err)
      await sql`
        UPDATE job_sources SET last_run_at = NOW(), last_error = ${err.message} WHERE id = ${source.id}
      `
      results.push({ source: source.name, ok: false, ms: Date.now() - startedAt, error: err.message })
    }
  }

  return new Response(JSON.stringify({ ok: true, sources: results }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

export const config = {
  schedule: '0 8 * * *', // cada día a las 08:00 UTC
}

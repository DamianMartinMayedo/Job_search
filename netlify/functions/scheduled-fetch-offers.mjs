import sql from './utils/db.mjs'
import { runAllSources } from './utils/fetchers/index.mjs'

export default async function handler() {
  if (!sql) {
    console.error('scheduled-fetch-offers: DATABASE_URL no configurada')
    return new Response(JSON.stringify({ error: 'DB not configured' }), { status: 500 })
  }
  const sources = await runAllSources()
  return new Response(JSON.stringify({ ok: true, sources }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

export const config = {
  schedule: '0 8 * * *', // diario 08:00 UTC
}

import postgres from 'postgres'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.warn('DATABASE_URL not set. Database functions will not work.')
}

// Reuse the same client across hot-reloads in netlify dev. Without this, every
// rebundle re-runs this module and opens a fresh pool to Neon, exhausting the
// free-tier connection limit and causing intermittent connect timeouts.
const sql = databaseUrl
  ? (globalThis.__pgClient ||= postgres(databaseUrl, {
      max: 1,
      idle_timeout: 10,
      connect_timeout: 5,
      prepare: false,
    }))
  : null

export default sql

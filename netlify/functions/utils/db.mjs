import postgres from 'postgres'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.warn('DATABASE_URL not set. Database functions will not work.')
}

const sql = databaseUrl
  ? postgres(databaseUrl, {
      max: 1,
      idle_timeout: 10,
      connect_timeout: 5,
    })
  : null

export default sql

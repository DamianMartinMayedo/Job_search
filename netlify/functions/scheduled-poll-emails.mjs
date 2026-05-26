import sql from './utils/db.mjs'
import { isEmailIngestConfigured } from './utils/email/imap.mjs'
import { pollEmails } from './utils/email/router.mjs'

export default async function handler() {
  if (!sql) {
    console.error('scheduled-poll-emails: DATABASE_URL no configurada')
    return new Response(JSON.stringify({ error: 'DB not configured' }), { status: 500 })
  }
  if (!isEmailIngestConfigured()) {
    console.log('scheduled-poll-emails: IMAP no configurado, saltando')
    return new Response(JSON.stringify({ ok: true, skipped: 'IMAP no configurado' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }

  try {
    const summary = await pollEmails()
    return new Response(JSON.stringify({ ok: true, ...summary }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  } catch (err) {
    console.error('scheduled-poll-emails: error', err)
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })
  }
}

export const config = {
  // Dos veces al día a las 7:00 y 16:00 UTC. En España:
  //   - Verano (CEST, UTC+2): 9:00 y 18:00
  //   - Invierno (CET, UTC+1): 8:00 y 17:00
  // Netlify cron es siempre UTC y no aplica DST.
  schedule: '0 7,16 * * *',
}

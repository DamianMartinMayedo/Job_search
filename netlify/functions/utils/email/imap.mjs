import { ImapFlow } from 'imapflow'
import { simpleParser } from 'mailparser'

/**
 * Wrapper sobre imapflow + mailparser para Netlify Functions.
 * No cacheamos cliente entre invocaciones: cada cron/manual abre una conexión
 * corta a Gmail y la cierra. Más simple y robusto que reusar entre warm starts.
 */

export function isEmailIngestConfigured() {
  return !!(process.env.IMAP_USER && process.env.IMAP_APP_PASSWORD)
}

export function getEmailIngestStatus() {
  return {
    configured: isEmailIngestConfigured(),
    user: process.env.IMAP_USER || null,
    host: process.env.IMAP_HOST || 'imap.gmail.com',
    port: parseInt(process.env.IMAP_PORT) || 993,
    folder: process.env.IMAP_FOLDER || 'INBOX',
  }
}

function defaultFolder() {
  return process.env.IMAP_FOLDER || 'INBOX'
}

async function createClient() {
  const user = process.env.IMAP_USER
  const pass = process.env.IMAP_APP_PASSWORD
  if (!user || !pass) {
    throw new Error('IMAP_USER o IMAP_APP_PASSWORD no configurados')
  }
  const client = new ImapFlow({
    host: process.env.IMAP_HOST || 'imap.gmail.com',
    port: parseInt(process.env.IMAP_PORT) || 993,
    secure: true,
    auth: { user, pass },
    logger: false,
  })
  await client.connect()
  return client
}

/**
 * Abre conexión, locka el folder, ejecuta `fn(client)` y cierra. Garantiza
 * release/logout incluso si la callback lanza.
 */
async function withInbox(folder, fn) {
  const client = await createClient()
  try {
    const lock = await client.getMailboxLock(folder)
    try {
      return await fn(client)
    } finally {
      lock.release()
    }
  } finally {
    await client.logout().catch(() => {})
  }
}

/**
 * Fetch + parse de mensajes sin leer. NO los marca como leídos: deja esa
 * decisión al caller para poder reintentar si el parser falla.
 *
 * Devuelve: [{ uid, messageId, from, fromName, subject, date, html, text }]
 */
export async function fetchUnreadMessages({ folder = defaultFolder(), limit = 50 } = {}) {
  return withInbox(folder, async (client) => {
    const uids = await client.search({ seen: false })
    if (!uids || uids.length === 0) return []
    // Limitar para no descargar miles si el INBOX está sin tocar.
    const toFetch = uids.slice(-limit)

    const messages = []
    for await (const msg of client.fetch(toFetch, { source: true, envelope: true, uid: true })) {
      try {
        const parsed = await simpleParser(msg.source)
        messages.push({
          uid: msg.uid,
          messageId: parsed.messageId || msg.envelope?.messageId || null,
          from: parsed.from?.value?.[0]?.address || msg.envelope?.from?.[0]?.address || null,
          fromName: parsed.from?.value?.[0]?.name || msg.envelope?.from?.[0]?.name || null,
          subject: parsed.subject || msg.envelope?.subject || null,
          date: parsed.date || msg.envelope?.date || null,
          html: parsed.html || '',
          text: parsed.text || '',
        })
      } catch (err) {
        console.error(`[imap] no se pudo parsear uid=${msg.uid}:`, err.message)
      }
    }
    return messages
  })
}

/**
 * Marca uids como leídos. Reabre conexión para no asumir nada del caller.
 */
export async function markAsRead(uids, folder = defaultFolder()) {
  if (!uids || uids.length === 0) return
  return withInbox(folder, async (client) => {
    await client.messageFlagsAdd(uids, ['\\Seen'], { uid: true })
  })
}

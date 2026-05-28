/**
 * Parser para emails de alerta de Tecnoempleo (alertas@push.tecnoempleo.com).
 *
 * Estrategia de extracción:
 *   1. Encontrar todos los links de tracking: href='https://www.tecnoempleo.com/tracking.php?cid=JWT'
 *      El HTML de Tecnoempleo usa comillas simples en los atributos.
 *   2. Decodificar el payload JWT (base64url) → campo `dest` = URL canónica de la oferta.
 *      No se sigue ningún redirect: la URL canónica es estable y directamente linkable.
 *   3. external_id = segmento `rf-HASH` del path de la URL canónica.
 *   4. Título: texto del <b> dentro del mismo anchor de tracking.
 *   5. Empresa y ubicación: los dos primeros <td> del siguiente <tr> tras el anchor.
 *
 * Ejemplo de URL canónica:
 *   https://www.tecnoempleo.com/disenador-grafico-multimedia/photoshop-illustrator/rf-46361b5a222ce3272c41
 */

const FROM_DOMAIN_RE = /\.tecnoempleo\.(?:com|es)$/i
const SUBJECT_HINT_RE = /(alerta|alertas|oferta|nueva|empleo)/i

export const name = 'tecnoempleo'

export function match({ from, subject }) {
  if (!from) return false
  const atIdx = from.lastIndexOf('@')
  if (atIdx < 0) return false
  const domain = from.slice(atIdx + 1).replace(/[>\s].*/g, '').toLowerCase()
  if (!FROM_DOMAIN_RE.test(domain)) return false
  if (!subject) return true
  return SUBJECT_HINT_RE.test(subject)
}

function stripTags(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
}

function decodeEntities(s) {
  if (!s) return s
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&euro;/g, '€')
    .replace(/&aacute;/g, 'á').replace(/&eacute;/g, 'é').replace(/&iacute;/g, 'í')
    .replace(/&oacute;/g, 'ó').replace(/&uacute;/g, 'ú').replace(/&ntilde;/g, 'ñ')
    .replace(/&Aacute;/g, 'Á').replace(/&Eacute;/g, 'É').replace(/&Iacute;/g, 'Í')
    .replace(/&Oacute;/g, 'Ó').replace(/&Uacute;/g, 'Ú').replace(/&Ntilde;/g, 'Ñ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
}

/**
 * Decodifica el payload del JWT de tracking de Tecnoempleo.
 * No verifica la firma — sólo necesitamos el campo `dest`.
 */
function decodeJwtPayload(token) {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    // base64url → base64 estándar
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = Buffer.from(b64, 'base64').toString('utf8')
    return JSON.parse(json)
  } catch {
    return null
  }
}

/**
 * Extrae el segmento rf-HASH del path de la URL canónica.
 * Ejemplo: /disenador-grafico/js/rf-46361b5a222ce3272c41 → rf-46361b5a222ce3272c41
 */
function extractRfId(url) {
  const m = /\/(rf-[a-z0-9]+)(?:[/?#]|$)/i.exec(url)
  return m ? m[1] : null
}

function classifyRemote(text) {
  if (!text) return null
  if (/100\s*%\s*remoto|teletrabajo|en remoto|full\s*remote/i.test(text)) return true
  if (/h[íi]brido/i.test(text)) return null
  return null
}

export function parse({ html }) {
  const offers = []
  if (!html) {
    console.log('[tecnoempleo] parse: html vacío, nada que procesar')
    return offers
  }

  // Tecnoempleo usa comillas simples en sus hrefs. Buscamos el patrón de tracking.
  // Regex captura: (1) el JWT cid, (2) el resto del tag anchor hasta el cierre,
  // de forma que podamos extraer el <b>título</b> y seguir buscando empresa/ubicación.
  const trackingRe = /href='https?:\/\/www\.tecnoempleo\.com\/tracking\.php\?cid=([A-Za-z0-9._-]+)'([^>]*)>([\s\S]*?)<\/a>/gi

  const seen = new Set()
  let m

  while ((m = trackingRe.exec(html)) !== null) {
    const cid = m[1]
    const anchorContent = m[3]
    const fullMatchEnd = m.index + m[0].length

    // Decodificar JWT para obtener la URL canónica
    const payload = decodeJwtPayload(cid)
    const destUrl = payload?.dest || null

    if (!destUrl) {
      console.log('[tecnoempleo] parse: no se pudo decodificar cid JWT:', cid.slice(0, 40))
      continue
    }

    const externalId = extractRfId(destUrl)

    // Dedup por external_id dentro del mismo email
    if (externalId && seen.has(externalId)) continue
    if (externalId) seen.add(externalId)

    // Título: texto del <b> dentro del anchor, o todo el texto del anchor
    const boldM = /<b[^>]*>([\s\S]*?)<\/b>/i.exec(anchorContent)
    const title = boldM
      ? decodeEntities(stripTags(boldM[1])).trim()
      : decodeEntities(stripTags(anchorContent)).trim() || null

    // Empresa y ubicación: buscar en los ~1500 chars siguientes al cierre del anchor.
    // En el HTML de Tecnoempleo la estructura es:
    //   </a>              ← ya pasamos esto
    //   </td></tr>        ← cierra la fila del título
    //   <tr><td ...>      ← siguiente fila: "Empresa - <span>Ciudad</span>"
    //   <tr><td ...>      ← otra fila: skills / jornada
    const after = html.slice(fullMatchEnd, fullMatchEnd + 1500)

    // Primera <td> de la siguiente fila: contiene "Empresa - Ciudad"
    const tdRe = /<td\b[^>]*>([\s\S]*?)<\/td>/gi
    let company = null
    let location = null
    let remote = null

    // Saltar la primera <td> que pudiera ser el propio cierre de la fila del título
    // (si hay un </td> inmediato antes de una <tr>) y buscar la primera con contenido útil.
    let tm
    let found = 0
    while ((tm = tdRe.exec(after)) !== null && found < 3) {
      const raw = decodeEntities(stripTags(tm[1]))
      if (!raw || raw.length < 2) continue // celdas vacías / imágenes
      found++
      if (found === 1) {
        // "Empresa S.L. - <span>Madrid</span>" o "Empresa - 100% Remoto"
        // El guión separa empresa de la parte de ubicación.
        const dashIdx = raw.indexOf(' - ')
        if (dashIdx >= 0) {
          company = raw.slice(0, dashIdx).trim() || null
          const locPart = raw.slice(dashIdx + 3).trim()
          location = locPart || null
          remote = classifyRemote(locPart)
        } else {
          company = raw || null
        }
        break
      }
    }

    offers.push({
      external_id: externalId,
      url: destUrl,
      title: title || `Tecnoempleo ${externalId || cid.slice(0, 8)}`,
      company_name: company,
      location,
      remote,
      description: null,
      posted_at: null,
    })
  }

  if (offers.length === 0) {
    console.log(
      '[tecnoempleo] parse: no se encontraron ofertas. html.length=',
      html.length,
      '| inicio:',
      html.slice(0, 300).replace(/\s+/g, ' '),
    )
  }

  return offers
}

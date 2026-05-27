/**
 * Parser para emails de alerta de Infojobs (ofertas@push.infojobs.net).
 *
 * Estrategia de extracción:
 *   1. Encontrar todos los job-IDs buscando `push-of-i<HASH>` en el HTML.
 *      El hash aparece una sola vez por oferta (en name="push-of-iHASH").
 *   2. Para cada hit, buscar en los ~400 chars previos el atributo
 *      id="oferta_nombre_<TITLE>" que está en el mismo <a>: mucho más limpio
 *      que parsear el texto del anchor.
 *   3. Empresa y ubicación se extraen de los dos primeros <td class="text">
 *      que siguen al </a> de título.
 *
 * URL canónica: https://www.infojobs.net/of-iHASH (forma corta estable).
 */

const FROM_DOMAIN_RE = /\.infojobs\.net$/i
const SUBJECT_HINT_RE = /(oferta|ofertas|alerta|empleo|nueva)/i

export const name = 'infojobs'

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

function classifyRemote(modeRaw) {
  if (!modeRaw) return null
  if (/remot|teletrabajo|en remoto/i.test(modeRaw)) return true
  return null
}

export function parse({ html }) {
  const offers = []
  if (!html) {
    console.log('[infojobs] parse: html vacío, nada que procesar')
    return offers
  }

  // Paso 1: encontrar todos los job-IDs. El patrón `push-of-i<HASH>` aparece
  // en el atributo name= del anchor de título. Usamos un regex simple que no
  // depende de estructura de atributos.
  const idRe = /push-of-(i[a-z0-9]+)/gi
  const seen = new Set()
  const hits = []
  let m
  while ((m = idRe.exec(html)) !== null) {
    const id = m[1]
    if (!seen.has(id)) {
      seen.add(id)
      hits.push({ id, pos: m.index })
    }
  }

  if (hits.length === 0) {
    // Diagnóstico: log primeros 300 chars para ayudar a detectar cambios de markup
    console.log('[infojobs] parse: no se encontró push-of-i<HASH>. html.length=', html.length,
      '| inicio:', html.slice(0, 300).replace(/\s+/g, ' '))
    return offers
  }

  for (let i = 0; i < hits.length; i++) {
    const { id, pos } = hits[i]

    // Paso 2: título — buscar id="oferta_nombre_<TITLE>" en los ~800 chars
    // anteriores al hit (el id= aparece en el mismo <a> que el name=).
    const before = html.slice(Math.max(0, pos - 800), pos)
    const titleM = /id=["']oferta_nombre_([^"']+)["']/i.exec(before)
    const title = titleM ? decodeEntities(titleM[1].trim()) : null

    // Paso 3: empresa y ubicación — en los ~1500 chars posteriores al hit
    // buscar el </a> de cierre y luego los dos primeros <td class="text">.
    const nextHitPos = hits[i + 1]?.pos ?? html.length
    const after = html.slice(pos, Math.min(nextHitPos, pos + 1500))

    // Saltar hasta el cierre del anchor (</a>)
    const closeA = after.indexOf('</a>')
    const afterA = closeA >= 0 ? after.slice(closeA + 4) : after

    const tdRe = /<td\b[^>]*class=["']text["'][^>]*>([\s\S]*?)<\/td>/gi
    const tds = []
    let tm
    while ((tm = tdRe.exec(afterA)) !== null) {
      const txt = decodeEntities(stripTags(tm[1]))
      if (txt) tds.push(txt)
      if (tds.length >= 2) break
    }

    const company = tds[0] || null
    const metaLine = tds[1] || null
    let location = null
    let remote = null
    if (metaLine) {
      const parts = metaLine.split('|').map((p) => p.trim()).filter(Boolean)
      location = parts[0] || null
      remote = classifyRemote(parts[1])
    }

    offers.push({
      external_id: id,
      url: `https://www.infojobs.net/of-${id}`,
      title: title || `Infojobs ${id}`,
      company_name: company,
      location,
      remote,
      description: null,
      posted_at: null,
    })
  }

  return offers
}

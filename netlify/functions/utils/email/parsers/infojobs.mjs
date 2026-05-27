/**
 * Parser para emails de alerta de Infojobs.
 *
 * Estructura observada en los emails de "Alerta de empleo InfoJobs"
 * (from: ofertas@push.infojobs.net):
 *
 *   <a id="oferta_nombre_<TITLE>" name="push-of-i<HASH>" href="<TRACKING_URL>">
 *     <TITLE>
 *   </a>
 *   <td class="text" ...>EMPRESA</td>
 *   <td class="text" ...>Ciudad | Modalidad | Contrato | Salario</td>
 *
 * El href apunta a link.push.infojobs.net (tracker que cambia cada email),
 * así que reconstruimos la URL canónica usando el hash del atributo `name`:
 *   https://www.infojobs.net/of-i<HASH>
 * que es la forma corta estable de los permalinks de Infojobs.
 *
 * Tolerante a fallos: si el HTML cambia, devuelve []. El router registra
 * el caso y deja el email sin marcar como leído para reintento.
 */

const FROM_DOMAIN_RE = /(^|@|\.)infojobs\.net$/i

const SUBJECT_HINT_RE = /(oferta|ofertas|alerta|empleo|nueva)/i

export const name = 'infojobs'

export function match({ from, subject }) {
  if (!from) return false
  const domain = (from.split('@')[1] || '').toLowerCase().replace(/[>\s].*$/, '')
  if (!FROM_DOMAIN_RE.test(domain)) return false
  // Infojobs manda varios tipos de email (alertas, mensajes de empresa,
  // newsletters). Aceptamos los que mencionan ofertas/alertas en el subject;
  // si el subject está vacío, también aceptamos (el parse devolverá [] si
  // no hay ofertas y el router lo registrará limpio).
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
    .replace(/&aacute;/g, 'á')
    .replace(/&eacute;/g, 'é')
    .replace(/&iacute;/g, 'í')
    .replace(/&oacute;/g, 'ó')
    .replace(/&uacute;/g, 'ú')
    .replace(/&ntilde;/g, 'ñ')
    .replace(/&Aacute;/g, 'Á')
    .replace(/&Eacute;/g, 'É')
    .replace(/&Iacute;/g, 'Í')
    .replace(/&Oacute;/g, 'Ó')
    .replace(/&Uacute;/g, 'Ú')
    .replace(/&Ntilde;/g, 'Ñ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
}

function classifyRemote(modeRaw) {
  if (!modeRaw) return null
  const mode = modeRaw.toLowerCase()
  if (/remot|teletrabajo|en remoto/.test(mode)) return true
  return null
}

export function parse({ html }) {
  const offers = []
  if (!html) return offers

  // Cada anchor con name="push-of-i<HASH>" es el título de una oferta.
  // El segundo anchor de cada bloque (la flechita) no tiene atributo `name`,
  // así que filtrar por `name=push-of-` elimina los duplicados solos.
  const anchorRe =
    /<a\b[^>]*\bname=["']push-of-(i[a-z0-9]+)["'][^>]*>([\s\S]*?)<\/a>/gi

  const blocks = []
  let m
  while ((m = anchorRe.exec(html)) !== null) {
    blocks.push({
      id: m[1],
      titleHtml: m[2],
      start: m.index,
      end: m.index + m[0].length,
    })
  }

  if (blocks.length === 0) return offers

  const seen = new Set()

  for (let i = 0; i < blocks.length; i++) {
    const cur = blocks[i]
    if (seen.has(cur.id)) continue
    seen.add(cur.id)

    const title = decodeEntities(stripTags(cur.titleHtml))
    const canonicalUrl = `https://www.infojobs.net/of-${cur.id}`

    // Recorte entre este anchor y el siguiente (o 2000 chars como tope) para
    // sacar empresa y ubicación sin contaminarse de la siguiente oferta.
    const sliceEnd = blocks[i + 1]?.start ?? Math.min(html.length, cur.end + 2000)
    const after = html.slice(cur.end, sliceEnd)

    // Los datos vienen en dos <td class="text" ...>: primera línea empresa,
    // segunda línea "Ciudad | Modalidad | Contrato | Salario".
    const tdRe = /<td\b[^>]*class=["']text["'][^>]*>([\s\S]*?)<\/td>/gi
    const tds = []
    let tm
    while ((tm = tdRe.exec(after)) !== null) {
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
      external_id: cur.id,
      url: canonicalUrl,
      title: title || `Infojobs ${cur.id}`,
      company_name: company,
      location,
      remote,
      description: null,
      posted_at: null,
    })
  }

  return offers
}

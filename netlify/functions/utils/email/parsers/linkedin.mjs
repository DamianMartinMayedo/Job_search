/**
 * Parser para emails de LinkedIn Job Alerts.
 *
 * LinkedIn cambia el HTML cada 6-12 meses pero el patrón de URL canónica
 * (linkedin.com/comm/jobs/view/<JOB_ID>) es estable desde hace años.
 * Estrategia: extraer todas las JOB_ID únicas y reconstruir la URL canónica
 * + título cuando podamos. Si el HTML cambia, el extractor de título degrada
 * a null pero la URL sigue funcionando.
 *
 * Tolerante a fallos: si nada hace match devolvemos []. El router registra
 * el caso como error y deja el email sin marcar como leído para reintento.
 */

const FROM_RE = /(?:^|<)(jobs-noreply|jobalerts-noreply|notifications-noreply)@linkedin\.com>?$/i
const SUBJECT_HINT_RE = /(empleos|jobs|alertas?|alert|recomend|recommended|new jobs)/i

export function match({ from, subject }) {
  if (!from) return false
  if (!/linkedin\.com$/i.test(from.split('@')[1] || '')) return false
  // LinkedIn manda muchos tipos de email; sólo nos interesan los de ofertas.
  if (subject && SUBJECT_HINT_RE.test(subject)) return true
  if (FROM_RE.test(from)) return true
  return false
}

export const name = 'linkedin'

const JOB_URL_RE = /https?:\/\/(?:www\.)?linkedin\.com\/comm\/jobs\/view\/(\d+)[^"'\s<>]*/gi

// Texto de CTAs típicos que NO son títulos. Se filtran al elegir candidato.
const CTA_BLACKLIST = new Set([
  'apply', 'aplica', 'aplicar', 'postular', 'ver oferta', 'ver', 'view job', 'view',
  'show more', 'leer más', 'leer mas', 'ver más', 'ver mas',
  'easy apply', 'apply now', 'apply easily',
  'see more', 'show', 'jobs', 'empleos',
])

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
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
}

function isLikelyTitle(text) {
  if (!text) return false
  const lower = text.toLowerCase().trim()
  if (CTA_BLACKLIST.has(lower)) return false
  if (lower.length < 8 || lower.length > 160) return false
  // Si es solo "1234" o URL pelada, fuera.
  if (/^https?:\/\//.test(lower)) return false
  if (/^\d+$/.test(lower)) return false
  return true
}

// Devuelve TODOS los anchors del HTML que apuntan al JOB_ID dado. Cada uno
// con su texto interno limpio.
function findAllAnchorsForJob(html, jobId) {
  const anchors = []
  // <a ... href="...comm/jobs/view/JOB_ID..." ...> CONTENT </a>
  const re = new RegExp(
    `<a\\b[^>]*href=["'][^"']*comm\\/jobs\\/view\\/${jobId}[^"']*["'][^>]*>([\\s\\S]*?)<\\/a>`,
    'gi'
  )
  let m
  while ((m = re.exec(html)) !== null) {
    const inner = m[1]
    const text = decodeEntities(stripTags(inner))
    if (text) anchors.push({ text, index: m.index })
  }
  return anchors
}

// Como último fallback: busca un <h1>/<h2>/<h3> en los 800 chars anteriores
// a la primera URL del JOB_ID. En emails de LinkedIn el título suele ser un
// heading justo encima de los CTAs.
function findHeadingBefore(html, anchorIndex) {
  const start = Math.max(0, anchorIndex - 800)
  const window = html.slice(start, anchorIndex)
  const re = /<h[1-4]\b[^>]*>([\s\S]*?)<\/h[1-4]>/gi
  let last = null
  let m
  while ((m = re.exec(window)) !== null) {
    last = m[1]
  }
  if (!last) return null
  const text = decodeEntities(stripTags(last))
  return isLikelyTitle(text) ? text : null
}

function pickTitle(html, jobId) {
  const anchors = findAllAnchorsForJob(html, jobId)
  // Candidatos: textos de los anchors que pasan el filtro de título.
  const candidates = anchors
    .map((a) => a.text)
    .filter(isLikelyTitle)
  if (candidates.length > 0) {
    // El título suele ser el anchor más largo, no el del CTA.
    return candidates.sort((a, b) => b.length - a.length)[0]
  }
  // Fallback: heading anterior a la primera ocurrencia.
  if (anchors.length > 0) {
    const heading = findHeadingBefore(html, anchors[0].index)
    if (heading) return heading
  }
  return null
}

// El text/plain de los emails de Job Alert de LinkedIn tiene un patrón estable
// y muy limpio: 3 líneas (título, empresa, ubicación) seguidas de
// "Ver anuncio de empleo: <URL>". Lo aprovechamos como fuente primaria.
//
// Devuelve Map<jobId, { title, company, location, url }>.
function parseLinkedInPlainText(text) {
  const map = new Map()
  if (!text) return map
  // mailparser ya decodifica quoted-printable, pero por si acaso desenvolvemos
  // continuaciones "=\n" que dejaría el codificador 7bit.
  const clean = text.replace(/=\r?\n/g, '')
  // Caza tanto el español ("Ver anuncio de empleo:") como variantes inglesas
  // ("View job:") por si la cuenta del usuario está en EN.
  const re = /(?:Ver anuncio de empleo|View job|View jobs?):\s*(https?:\/\/[^\s\n]*?\/jobs\/view\/(\d+)[^\s\n]*)/gi
  let prevIdx = 0
  let m
  while ((m = re.exec(clean)) !== null) {
    const url = m[1]
    const jobId = m[2]
    // Tomamos las 3 últimas líneas NO vacías antes del marker "Ver anuncio…":
    // por convención de LinkedIn → título, empresa, ubicación (en ese orden).
    const before = clean.slice(prevIdx, m.index)
    const lines = before.split('\n').map((l) => l.trim()).filter(Boolean)
    const last3 = lines.slice(-3)
    if (last3.length === 3 && !map.has(jobId)) {
      const [title, company, location] = last3
      map.set(jobId, { title, company, location, url })
    }
    prevIdx = m.index + m[0].length
  }
  return map
}

function isRemoteLocation(loc) {
  if (!loc) return null
  return /\b(remote|remoto|remota|teletrabajo|fully remote|world[\s-]?wide)\b/i.test(loc)
    ? true
    : null
}

export function parse({ html, text }) {
  const offers = []
  if (!html && !text) return offers
  const textMeta = parseLinkedInPlainText(text)
  const seen = new Set()

  if (html) {
    let m
    JOB_URL_RE.lastIndex = 0
    while ((m = JOB_URL_RE.exec(html)) !== null) {
      const jobId = m[1]
      if (seen.has(jobId)) continue
      seen.add(jobId)
      const canonicalUrl = `https://www.linkedin.com/jobs/view/${jobId}/`
      // text/plain gana sobre HTML cuando los dos tienen datos: el text trae
      // título limpio + empresa + ciudad, mientras que el HTML solo nos da el título.
      const meta = textMeta.get(jobId)
      const titleFromHtml = pickTitle(html, jobId)
      offers.push({
        external_id: jobId,
        url: canonicalUrl,
        title: meta?.title || titleFromHtml || `LinkedIn job ${jobId}`,
        company_name: meta?.company || null,
        location: meta?.location || null,
        remote: isRemoteLocation(meta?.location),
        description: null,
        posted_at: null,
      })
    }
  }

  // Fallback al text/plain si HTML no dio nada — caso raro pero útil para emails
  // que llegan sin parte HTML válida.
  if (offers.length === 0 && textMeta.size > 0) {
    for (const [jobId, meta] of textMeta) {
      if (seen.has(jobId)) continue
      seen.add(jobId)
      offers.push({
        external_id: jobId,
        url: meta.url || `https://www.linkedin.com/jobs/view/${jobId}/`,
        title: meta.title || `LinkedIn job ${jobId}`,
        company_name: meta.company || null,
        location: meta.location || null,
        remote: isRemoteLocation(meta.location),
        description: null,
        posted_at: null,
      })
    }
  }

  return offers
}

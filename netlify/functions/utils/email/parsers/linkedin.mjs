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

function findEnclosingAnchor(html, urlMatchIndex) {
  // Busca el <a ...> que abre antes del índice y el </a> que cierra después.
  // Devuelve { open, close } o null.
  const openStart = html.lastIndexOf('<a ', urlMatchIndex)
  if (openStart < 0) return null
  const openEnd = html.indexOf('>', openStart)
  if (openEnd < 0 || openEnd > urlMatchIndex) return null
  const closeStart = html.indexOf('</a>', urlMatchIndex)
  if (closeStart < 0) return null
  return {
    inner: html.slice(openEnd + 1, closeStart),
    end: closeStart + 4,
  }
}

export function parse({ html, text }) {
  const offers = []
  if (!html) return offers
  const seen = new Set()

  let m
  JOB_URL_RE.lastIndex = 0
  while ((m = JOB_URL_RE.exec(html)) !== null) {
    const jobId = m[1]
    if (seen.has(jobId)) continue
    seen.add(jobId)

    const canonicalUrl = `https://www.linkedin.com/jobs/view/${jobId}/`

    // Intentar título desde el contenido del <a> que envuelve esta URL.
    let title = null
    const anchor = findEnclosingAnchor(html, m.index)
    if (anchor) {
      const txt = decodeEntities(stripTags(anchor.inner))
      // Filtros: textos muy cortos suelen ser "Ver oferta" o iconos. Demasiado
      // largo suele incluir empresa+ubicación juntos.
      if (txt && txt.length >= 5 && txt.length <= 200) {
        title = txt
      }
    }

    offers.push({
      external_id: jobId,
      url: canonicalUrl,
      title: title || `LinkedIn job ${jobId}`,
      company_name: null, // se rellenará en futuras iteraciones si conseguimos selectors estables
      location: null,
      remote: null,
      description: null,
      posted_at: null,
    })
  }

  // Fallback: si no encontramos nada en HTML pero el texto plano menciona
  // URLs, intentamos también ahí.
  if (offers.length === 0 && text) {
    let tm
    const textRe = new RegExp(JOB_URL_RE.source, 'gi')
    while ((tm = textRe.exec(text)) !== null) {
      const jobId = tm[1]
      if (seen.has(jobId)) continue
      seen.add(jobId)
      offers.push({
        external_id: jobId,
        url: `https://www.linkedin.com/jobs/view/${jobId}/`,
        title: `LinkedIn job ${jobId}`,
        company_name: null,
        location: null,
        remote: null,
        description: null,
        posted_at: null,
      })
    }
  }

  return offers
}

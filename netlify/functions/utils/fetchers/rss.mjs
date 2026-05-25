import { XMLParser } from 'fast-xml-parser'

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  trimValues: true,
})

function pickText(node) {
  if (node == null) return null
  if (typeof node === 'string') return node
  if (typeof node === 'object') {
    if (node['#text']) return String(node['#text'])
    if (node['@_href']) return String(node['@_href'])
  }
  return null
}

function pickLink(item) {
  // RSS 2.0 → <link>url</link>; Atom → <link href="url" />
  const link = item.link
  if (!link) return null
  if (typeof link === 'string') return link
  if (Array.isArray(link)) {
    const alt = link.find((l) => !l['@_rel'] || l['@_rel'] === 'alternate')
    return alt?.['@_href'] || alt?.['#text'] || link[0]['@_href'] || null
  }
  return link['@_href'] || link['#text'] || null
}

function parseDate(value) {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

function stripHtml(html) {
  if (!html) return null
  return String(html).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() || null
}

// Heurísticas opcionales para localizar campos típicos de portales españoles
function inferLocation(item) {
  const explicit =
    pickText(item['job:location']) ||
    pickText(item['georss:point']) ||
    pickText(item.location)
  if (explicit) return explicit
  const desc = stripHtml(pickText(item.description))
  if (!desc) return null
  const m = desc.match(/(?:Ubicaci[óo]n|Localizaci[óo]n|Location)\s*[:\-]\s*([^\n.,]{2,60})/i)
  return m ? m[1].trim() : null
}

function inferRemote(item) {
  const blob = `${pickText(item.title) || ''} ${stripHtml(pickText(item.description)) || ''}`.toLowerCase()
  if (/\bremoto\b|\bteletrabajo\b|\bremote\b|\bworld[\s-]?wide\b/.test(blob)) return true
  if (/\bpresencial\b|\bon[\s-]?site\b/.test(blob)) return false
  return null
}

function normalizeItem(item) {
  const url = pickLink(item)
  if (!url) return null

  const guid = item.guid
  const externalId =
    (typeof guid === 'string' ? guid : guid?.['#text']) ||
    item.id ||
    url

  return {
    external_id: String(externalId),
    url,
    title: pickText(item.title) || '(sin título)',
    company_name: pickText(item['dc:creator']) || pickText(item.author) || null,
    location: inferLocation(item),
    remote: inferRemote(item),
    description: stripHtml(pickText(item.description) || pickText(item.summary) || pickText(item.content)),
    posted_at: parseDate(pickText(item.pubDate) || pickText(item.published) || pickText(item.updated)),
  }
}

export async function fetchRssOffers(source) {
  const res = await fetch(source.url, {
    headers: {
      'User-Agent': 'job-search-crm/1.0 (+personal use)',
      Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml',
    },
  })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} al leer ${source.url}`)
  }
  const xml = await res.text()
  const doc = parser.parse(xml)

  // RSS 2.0: rss.channel.item ; Atom: feed.entry
  const items =
    doc?.rss?.channel?.item ||
    doc?.feed?.entry ||
    []
  const list = Array.isArray(items) ? items : [items]

  return list.map(normalizeItem).filter(Boolean)
}

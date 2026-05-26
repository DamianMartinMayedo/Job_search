// Catálogo de portales que se pueden añadir desde el wizard "Nueva fuente".
// Cada portal expone un `build(values)` que devuelve { name, url, language, region }
// a partir de los valores que el usuario seleccionó en los `fields`.
//
// Si un portal no tiene `fields`, se crea con la URL fija directamente.

const TECNOEMPLEO_PROVINCES = [
  { value: '', label: 'Toda España' },
  { value: '231', label: 'A Coruña' },
  { value: '232', label: 'Álava' },
  { value: '233', label: 'Albacete' },
  { value: '234', label: 'Alicante' },
  { value: '235', label: 'Almería' },
  { value: '236', label: 'Asturias' },
  { value: '237', label: 'Ávila' },
  { value: '238', label: 'Badajoz' },
  { value: '239', label: 'Baleares' },
  { value: '240', label: 'Barcelona' },
  { value: '241', label: 'Bizkaia' },
  { value: '242', label: 'Burgos' },
  { value: '243', label: 'Cáceres' },
  { value: '244', label: 'Cádiz' },
  { value: '245', label: 'Cantabria' },
  { value: '246', label: 'Castellón' },
  { value: '247', label: 'Ceuta' },
  { value: '248', label: 'Ciudad Real' },
  { value: '249', label: 'Córdoba' },
  { value: '250', label: 'Cuenca' },
  { value: '251', label: 'Gipuzkoa' },
  { value: '252', label: 'Girona' },
  { value: '253', label: 'Granada' },
  { value: '254', label: 'Guadalajara' },
  { value: '255', label: 'Huelva' },
  { value: '256', label: 'Huesca' },
  { value: '257', label: 'Jaén' },
  { value: '258', label: 'La Rioja' },
  { value: '259', label: 'Las Palmas' },
  { value: '260', label: 'León' },
  { value: '261', label: 'Lugo' },
  { value: '262', label: 'Lleida' },
  { value: '263', label: 'Madrid' },
  { value: '264', label: 'Málaga' },
  { value: '265', label: 'Melilla' },
  { value: '266', label: 'Murcia' },
  { value: '267', label: 'Navarra' },
  { value: '268', label: 'Ourense' },
  { value: '269', label: 'Palencia' },
  { value: '270', label: 'Pontevedra' },
  { value: '271', label: 'Salamanca' },
  { value: '272', label: 'Santa Cruz de Tenerife' },
  { value: '273', label: 'Segovia' },
  { value: '274', label: 'Sevilla' },
  { value: '275', label: 'Soria' },
  { value: '276', label: 'Tarragona' },
  { value: '277', label: 'Teruel' },
  { value: '278', label: 'Toledo' },
  { value: '279', label: 'Valencia' },
  { value: '280', label: 'Valladolid' },
  { value: '281', label: 'Zamora' },
  { value: '282', label: 'Zaragoza' },
]

// Keywords aceptadas por el filtro `te=` (tecnologías) de Tecnoempleo.
// Son libres — el portal acepta cualquier cadena. Pre-curo las más útiles
// para perfil UX/UI; el usuario puede escribir cualquier otra.
const TECNOEMPLEO_KEYWORDS = [
  { value: '', label: 'Sin filtro' },
  { value: 'diseño', label: 'Diseño (general)' },
  { value: 'ux', label: 'UX' },
  { value: 'ui', label: 'UI' },
  { value: 'frontend', label: 'Frontend' },
  { value: 'producto', label: 'Producto' },
  { value: 'web', label: 'Web' },
]

// Categorías oficiales de WeWorkRemotely (slug usado en /categories/<slug>.rss).
const WWR_CATEGORIES = [
  { value: 'remote-design-jobs', label: 'Diseño' },
  { value: 'remote-product-jobs', label: 'Producto' },
  { value: 'remote-front-end-programming-jobs', label: 'Front-End' },
  { value: 'remote-full-stack-programming-jobs', label: 'Full-Stack' },
  { value: 'remote-back-end-programming-jobs', label: 'Back-End' },
  { value: 'remote-software-developer-jobs', label: 'Software Development' },
  { value: 'remote-devops-sysadmin-jobs', label: 'DevOps / Sysadmin' },
  { value: 'remote-management-and-finance-jobs', label: 'Management / Finance' },
  { value: 'remote-sales-and-marketing-jobs', label: 'Sales / Marketing' },
  { value: 'remote-customer-support-jobs', label: 'Customer Support' },
  { value: 'all-other-remote-jobs', label: 'Otros' },
]

// Tags abiertas de RemoteOK. El portal genera /remote-<tag>-jobs.rss para cualquier tag.
const REMOTEOK_TAGS = [
  { value: 'design', label: 'Design (general)' },
  { value: 'ux', label: 'UX' },
  { value: 'ui', label: 'UI' },
  { value: 'product-design', label: 'Product Design' },
  { value: 'frontend', label: 'Frontend' },
  { value: 'dev', label: 'Dev (general)' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'product', label: 'Product' },
]

// Categorías oficiales de Remotive (slug usado en /remote-jobs/feed/<slug>).
const REMOTIVE_CATEGORIES = [
  { value: 'design', label: 'Diseño' },
  { value: 'product', label: 'Product Management' },
  { value: 'software-development', label: 'Software Development' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'customer-service', label: 'Customer Service' },
  { value: 'data', label: 'Data & Analytics' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'devops', label: 'DevOps' },
  { value: 'qa', label: 'QA' },
  { value: 'artificial-intelligence', label: 'AI' },
  { value: 'business-development', label: 'Business Development' },
  { value: 'writing', label: 'Writing' },
]

function labelFromOptions(options, value) {
  return options.find((o) => o.value === value)?.label || value
}

export const JOB_PORTAL_CATALOG = [
  {
    id: 'tecnoempleo',
    label: 'Tecnoempleo',
    description: 'Empleo tech en España. Filtra por provincia y tecnología.',
    language: 'es',
    region: 'España',
    fields: [
      {
        key: 'province',
        label: 'Provincia',
        type: 'select',
        options: TECNOEMPLEO_PROVINCES,
        default: '274', // Sevilla
      },
      {
        key: 'keyword',
        label: 'Área / Tecnología',
        type: 'select-or-custom',
        options: TECNOEMPLEO_KEYWORDS,
        default: '',
        customLabel: 'Otra keyword…',
        customPlaceholder: 'Ej: react',
      },
    ],
    build: ({ province, keyword }) => {
      const params = new URLSearchParams()
      if (province) params.set('pr', province)
      if (keyword) params.set('te', keyword)
      const qs = params.toString()
      const url = `https://www.tecnoempleo.com/alertas-empleo-rss.php${qs ? '?' + qs : ''}`
      const provinceLabel = TECNOEMPLEO_PROVINCES.find((p) => p.value === province)?.label || 'España'
      const region = provinceLabel
      const parts = ['Tecnoempleo', provinceLabel]
      if (keyword) parts.push(keyword)
      return {
        name: parts.join(' · '),
        url,
        language: 'es',
        region,
        type: 'rss',
      }
    },
  },
  {
    id: 'weworkremotely',
    label: 'WeWorkRemotely',
    description: 'Tablón internacional de ofertas remotas. Categorías oficiales del portal.',
    language: 'en',
    region: 'Remoto',
    fields: [
      {
        key: 'category',
        label: 'Categoría',
        type: 'select-or-custom',
        options: WWR_CATEGORIES,
        default: 'remote-design-jobs',
        customLabel: 'Otro slug oficial…',
        customPlaceholder: 'Ej: remote-data-jobs',
      },
    ],
    build: ({ category }) => ({
      name: `WeWorkRemotely · ${labelFromOptions(WWR_CATEGORIES, category)}`,
      url: category ? `https://weworkremotely.com/categories/${category}.rss` : '',
      language: 'en',
      region: 'Remoto',
      type: 'rss',
    }),
  },
  {
    id: 'remoteok',
    label: 'RemoteOK',
    description: 'Acepta tags libres. Empieza por una predefinida o escribe la tuya.',
    language: 'en',
    region: 'Remoto',
    fields: [
      {
        key: 'tag',
        label: 'Tag / Área',
        type: 'select-or-custom',
        options: REMOTEOK_TAGS,
        default: 'design',
        customLabel: 'Otra tag…',
        customPlaceholder: 'Ej: figma',
      },
    ],
    build: ({ tag }) => {
      const slug = (tag || '').trim().toLowerCase()
      return {
        name: `RemoteOK · ${labelFromOptions(REMOTEOK_TAGS, slug)}`,
        url: slug ? `https://remoteok.com/remote-${slug}-jobs.rss` : '',
        language: 'en',
        region: 'Remoto',
        type: 'rss',
      }
    },
  },
  {
    id: 'remotive',
    label: 'Remotive',
    description: 'Feed curado. Categorías oficiales del portal.',
    language: 'en',
    region: 'Remoto',
    fields: [
      {
        key: 'category',
        label: 'Categoría',
        type: 'select-or-custom',
        options: REMOTIVE_CATEGORIES,
        default: 'design',
        customLabel: 'Otra categoría…',
        customPlaceholder: 'Ej: writing',
      },
    ],
    build: ({ category }) => ({
      name: `Remotive · ${labelFromOptions(REMOTIVE_CATEGORIES, category)}`,
      url: category ? `https://remotive.com/remote-jobs/feed/${category}` : '',
      language: 'en',
      region: 'Remoto',
      type: 'rss',
    }),
  },
  {
    id: 'custom',
    label: 'Otro feed RSS personalizado',
    description: 'Pega cualquier URL RSS/Atom (Indeed alerta, otro portal con feed propio…).',
    language: '',
    region: '',
    fields: [
      { key: 'name', label: 'Nombre interno', type: 'text', placeholder: 'Ej: Mi feed favorito' },
      { key: 'url', label: 'URL del feed', type: 'text', placeholder: 'https://...' },
      {
        key: 'language',
        label: 'Grupo',
        type: 'select',
        options: [
          { value: 'es', label: '🇪🇸 España' },
          { value: 'en', label: '🌍 Internacional' },
        ],
        default: 'es',
      },
      { key: 'region', label: 'Región / etiqueta (opcional)', type: 'text', placeholder: 'Sevilla, Remoto…' },
    ],
    build: ({ name, url, language, region }) => ({
      name: name?.trim() || 'Feed personalizado',
      url: url?.trim() || '',
      language: language || null,
      region: region?.trim() || null,
      type: 'rss',
    }),
  },
]

export function getPortalById(id) {
  return JOB_PORTAL_CATALOG.find((p) => p.id === id) || null
}

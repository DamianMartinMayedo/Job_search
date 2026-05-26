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
    id: 'weworkremotely-design',
    label: 'WeWorkRemotely · Diseño',
    description: 'Tablón internacional de ofertas remotas de diseño.',
    language: 'en',
    region: 'Remoto',
    fields: [],
    build: () => ({
      name: 'WeWorkRemotely · Diseño',
      url: 'https://weworkremotely.com/categories/remote-design-jobs.rss',
      language: 'en',
      region: 'Remoto',
      type: 'rss',
    }),
  },
  {
    id: 'remoteok-ux',
    label: 'RemoteOK · UX',
    description: 'Ofertas UX remotas en RemoteOK.',
    language: 'en',
    region: 'Remoto',
    fields: [],
    build: () => ({
      name: 'RemoteOK · UX',
      url: 'https://remoteok.com/remote-ux-jobs.rss',
      language: 'en',
      region: 'Remoto',
      type: 'rss',
    }),
  },
  {
    id: 'remoteok-design',
    label: 'RemoteOK · Diseño',
    description: 'Mezcla diseño gráfico, producto y UX.',
    language: 'en',
    region: 'Remoto',
    fields: [],
    build: () => ({
      name: 'RemoteOK · Diseño',
      url: 'https://remoteok.com/remote-design-jobs.rss',
      language: 'en',
      region: 'Remoto',
      type: 'rss',
    }),
  },
  {
    id: 'remotive-design',
    label: 'Remotive · Diseño',
    description: 'Feed curado de ofertas remotas de diseño.',
    language: 'en',
    region: 'Remoto',
    fields: [],
    build: () => ({
      name: 'Remotive · Diseño',
      url: 'https://remotive.com/remote-jobs/feed/design',
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

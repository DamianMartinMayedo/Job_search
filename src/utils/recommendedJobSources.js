// Fuentes RSS recomendadas para UX/UI Designer en España.
// Orden: ES/español primero, luego tablones remotos internacionales
// (en inglés pero con ofertas EU y empresas remote-friendly).
export const RECOMMENDED_JOB_SOURCES = [
  {
    name: 'Tecnoempleo',
    url: 'https://www.tecnoempleo.com/rss.xml',
    type: 'rss',
    region: 'España',
    language: 'es',
    note: 'Empleo tech en España (la única gran fuente nacional con RSS público). Cubre desarrollo, diseño y producto. Para filtrar por UX/UI: entra a tecnoempleo.com, haz una búsqueda con tus criterios y copia la URL del feed de esa búsqueda.',
  },
  {
    name: 'WeWorkRemotely · Diseño',
    url: 'https://weworkremotely.com/categories/remote-design-jobs.rss',
    type: 'rss',
    region: 'Remoto',
    language: 'en',
    note: 'Ofertas remotas de diseño. En inglés, pero muchas son worldwide y aceptan España.',
  },
  {
    name: 'RemoteOK · UX',
    url: 'https://remoteok.com/remote-ux-jobs.rss',
    type: 'rss',
    region: 'Remoto',
    language: 'en',
  },
  {
    name: 'RemoteOK · Diseño',
    url: 'https://remoteok.com/remote-design-jobs.rss',
    type: 'rss',
    region: 'Remoto',
    language: 'en',
  },
  {
    name: 'Remotive · Diseño',
    url: 'https://remotive.com/remote-jobs/feed/design',
    type: 'rss',
    region: 'Remoto',
    language: 'en',
    note: 'Tablón curado de ofertas remotas de diseño.',
  },
  {
    name: 'Working Nomads · Diseño',
    url: 'https://www.workingnomads.com/jobsrss?category=design',
    type: 'rss',
    region: 'Remoto',
    language: 'en',
  },
]

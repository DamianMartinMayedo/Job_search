// Fuentes RSS recomendadas para UX/UI Designer.
// Verificadas que devuelven contenido válido. España primero (Tecnoempleo
// por provincia), luego tablones remotos internacionales en inglés.
// InfoJobs, LinkedIn, Manfred y Domestika no tienen RSS — para esos
// usaremos ingesta por email (panel separado en Ajustes).
export const RECOMMENDED_JOB_SOURCES = [
  {
    name: 'Tecnoempleo · Sevilla',
    url: 'https://www.tecnoempleo.com/alertas-empleo-rss.php?pr=274',
    type: 'rss',
    region: 'Sevilla',
    language: 'es',
    note: 'Ofertas tech publicadas en Sevilla. Incluye remoto y presencial.',
  },
  {
    name: 'Tecnoempleo · Madrid',
    url: 'https://www.tecnoempleo.com/alertas-empleo-rss.php?pr=263',
    type: 'rss',
    region: 'Madrid',
    language: 'es',
    note: 'Ofertas tech publicadas en Madrid.',
  },
  {
    name: 'Tecnoempleo · España (todas)',
    url: 'https://www.tecnoempleo.com/alertas-empleo-rss.php',
    type: 'rss',
    region: 'España',
    language: 'es',
    note: 'Todas las ofertas tech de España, sin filtro de provincia.',
  },
  {
    name: 'WeWorkRemotely · Diseño',
    url: 'https://weworkremotely.com/categories/remote-design-jobs.rss',
    type: 'rss',
    region: 'Remoto',
    language: 'en',
    note: 'Tablón general de ofertas remotas de diseño. Suele tener ~15-20 vacantes activas.',
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
    note: 'Mezcla diseño gráfico, producto y UX.',
  },
  {
    name: 'Remotive · Diseño',
    url: 'https://remotive.com/remote-jobs/feed/design',
    type: 'rss',
    region: 'Remoto',
    language: 'en',
    note: 'Feed curado, suele ir más vacío que los otros pero filtran calidad.',
  },
]

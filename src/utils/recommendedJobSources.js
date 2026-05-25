// Fuentes RSS recomendadas para UX/UI Designer.
// Sólo se incluyen feeds verificados que devuelven contenido válido a día de hoy.
// Los portales españoles grandes (Tecnoempleo, InfoJobs, LinkedIn, Indeed, Manfred)
// no exponen RSS público, así que la lista es de tablones remotos internacionales
// (en inglés). Muchas de sus ofertas son worldwide y aceptan España.
export const RECOMMENDED_JOB_SOURCES = [
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

ALTER TABLE job_sources ADD COLUMN IF NOT EXISTS language TEXT;
ALTER TABLE job_sources ADD COLUMN IF NOT EXISTS region TEXT;

-- Backfill para las fuentes ya creadas (heurística por URL).
UPDATE job_sources SET language = 'es', region = 'Sevilla'
  WHERE language IS NULL AND url LIKE '%tecnoempleo.com%' AND url LIKE '%pr=274%';
UPDATE job_sources SET language = 'es', region = 'Madrid'
  WHERE language IS NULL AND url LIKE '%tecnoempleo.com%' AND url LIKE '%pr=263%';
UPDATE job_sources SET language = 'es', region = 'España'
  WHERE language IS NULL AND url LIKE '%tecnoempleo.com%';

UPDATE job_sources SET language = 'en', region = 'Remoto'
  WHERE language IS NULL
    AND (url LIKE '%weworkremotely%' OR url LIKE '%remoteok%' OR url LIKE '%remotive%' OR url LIKE '%workingnomads%');

COMMENT ON COLUMN job_sources.language IS 'Idioma principal de las ofertas: es | en | null. Se usa para agrupar la UI en España vs Internacional.';
COMMENT ON COLUMN job_sources.region IS 'Etiqueta de región/ciudad: Sevilla, Madrid, España, Remoto, etc. Solo informativo.';

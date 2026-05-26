-- Limpieza pedida por el usuario tras acumular 800+ ofertas que no le interesan:
--   1. Borrar TODAS las ofertas internacionales y de Tecnoempleo (toda la ingesta RSS).
--   2. Borrar todas las ofertas de LinkedIn con título tipo "LinkedIn job <ID>" o
--      ingestadas antes de hoy (el parser mejorado del commit siguiente extrae títulos
--      reales — solo queremos conservar las que entren a partir de ahora).
--   3. Deshabilitar todas las fuentes RSS para que el cron RSS no traiga más.
--      El cron de email sigue activo, solo se desactivan las RSS.

BEGIN;

-- 1. Borrar todas las ofertas ingestadas por RSS (Tecnoempleo + internacionales).
DELETE FROM job_offers
WHERE source_id IN (SELECT id FROM job_sources WHERE type = 'rss');

-- 2. Borrar ofertas de LinkedIn (email) anteriores a hoy + las que conservan título placeholder.
DELETE FROM job_offers
WHERE source_id IN (SELECT id FROM job_sources WHERE type = 'email')
  AND (
    title LIKE 'LinkedIn job %'
    OR scraped_at < CURRENT_DATE
  );

-- 3. Deshabilitar fuentes RSS (no se borran por si quieres reactivar alguna luego).
UPDATE job_sources SET enabled = false WHERE type = 'rss';

COMMIT;

-- Comprobación manual sugerida tras correr la migración:
--   SELECT type, enabled, COUNT(*) FROM job_sources GROUP BY type, enabled;
--   SELECT s.name, COUNT(o.id) FROM job_sources s LEFT JOIN job_offers o ON o.source_id = s.id GROUP BY s.id, s.name ORDER BY s.name;

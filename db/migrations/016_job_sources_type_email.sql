-- Permitir el nuevo tipo 'email' en job_sources para las fuentes virtuales
-- que crea el router de ingesta por correo (una por parser: linkedin, infojobs…).
ALTER TABLE job_sources DROP CONSTRAINT IF EXISTS job_sources_type_check;
ALTER TABLE job_sources ADD CONSTRAINT job_sources_type_check
  CHECK (type IN ('rss', 'scrape', 'api', 'email'));

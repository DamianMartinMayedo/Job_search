ALTER TABLE documents ADD COLUMN IF NOT EXISTS pair_name TEXT;

COMMENT ON COLUMN documents.pair_name IS 'Nombre del par CV+carta (ej: UI/UX, Diseño). Dos filas con el mismo pair_name forman un par.';

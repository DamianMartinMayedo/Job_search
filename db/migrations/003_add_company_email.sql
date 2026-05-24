ALTER TABLE companies ADD COLUMN IF NOT EXISTS email TEXT;

COMMENT ON COLUMN companies.email IS 'Email público de la empresa para enviar mensajes';

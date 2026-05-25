ALTER TABLE companies ADD COLUMN IF NOT EXISTS job_portal_url TEXT;

COMMENT ON COLUMN companies.job_portal_url IS 'Enlace al portal de empleo de la empresa';

CREATE TABLE IF NOT EXISTS job_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('rss', 'scrape', 'api')),
  url TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES job_sources(id) ON DELETE SET NULL,
  external_id TEXT,
  url TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  company_name TEXT,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  location TEXT,
  remote BOOLEAN,
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT,
  description TEXT,
  posted_at TIMESTAMPTZ,
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'interesting', 'applied', 'rejected', 'expired')),
  match_score INTEGER,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_job_offers_status ON job_offers(status);
CREATE INDEX IF NOT EXISTS idx_job_offers_posted_at ON job_offers(posted_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_job_offers_company_id ON job_offers(company_id);
CREATE INDEX IF NOT EXISTS idx_job_offers_source_id ON job_offers(source_id);
CREATE INDEX IF NOT EXISTS idx_job_offers_match_score ON job_offers(match_score DESC NULLS LAST);

COMMENT ON TABLE job_sources IS 'Fuentes (RSS/scrape/API) de las que se ingestan ofertas. Configurables por el usuario.';
COMMENT ON TABLE job_offers IS 'Ofertas de empleo ingestadas. URL es la clave de deduplicación.';
COMMENT ON COLUMN job_offers.status IS 'new: recién ingestada. interesting: el usuario la marcó. applied: ya respondió. rejected: descartada. expired: la oferta ya no está activa.';
COMMENT ON COLUMN job_offers.match_score IS '0-100, calculado al insertar según keywords/ubicación/remoto/empresa conocida.';

CREATE TABLE IF NOT EXISTS email_ingest_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT NOT NULL UNIQUE,        -- Gmail Message-Id, evita reprocesar
  from_addr TEXT NOT NULL,
  subject TEXT,
  received_at TIMESTAMPTZ NOT NULL,
  parser TEXT,                             -- linkedin | infojobs | manfred | domestika | unmatched
  offers_extracted INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_ingest_log_received ON email_ingest_log(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_ingest_log_parser ON email_ingest_log(parser);
CREATE INDEX IF NOT EXISTS idx_email_ingest_log_error ON email_ingest_log(processed_at DESC) WHERE error IS NOT NULL;

COMMENT ON TABLE email_ingest_log IS 'Registro de cada email procesado por el poll-job-emails. message_id es Gmail Message-Id (dedup). offers_extracted contabiliza cuántas ofertas se insertaron en job_offers. error guarda el mensaje si el parser falló (el email se queda sin marcar como leído para reintento).';

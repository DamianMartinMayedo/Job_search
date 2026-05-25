CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('cv', 'cover_letter')),
  name TEXT NOT NULL,
  content BYTEA,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE documents IS 'CVs y cartas de presentación. Si company_id es NULL, son documentos genéricos (Settings). Si tiene company_id, son personalizados para esa empresa y sobrescriben los genéricos al enviar.';

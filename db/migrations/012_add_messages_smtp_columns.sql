ALTER TABLE messages ADD COLUMN IF NOT EXISTS smtp_message_id TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS smtp_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_messages_smtp_sent_at ON messages(smtp_sent_at) WHERE smtp_sent_at IS NOT NULL;

COMMENT ON COLUMN messages.smtp_message_id IS 'Message-Id devuelto por el servidor SMTP. NULL si el mensaje sólo se marcó como enviado a mano.';
COMMENT ON COLUMN messages.smtp_sent_at IS 'Fecha en que SMTP confirmó la entrega. Distinto de sent_at, que puede haber sido marcado manualmente.';

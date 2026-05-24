ALTER TABLE messages ADD COLUMN IF NOT EXISTS recipient_email TEXT;

COMMENT ON COLUMN messages.recipient_email IS 'Email del destinatario cuando no hay contacto asociado';

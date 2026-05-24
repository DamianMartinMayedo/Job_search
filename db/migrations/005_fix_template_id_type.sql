ALTER TABLE messages
  ALTER COLUMN template_id TYPE UUID USING template_id::uuid;

ALTER TABLE messages
  ADD CONSTRAINT fk_messages_template
  FOREIGN KEY (template_id) REFERENCES email_templates(id) ON DELETE SET NULL;

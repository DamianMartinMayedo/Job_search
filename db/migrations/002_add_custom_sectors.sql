ALTER TABLE settings ADD COLUMN IF NOT EXISTS custom_sectors JSONB DEFAULT '[]'::jsonb;

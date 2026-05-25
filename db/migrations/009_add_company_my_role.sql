ALTER TABLE companies ADD COLUMN IF NOT EXISTS my_role TEXT;

COMMENT ON COLUMN companies.my_role IS 'Rol personalizado para la empresa (sobrescribe settings.my_role en plantillas)';

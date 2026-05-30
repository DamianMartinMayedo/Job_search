export const COMPANY_STATUS = [
  { value: 'new', label: 'Nueva', color: 'bg-[#F7F6F3] text-[#787774] border-[#EAEAEA]' },
  { value: 'contacted', label: 'Contactada', color: 'bg-[#E1F3FE] text-[#1F6C9F] border-[#BEE0F9]' },
  { value: 'replied', label: 'Respondió', color: 'bg-[#FBF3DB] text-[#956400] border-[#F0E0A8]' },
  { value: 'interview', label: 'Entrevista', color: 'bg-[#EDF3EC] text-[#346538] border-[#C5DCC4]' },
  { value: 'rejected', label: 'Descartada', color: 'bg-[#FDEBEC] text-[#9F2F2D] border-[#F9C9CB]' },
  { value: 'archived', label: 'Archivada', color: 'bg-[#F7F6F3] text-[#787774] border-[#EAEAEA]' },
]

export const COMPANY_STATUS_MAP = Object.fromEntries(
  COMPANY_STATUS.map((s) => [s.value, s])
)

export const MESSAGE_STATUS = [
  { value: 'draft', label: 'Borrador', color: 'bg-[#F7F6F3] text-[#787774] border-[#EAEAEA]' },
  { value: 'sent', label: 'Enviado', color: 'bg-[#E1F3FE] text-[#1F6C9F] border-[#BEE0F9]' },
  { value: 'replied', label: 'Respondido', color: 'bg-[#FBF3DB] text-[#956400] border-[#F0E0A8]' },
  { value: 'follow_up', label: 'Seguimiento', color: 'bg-[#FBF3DB] text-[#956400] border-[#F0E0A8]' },
  { value: 'closed', label: 'Cerrado', color: 'bg-[#F7F6F3] text-[#787774] border-[#EAEAEA]' },
]

export const MESSAGE_STATUS_MAP = Object.fromEntries(
  MESSAGE_STATUS.map((s) => [s.value, s])
)

export const ROLE_TYPES = [
  { value: 'hr', label: 'RRHH' },
  { value: 'ceo', label: 'CEO / Dirección' },
  { value: 'design_lead', label: 'Design Lead' },
  { value: 'tech_lead', label: 'Tech Lead' },
  { value: 'other', label: 'Otro' },
]

export const ROLE_TYPES_MAP = Object.fromEntries(
  ROLE_TYPES.map((r) => [r.value, r.label])
)

export const SOURCES = [
  { value: 'google_places', label: 'Google Places' },
  { value: 'manual', label: 'Manual' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'referral', label: 'Recomendación' },
]

export const SECTORS = [
  'Agencia de diseño',
  'Agencia de marketing',
  'Consultora digital',
  'Consultora IT',
  'Desarrollo de software',
  'E-commerce',
  'Fintech',
  'Healthtech',
  'Producto digital',
  'Startup',
  'Tech',
  'Otro',
]

export const OFFER_STATUS = [
  { value: 'new', label: 'Nueva', color: 'bg-[#E1F3FE] text-[#1F6C9F] border-[#BEE0F9]' },
  { value: 'interesting', label: 'Interesante', color: 'bg-[#FBF3DB] text-[#956400] border-[#F0E0A8]' },
  { value: 'applied', label: 'Aplicada', color: 'bg-[#EDF3EC] text-[#346538] border-[#C5DCC4]' },
  { value: 'rejected', label: 'Descartada', color: 'bg-[#FDEBEC] text-[#9F2F2D] border-[#F9C9CB]' },
  { value: 'expired', label: 'Expirada', color: 'bg-[#F7F6F3] text-[#787774] border-[#EAEAEA]' },
]

export const OFFER_STATUS_MAP = Object.fromEntries(
  OFFER_STATUS.map((s) => [s.value, s])
)

export const INTEREST_LEVELS = [
  { value: 1, label: 'Bajo' },
  { value: 2, label: 'Medio-bajo' },
  { value: 3, label: 'Medio' },
  { value: 4, label: 'Alto' },
  { value: 5, label: 'Muy alto' },
]

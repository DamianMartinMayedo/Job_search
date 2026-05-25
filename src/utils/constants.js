export const COMPANY_STATUS = [
  { value: 'new', label: 'Nueva', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { value: 'contacted', label: 'Contactada', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'replied', label: 'Respondió', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'interview', label: 'Entrevista', color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'rejected', label: 'Descartada', color: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'archived', label: 'Archivada', color: 'bg-gray-100 text-gray-500 border-gray-200' },
]

export const COMPANY_STATUS_MAP = Object.fromEntries(
  COMPANY_STATUS.map((s) => [s.value, s])
)

export const MESSAGE_STATUS = [
  { value: 'draft', label: 'Borrador', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  { value: 'sent', label: 'Enviado', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'replied', label: 'Respondido', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'follow_up', label: 'Seguimiento', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'closed', label: 'Cerrado', color: 'bg-gray-100 text-gray-500 border-gray-200' },
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
  { value: 'new', label: 'Nueva', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'interesting', label: 'Interesante', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'applied', label: 'Aplicada', color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'rejected', label: 'Descartada', color: 'bg-gray-100 text-gray-500 border-gray-200' },
  { value: 'expired', label: 'Expirada', color: 'bg-slate-100 text-slate-500 border-slate-200' },
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

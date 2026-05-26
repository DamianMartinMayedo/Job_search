import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { useCreateCompany } from '../../hooks/useCompanies'
import { useUpdateJobOffer } from '../../hooks/useJobOffers'
import { useTemplates } from '../../hooks/useTemplates'
import useAppStore from '../../store/useAppStore'

// Nombre de la plantilla seed pensada para aplicaciones a oferta. Si el usuario
// la ha renombrado o borrado, caemos a "primera plantilla disponible".
const PREFERRED_TEMPLATE_NAME = 'Aplicación a oferta concreta'

function extractDomain(url) {
  if (!url) return ''
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return ''
  }
}

// Estos dominios son los del portal donde sale la oferta, NO de la empresa.
// Si el dominio extraído está en esta lista, lo descartamos para no
// inducir al usuario a crear una empresa "linkedin.com".
const PORTAL_DOMAINS = new Set([
  'linkedin.com', 'lnkd.in',
  'tecnoempleo.com',
  'infojobs.net',
  'indeed.com', 'es.indeed.com',
  'remoteok.com', 'remoteok.io',
  'weworkremotely.com',
  'remotive.com', 'remotive.io',
  'getmanfred.com', 'manfred.com',
  'domestika.org',
])

function buildComposerUrl(companyId, templateId, offer) {
  const params = new URLSearchParams({ compose: '1' })
  if (templateId) params.set('templateId', templateId)
  if (offer.title) params.set('jobTitle', offer.title)
  if (offer.url) params.set('jobUrl', offer.url)
  if (offer.location) params.set('jobLocation', ` (${offer.location})`)
  return `/app/companies/${companyId}?${params.toString()}`
}

export default function ApplyToOfferDialog({ open, offer, onClose }) {
  const navigate = useNavigate()
  const { data: templates } = useTemplates()
  const createCompany = useCreateCompany()
  const updateOffer = useUpdateJobOffer()
  const addToast = useAppStore((s) => s.addToast)

  const preferredTemplate =
    templates?.find((t) => t.name === PREFERRED_TEMPLATE_NAME) || templates?.[0]
  const templateId = preferredTemplate?.id || null

  const [form, setForm] = useState({ name: '', domain: '', city: '', sector: '' })

  // Prellenar el form cuando se abre con una oferta sin empresa matcheada.
  useEffect(() => {
    if (!open || !offer) return
    const inferredDomain = extractDomain(offer.url)
    const cleanDomain = PORTAL_DOMAINS.has(inferredDomain) ? '' : inferredDomain
    setForm({
      name: offer.company_name || '',
      domain: cleanDomain,
      city: offer.location || '',
      sector: '',
    })
  }, [open, offer])

  // Si la oferta YA tiene empresa matcheada, redirigimos directo al composer
  // sin enseñar el modal. Eso ocurre en cuanto se monta abierto.
  useEffect(() => {
    if (!open || !offer || !templateId) return
    if (offer.company_id) {
      navigate(buildComposerUrl(offer.company_id, templateId, offer))
      onClose()
    }
  }, [open, offer, templateId, navigate, onClose])

  if (!open || !offer || offer.company_id) return null

  const handleSubmit = async (e) => {
    e?.preventDefault()
    if (!form.name.trim()) {
      addToast({ type: 'error', message: 'El nombre de la empresa es obligatorio' })
      return
    }
    try {
      const company = await createCompany.mutateAsync({
        name: form.name.trim(),
        domain: form.domain.trim() || null,
        website: form.domain.trim() ? `https://${form.domain.trim()}` : null,
        city: form.city.trim() || null,
        sector: form.sector.trim() || null,
        source: 'job_offer',
      })
      // Vincular la oferta con la nueva empresa para que la próxima vez
      // se salte el modal.
      await updateOffer.mutateAsync({
        id: offer.id,
        data: { company_id: company.id },
      })
      addToast({ type: 'success', message: `Empresa "${company.name}" creada` })
      navigate(buildComposerUrl(company.id, templateId, offer))
      onClose()
    } catch (err) {
      addToast({ type: 'error', message: `Error: ${err.message}` })
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Aplicar a esta oferta" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <p className="font-medium text-slate-800">{offer.title}</p>
          {offer.location && <p className="mt-0.5">{offer.location}</p>}
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <Building2 size={14} className="mt-0.5 shrink-0" />
          <span>
            Esta oferta no está vinculada a ninguna empresa de tu BD. Crea la empresa primero — luego abriremos el composer con plantilla y placeholders rellenos.
          </span>
        </div>

        <Input
          label="Nombre de la empresa *"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Ej: Acme Studio"
          autoFocus
        />
        <Input
          label="Dominio (opcional)"
          value={form.domain}
          onChange={(e) => setForm((f) => ({ ...f, domain: e.target.value }))}
          placeholder="acme.com"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Ciudad"
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            placeholder="Sevilla, Madrid, Remoto…"
          />
          <Input
            label="Sector"
            value={form.sector}
            onChange={(e) => setForm((f) => ({ ...f, sector: e.target.value }))}
            placeholder="Agencia, Startup tech…"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={createCompany.isPending || updateOffer.isPending || !form.name.trim()}>
            {createCompany.isPending || updateOffer.isPending ? 'Creando…' : 'Crear empresa y aplicar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

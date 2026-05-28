import { useState, useEffect } from 'react'
import { Send, FileText } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { useTemplates } from '../../hooks/useTemplates'
import { useSettings } from '../../hooks/useSettings'
import { useDocumentPairs } from '../../hooks/useDocuments'
import { renderTemplate, renderSubject } from '../../lib/emailTemplates'

export default function EmailComposer({
  open,
  onClose,
  company,
  contacts,
  initialContact,
  // prefill: { templateId, jobTitle, jobUrl, jobLocation } — viene cuando se
  // abre el composer desde una oferta. Si templateId está, se aplica auto.
  // jobTitle/jobUrl/jobLocation se inyectan en el render como {{job_*}}.
  prefill,
  onSubmit,
  isSubmitting,
}) {
  const { data: templates } = useTemplates()
  const { data: settings } = useSettings()
  const { data: pairs } = useDocumentPairs()

  const companyEmail = company?.email || ''

  const [form, setForm] = useState({
    contact_id: '',
    recipient_email: '',
    subject: '',
    body: '',
    template_id: '',
    pair_name: '',
  })

  // Datos de oferta que se inyectan en cada render de la plantilla.
  const jobData = {
    job_title: prefill?.jobTitle || '',
    job_url: prefill?.jobUrl || '',
    job_location: prefill?.jobLocation || '',
  }

  useEffect(() => {
    if (open) {
      setForm({
        contact_id: initialContact || (companyEmail ? '__company__' : ''),
        recipient_email: '',
        subject: '',
        body: '',
        template_id: '',
        pair_name: '',
      })
    }
  }, [open, initialContact, companyEmail])

  // Auto-aplicar plantilla cuando viene desde prefill (típico: al abrir desde una oferta).
  // Se ejecuta tras que templates y settings hayan cargado.
  useEffect(() => {
    if (!open || !prefill?.templateId || !templates || !settings) return
    const template = templates.find((t) => t.id === prefill.templateId)
    if (!template) return
    // Sólo aplicar si todavía no hay template seleccionada (evita pisar cambios manuales del usuario).
    if (form.template_id) return
    handleTemplateSelect(prefill.templateId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, prefill?.templateId, templates, settings])

  const getRecipientEmail = () => {
    if (form.recipient_email) return form.recipient_email
    if (form.contact_id && form.contact_id !== '__company__') {
      const contact = contacts?.find((c) => c.id === form.contact_id)
      return contact?.email || ''
    }
    if (form.contact_id === '__company__') return companyEmail
    return ''
  }

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }))
  }

  const getContactName = (contactId) => {
    if (contactId === '__company__') return company?.name || ''
    if (!contactId) return ''
    const contact = contacts?.find((c) => c.id === contactId)
    return contact ? `${contact.first_name} ${contact.last_name || ''}`.trim() : ''
  }

  const getContactRole = (contactId) => {
    if (contactId === '__company__') return ''
    if (!contactId) return ''
    const contact = contacts?.find((c) => c.id === contactId)
    return contact?.role || ''
  }

  const buildRenderData = (contactId) => ({
    company_name: company?.name || '',
    contact_name: getContactName(contactId),
    contact_role: getContactRole(contactId),
    my_name: settings?.my_name || '',
    my_role: company?.my_role || settings?.my_role || '',
    my_web: settings?.my_web || '',
    my_email: settings?.my_email || '',
    ...jobData,
  })

  const handleTemplateSelect = (templateId) => {
    const template = templates?.find((t) => t.id === templateId)
    if (!template || !settings) return
    const data = buildRenderData(form.contact_id)
    setForm({
      ...form,
      template_id: templateId,
      subject: renderSubject(template, data),
      body: renderTemplate(template, data),
    })
  }

  const handleRecipientChange = (e) => {
    const newContactId = e.target.value
    setForm((f) => ({ ...f, contact_id: newContactId, recipient_email: '' }))
    if (form.template_id) {
      requestAnimationFrame(() => {
        const template = templates?.find((t) => t.id === form.template_id)
        if (template && settings) {
          const data = buildRenderData(newContactId)
          setForm((f) => ({
            ...f,
            subject: renderSubject(template, data),
            body: renderTemplate(template, data),
          }))
        }
      })
    }
  }

  const handleSubmit = (e, status = 'draft') => {
    e.preventDefault()
    if (!form.subject.trim() || !form.body.trim()) return
    const email = getRecipientEmail()
    const pairName = form.pair_name || null
    onSubmit(
      {
        company_id: company?.id,
        contact_id: form.contact_id && form.contact_id !== '__company__' ? form.contact_id : null,
        recipient_email: email || form.recipient_email || null,
        subject: form.subject,
        body: form.body,
        template_id: form.template_id || null,
        status: 'draft',
      },
      status === 'sent',
      pairName
    )
  }

  return (
    <Modal open={open} onClose={onClose} title="Redactar email" size="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">
            Destinatario
          </label>
          <select
            value={form.contact_id}
            onChange={handleRecipientChange}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-hidden"
          >
            <option value="">Sin destinatario</option>
            {companyEmail && (
              <option value="__company__">
                📧 {company.name} ({companyEmail})
              </option>
            )}
            {contacts?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.first_name} {c.last_name}{c.email ? ` (${c.email})` : ''} · {c.role || 'Sin rol'}
              </option>
            ))}
          </select>

          {!getRecipientEmail() && (
            <Input
              label="O escribe un email manualmente"
              type="email"
              placeholder="email@empresa.com"
              value={form.recipient_email}
              onChange={(e) => handleChange('recipient_email', e.target.value)}
            />
          )}

          {getRecipientEmail() && (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <Send size={12} />
              Se enviará a: {getRecipientEmail()}
            </p>
          )}
        </div>

        {templates && templates.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">
              Plantilla
            </label>
            <select
              value={form.template_id}
              onChange={(e) => handleTemplateSelect(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-hidden"
            >
              <option value="">En blanco</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <Input
          label="Asunto *"
          value={form.subject}
          onChange={(e) => handleChange('subject', e.target.value)}
          required
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">
            Cuerpo del email *
          </label>
          <textarea
            value={form.body}
            onChange={(e) => handleChange('body', e.target.value)}
            className="min-h-64 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-hidden resize-y"
            required
          />
        </div>

        {pairs && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Adjuntar documentos</label>
            <select
              value={form.pair_name}
              onChange={(e) => handleChange('pair_name', e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-hidden"
            >
              <option value="">Sin adjuntos</option>
              {pairs.map((p) => (
                <option key={p.pair_name} value={p.pair_name}>
                  {p.pair_name}{p.cover ? ' (CV + Carta)' : ' (Solo CV)'}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" variant="secondary" onClick={(e) => handleSubmit(e, 'draft')} disabled={isSubmitting}>
            <FileText size={18} />
            {isSubmitting ? 'Guardando...' : 'Guardar borrador'}
          </Button>
          <Button type="button" onClick={(e) => handleSubmit(e, 'sent')} disabled={isSubmitting}>
            <Send size={18} />
            {isSubmitting ? 'Enviando...' : 'Enviar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

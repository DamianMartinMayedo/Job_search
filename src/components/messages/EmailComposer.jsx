import { useState, useEffect } from 'react'
import { Send, FileText } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { useTemplates } from '../../hooks/useTemplates'
import { useSettings } from '../../hooks/useSettings'
import { renderTemplate, renderSubject } from '../../lib/emailTemplates'

export default function EmailComposer({
  open,
  onClose,
  company,
  contacts,
  initialContact,
  onSubmit,
  isSubmitting,
}) {
  const { data: templates } = useTemplates()
  const { data: settings } = useSettings()

  const [form, setForm] = useState({
    contact_id: '',
    subject: '',
    body: '',
    template_id: '',
  })

  useEffect(() => {
    if (open) {
      setForm({
        contact_id: initialContact || '',
        subject: '',
        body: '',
        template_id: '',
      })
    }
  }, [open, initialContact])

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }))
  }

  const handleTemplateSelect = (templateId) => {
    const template = templates?.find((t) => t.id === templateId)
    if (!template || !settings) return

    const contact = contacts?.find((c) => c.id === form.contact_id)
    const data = {
      company_name: company?.name || '',
      contact_name: contact
        ? `${contact.first_name} ${contact.last_name || ''}`.trim()
        : '',
      contact_role: contact?.role || '',
      my_name: settings.my_name || '',
      my_role: settings.my_role || '',
      my_web: settings.my_web || '',
      my_email: settings.my_email || '',
    }

    setForm({
      ...form,
      template_id: templateId,
      subject: renderSubject(template, data),
      body: renderTemplate(template, data),
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.subject.trim() || !form.body.trim()) return
    onSubmit({
      company_id: company?.id,
      contact_id: form.contact_id || null,
      subject: form.subject,
      body: form.body,
      template_id: form.template_id || null,
      status: 'draft',
    })
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
            onChange={(e) => {
              handleChange('contact_id', e.target.value)
              if (form.template_id) handleTemplateSelect(form.template_id)
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-hidden"
          >
            <option value="">Sin contacto específico</option>
            {contacts?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.first_name} {c.last_name} ({c.role || 'Sin rol'})
              </option>
            ))}
          </select>
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

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Send size={18} />
            {isSubmitting ? 'Guardando...' : 'Guardar borrador'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

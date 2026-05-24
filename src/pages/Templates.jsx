import { useState, useRef } from 'react'
import { FileText, Plus, Pencil, Trash2, Eye } from 'lucide-react'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import EmptyState from '../components/ui/EmptyState'
import ConfirmModal from '../components/ui/ConfirmModal'
import { SkeletonRow } from '../components/ui/Skeleton'
import {
  useTemplates,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
} from '../hooks/useTemplates'
import { useSettings } from '../hooks/useSettings'
import useAppStore from '../store/useAppStore'

export default function Templates() {
  const [formOpen, setFormOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [previewTemplate, setPreviewTemplate] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { data: templates, isLoading } = useTemplates()
  const { data: settings } = useSettings()
  const createTemplate = useCreateTemplate()
  const updateTemplate = useUpdateTemplate()
  const deleteTemplate = useDeleteTemplate()
  const addToast = useAppStore((s) => s.addToast)

  const handleSave = async (data) => {
    try {
      if (editing) {
        await updateTemplate.mutateAsync({ id: editing.id, data })
        addToast({ type: 'success', message: 'Plantilla actualizada' })
      } else {
        await createTemplate.mutateAsync(data)
        addToast({ type: 'success', message: 'Plantilla creada' })
      }
      setFormOpen(false)
      setEditing(null)
    } catch (err) {
      console.error('Template save error:', err)
      addToast({ type: 'error', message: err.message || 'Error al guardar la plantilla' })
    }
  }

  const handleDelete = (template) => {
    setDeleteTarget(template)
  }

  const handlePreview = (template) => {
    setPreviewTemplate(template)
    setPreviewOpen(true)
  }

  const renderPreview = (template) => {
    if (!template || !settings) return ''
    const vars = {
      company_name: 'Nombre de la empresa',
      contact_name: 'Nombre del contacto',
      contact_role: 'Rol del contacto',
      my_name: settings.my_name || 'Tu nombre',
      my_role: settings.my_role || 'Tu rol',
      my_web: settings.my_web || 'tuweb.com',
      my_email: settings.my_email || 'tu@email.com',
    }
    let result = template.body
    Object.entries(vars).forEach(([key, val]) => {
      result = result.replaceAll(`{{${key}}}`, val)
    })
    return result
  }

  const hasTemplates = templates && templates.length > 0

  return (
    <>
    <div>
      {isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonRow key={i} columns={3} />
          ))}
        </div>
      ) : hasTemplates ? (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Plantillas</h1>
              <p className="mt-1 text-sm text-slate-500">
                {templates.length} plantillas
              </p>
            </div>
            <Button onClick={() => { setEditing(null); setFormOpen(true) }}>
              <Plus size={18} />
              Nueva plantilla
            </Button>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((t) => (
              <div
                key={t.id}
                className="rounded-xl border border-slate-200 bg-white p-5"
              >
                <h3 className="text-base font-semibold text-slate-900">
                  {t.name}
                </h3>
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                  {t.subject}
                </p>
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePreview(t)}
                  >
                    <Eye size={16} />
                    Vista previa
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setEditing(t); setFormOpen(true) }}
                  >
                    <Pencil size={16} />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(t)}
                    className="text-red-500 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          icon={FileText}
          title="Sin plantillas"
          description="Crea tu primera plantilla de email"
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus size={18} />
              Crear plantilla
            </Button>
          }
        />
      )}

      <TemplateFormModal
        key={editing?.id || 'new'}
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null) }}
        template={editing}
        onSubmit={handleSave}
        isSubmitting={createTemplate.isPending || updateTemplate.isPending}
      />

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Vista previa"
        size="lg"
      >
        {previewTemplate && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">
                Asunto
              </p>
              <p className="text-sm text-slate-900">
                {previewTemplate.subject}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">
                Cuerpo
              </p>
              <div className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
                {renderPreview(previewTemplate)}
              </div>
            </div>
            <p className="text-xs text-slate-400">
              Los placeholders se reemplazarán con los datos reales al enviar
            </p>
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Eliminar plantilla"
        message={`¿Eliminar "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        danger
        isSubmitting={deleteTemplate.isPending}
        onConfirm={() => {
          if (!deleteTarget) return
          deleteTemplate.mutate(deleteTarget.id, {
            onSuccess: () => {
              addToast({ type: 'success', message: 'Plantilla eliminada' })
              setDeleteTarget(null)
            },
            onError: (err) => {
              addToast({ type: 'error', message: `Error: ${err.message}` })
              setDeleteTarget(null)
            },
          })
        }}
      />
    </div>
    </>
  )
}

function TemplateFormModal({ open, onClose, template, onSubmit, isSubmitting }) {
  const [form, setForm] = useState({
    name: template?.name || '',
    subject: template?.subject || '',
    body: template?.body || '',
  })
  const bodyRef = useRef(null)

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }))
  }

  const insertPlaceholder = (placeholder) => {
    const el = bodyRef.current
    if (!el) {
      handleChange('body', form.body + placeholder)
      return
    }
    const start = el.selectionStart
    const end = el.selectionEnd
    const newBody = form.body.slice(0, start) + placeholder + form.body.slice(end)
    handleChange('body', newBody)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + placeholder.length, start + placeholder.length)
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.subject.trim() || !form.body.trim()) return
    onSubmit(form)
  }

  const placeholders = [
    '{{company_name}}',
    '{{contact_name}}',
    '{{contact_role}}',
    '{{my_name}}',
    '{{my_role}}',
    '{{my_web}}',
    '{{my_email}}',
  ]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={template ? 'Editar plantilla' : 'Nueva plantilla'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nombre *"
          placeholder="Contacto en frío, Seguimiento..."
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
          required
        />
        <Input
          label="Asunto *"
          placeholder="Oportunidad de colaboración con {{company_name}}"
          value={form.subject}
          onChange={(e) => handleChange('subject', e.target.value)}
          required
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">
            Cuerpo del email *
          </label>
          <textarea
            ref={bodyRef}
            value={form.body}
            onChange={(e) => handleChange('body', e.target.value)}
            className="min-h-64 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-hidden resize-y"
            required
          />
          <div className="flex flex-wrap gap-1.5">
            {placeholders.map((p) => (
              <button
                key={p}
                  type="button"
                    onClick={() => insertPlaceholder(p)}
                className="rounded bg-slate-100 px-2 py-1 text-xs font-mono text-slate-600 hover:bg-slate-200 cursor-pointer"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

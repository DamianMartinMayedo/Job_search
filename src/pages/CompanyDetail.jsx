import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Copy, Pencil, Trash2, Plus, Mail } from 'lucide-react'
import Tabs from '../components/ui/Tabs'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import { SkeletonCard } from '../components/ui/Skeleton'
import { useCompany, useUpdateCompany } from '../hooks/useCompanies'
import {
  useContacts,
  useCreateContact,
  useDeleteContact,
} from '../hooks/useContacts'
import {
  useMessages,
  useCreateMessage,
  useUpdateMessage,
} from '../hooks/useMessages'
import { useActivity } from '../hooks/useActivity'
import { COMPANY_STATUS_MAP, ROLE_TYPES_MAP } from '../utils/constants'
import useAppStore from '../store/useAppStore'

const tabDefs = [
  { value: 'contacts', label: 'Contactos' },
  { value: 'messages', label: 'Mensajes' },
  { value: 'notes', label: 'Notas' },
  { value: 'activity', label: 'Actividad' },
]

export default function CompanyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState('contacts')
  const [showContactForm, setShowContactForm] = useState(false)
  const [showMessageForm, setShowMessageForm] = useState(false)
  const [notes, setNotes] = useState('')
  const [notesTimer, setNotesTimer] = useState(null)

  const addToast = useAppStore((s) => s.addToast)

  const { data: company, isLoading: loadingCompany } = useCompany(id)
  const { data: contacts, isLoading: loadingContacts } = useContacts(id)
  const { data: messages, isLoading: loadingMessages } = useMessages()
  const { data: activity } = useActivity(50)
  const updateCompany = useUpdateCompany()
  const createContact = useCreateContact()
  const deleteContact = useDeleteContact()
  const createMessage = useCreateMessage()
  const updateMessage = useUpdateMessage()

  const status = company
    ? COMPANY_STATUS_MAP[company.status] || COMPANY_STATUS_MAP.new
    : null

  const companyMessages = messages?.filter((m) => m.company_id === id) || []
  const companyActivity = activity?.filter((a) => a.company_id === id) || []

  const handleStatusChange = (newStatus) => {
    updateCompany.mutate(
      { id, data: { status: newStatus } },
      {
        onSuccess: () =>
          addToast({
            type: 'success',
            message: `Estado cambiado a "${newStatus}"`,
          }),
      }
    )
  }

  const handleNotesChange = (value) => {
    setNotes(value)
    if (notesTimer) clearTimeout(notesTimer)
    setNotesTimer(
      setTimeout(() => {
        updateCompany.mutate({ id, data: { notes: value } })
      }, 1500)
    )
  }

  const handleCopyEmail = (email) => {
    navigator.clipboard.writeText(email)
    addToast({ type: 'success', message: 'Email copiado' })
  }

  if (loadingCompany) {
    return (
      <div>
        <SkeletonCard />
      </div>
    )
  }

  if (!company) return null

  return (
    <div>
      <button
        onClick={() => navigate('/app/companies')}
        className="mb-4 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 cursor-pointer"
      >
        <ArrowLeft size={16} />
        Volver a empresas
      </button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{company.name}</h1>
            <Badge className={status.color}>{status.label}</Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            {company.sector && <span>{company.sector}</span>}
            {company.city && <span>· {company.city}</span>}
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-primary-600 hover:text-primary-700"
              >
                <ExternalLink size={14} />
                {company.domain}
              </a>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={company.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-hidden"
          >
            {Object.values(COMPANY_STATUS_MAP).map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white">
        <Tabs tabs={tabDefs} activeTab={tab} onTabChange={setTab} />

        <div className="p-6">
          {tab === 'contacts' && (
            <ContactsTab
              contacts={contacts || []}
              isLoading={loadingContacts}
              onAdd={() => setShowContactForm(true)}
              onDelete={(contact) => {
                if (confirm(`¿Eliminar a ${contact.first_name}?`)) {
                  deleteContact.mutate(contact.id, {
                    onSuccess: () =>
                      addToast({ type: 'success', message: 'Contacto eliminado' }),
                  })
                }
              }}
              onCopy={handleCopyEmail}
            />
          )}

          {tab === 'messages' && (
            <MessagesTab
              messages={companyMessages}
              isLoading={loadingMessages}
              onAdd={() => setShowMessageForm(true)}
              onMarkSent={(msg) => {
                updateMessage.mutate(
                  { id: msg.id, data: { status: 'sent' } },
                  {
                    onSuccess: () =>
                      addToast({ type: 'success', message: 'Marcado como enviado' }),
                  }
                )
              }}
            />
          )}

          {tab === 'notes' && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">
                Notas sobre esta empresa
              </label>
              <textarea
                value={notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Escribe notas aquí... se guardan automáticamente"
                className="min-h-48 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-hidden resize-y"
              />
              <p className="text-xs text-slate-400">
                Se guarda automáticamente tras 1.5s sin escribir
              </p>
            </div>
          )}

          {tab === 'activity' && (
            <ActivityTab activity={companyActivity} />
          )}
        </div>
      </div>

      {showContactForm && (
        <ContactFormModal
          companyId={id}
          onClose={() => setShowContactForm(false)}
          onSubmit={(data) => {
            createContact.mutate(data, {
              onSuccess: () => {
                setShowContactForm(false)
                addToast({
                  type: 'success',
                  message: `${data.first_name} añadido`,
                })
              },
            })
          }}
          isSubmitting={createContact.isPending}
        />
      )}

      {showMessageForm && (
        <MessageFormModal
          companyId={id}
          contacts={contacts || []}
          onClose={() => setShowMessageForm(false)}
          onSubmit={(data) => {
            createMessage.mutate(data, {
              onSuccess: () => {
                setShowMessageForm(false)
                addToast({ type: 'success', message: 'Mensaje creado' })
              },
            })
          }}
          isSubmitting={createMessage.isPending}
        />
      )}
    </div>
  )
}

function ContactsTab({ contacts, isLoading, onAdd, onDelete, onCopy }) {
  if (isLoading) return <p className="text-sm text-slate-400">Cargando...</p>
  if (contacts.length === 0) {
    return (
      <EmptyState
        icon={Plus}
        title="Sin contactos"
        description="Añade personas clave de esta empresa"
        action={
          <Button onClick={onAdd}>
            <Plus size={18} />
            Añadir contacto
          </Button>
        }
      />
    )
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button size="sm" onClick={onAdd}>
          <Plus size={16} />
          Añadir contacto
        </Button>
      </div>
      <div className="divide-y divide-slate-100">
        {contacts.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between gap-4 py-3"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-slate-900">
                  {c.first_name} {c.last_name}
                </p>
                {c.is_primary && (
                  <Badge className="bg-primary-100 text-primary-700 border-primary-200">
                    Principal
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {ROLE_TYPES_MAP[c.role_type] || c.role || 'Sin rol'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {c.email && (
                <button
                  onClick={() => onCopy(c.email)}
                  className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                  title="Copiar email"
                >
                  <Copy size={16} />
                </button>
              )}
              {c.linkedin_url && (
                <a
                  href={c.linkedin_url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                  title="LinkedIn"
                >
                  <ExternalLink size={16} />
                </a>
              )}
              <button
                onClick={() => onDelete(c)}
                className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 cursor-pointer"
                title="Eliminar"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MessagesTab({ messages, isLoading, onAdd, onMarkSent }) {
  if (isLoading) return <p className="text-sm text-slate-400">Cargando...</p>
  if (messages.length === 0) {
    return (
      <EmptyState
        icon={Mail}
        title="Sin mensajes"
        description="Crea un email de contacto para esta empresa"
        action={
          <Button onClick={onAdd}>
            <Mail size={18} />
            Crear mensaje
          </Button>
        }
      />
    )
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button size="sm" onClick={onAdd}>
          <Mail size={16} />
          Crear mensaje
        </Button>
      </div>
      <div className="divide-y divide-slate-100">
        {messages.map((m) => (
          <div
            key={m.id}
            className="flex items-center justify-between gap-4 py-3"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {m.subject}
              </p>
              <p className="text-xs text-slate-500">
                {m.contact_first_name && `Para: ${m.contact_first_name}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {m.status === 'draft' && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onMarkSent(m)}
                >
                  Marcar enviado
                </Button>
              )}
              <span className="text-xs text-slate-400">
                {m.sent_at
                  ? new Date(m.sent_at).toLocaleDateString('es-ES')
                  : 'Borrador'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ActivityTab({ activity }) {
  if (activity.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-400">
        No hay actividad registrada
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {activity.map((a) => (
        <div key={a.id} className="flex gap-3">
          <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary-400" />
          <div>
            <p className="text-sm text-slate-700">{a.description}</p>
            <p className="text-xs text-slate-400">
              {new Date(a.created_at).toLocaleString('es-ES')}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

function ContactFormModal({ companyId, onClose, onSubmit, isSubmitting }) {
  const [form, setForm] = useState({
    company_id: companyId,
    first_name: '',
    last_name: '',
    role: '',
    role_type: 'other',
    email: '',
    phone: '',
    linkedin_url: '',
    is_primary: false,
  })

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.first_name.trim()) return
    onSubmit(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Añadir contacto
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nombre *"
              value={form.first_name}
              onChange={(e) => handleChange('first_name', e.target.value)}
              required
            />
            <Input
              label="Apellido"
              value={form.last_name}
              onChange={(e) => handleChange('last_name', e.target.value)}
            />
          </div>
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
          />
          <Input
            label="Rol"
            placeholder="Head of Design..."
            value={form.role}
            onChange={(e) => handleChange('role', e.target.value)}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">
              Tipo de rol
            </label>
            <select
              value={form.role_type}
              onChange={(e) => handleChange('role_type', e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-hidden"
            >
              {Object.entries(ROLE_TYPES_MAP).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="LinkedIn URL"
            value={form.linkedin_url}
            onChange={(e) => handleChange('linkedin_url', e.target.value)}
          />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.is_primary}
              onChange={(e) => handleChange('is_primary', e.target.checked)}
              className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            Contacto principal
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !form.first_name.trim()}>
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function MessageFormModal({ companyId, contacts, onClose, onSubmit, isSubmitting }) {
  const [form, setForm] = useState({
    company_id: companyId,
    contact_id: '',
    subject: '',
    body: '',
    status: 'draft',
  })

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.subject.trim() || !form.body.trim()) return
    onSubmit(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Crear mensaje
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">
              Destinatario
            </label>
            <select
              value={form.contact_id}
              onChange={(e) => handleChange('contact_id', e.target.value || null)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-hidden"
            >
              <option value="">Sin contacto específico</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name} ({c.role || 'Sin rol'})
                </option>
              ))}
            </select>
          </div>
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
              className="min-h-48 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-hidden resize-y"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar borrador'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

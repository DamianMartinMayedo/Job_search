import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Copy, Trash2, Plus, Mail, X, Pencil, CheckCircle, Eye, Send, Briefcase, Archive } from 'lucide-react'
import Tabs from '../components/ui/Tabs'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import ConfirmModal from '../components/ui/ConfirmModal'
import PromptModal from '../components/ui/PromptModal'
import { SkeletonCard } from '../components/ui/Skeleton'
import { useCompany, useUpdateCompany } from '../hooks/useCompanies'
import {
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
} from '../hooks/useContacts'
import {
  useCreateMessage,
  useUpdateMessage,
  useDeleteMessage,
  useSendMessage,
} from '../hooks/useMessages'
import Input from '../components/ui/Input'
import EmailComposer from '../components/messages/EmailComposer'
import { COMPANY_STATUS_MAP, ROLE_TYPES_MAP, MESSAGE_STATUS_MAP } from '../utils/constants'
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
  const notesTimerRef = useRef(null)
  const [emailModal, setEmailModal] = useState({ open: false, value: '' })
  const [jobPortalModal, setJobPortalModal] = useState({ open: false, value: '' })
  const [websiteModal, setWebsiteModal] = useState({ open: false, value: '' })
  const [myRoleModal, setMyRoleModal] = useState({ open: false, value: '' })
  const [editingContact, setEditingContact] = useState(null)
  const [archiveTarget, setArchiveTarget] = useState(null)
  const [deleteContactTarget, setDeleteContactTarget] = useState(null)

  const addToast = useAppStore((s) => s.addToast)

  const { data: company, isLoading: loadingCompany, error: companyError } = useCompany(id)
  const updateCompany = useUpdateCompany()
  const createContact = useCreateContact()
  const updateContact = useUpdateContact()
  const deleteContact = useDeleteContact()
  const createMessage = useCreateMessage()
  const updateMessage = useUpdateMessage()
  const deleteMessage = useDeleteMessage()
  const sendMessage = useSendMessage()

  const [emailConfirm, setEmailConfirm] = useState(null)

  useEffect(() => {
    if (company?.notes) setNotes(company.notes)
  }, [company?.notes])

  useEffect(() => {
    return () => {
      if (notesTimerRef.current) clearTimeout(notesTimerRef.current)
    }
  }, [])

  const contacts = company?.contacts || []
  const companyMessages = company?.messages || []
  const companyActivity = company?.activity || []

  const handleStatusChange = (newStatus) => {
    updateCompany.mutate(
      { id, data: { status: newStatus } },
      {
        onSuccess: () =>
          addToast({
            type: 'success',
            message: `Estado cambiado a "${newStatus}"`,
          }),
        onError: (err) =>
          addToast({
            type: 'error',
            message: `Error al cambiar estado: ${err.message}`,
          }),
      }
    )
  }

  const handleNotesChange = (value) => {
    setNotes(value)
    if (notesTimerRef.current) clearTimeout(notesTimerRef.current)
    notesTimerRef.current = setTimeout(() => {
      updateCompany.mutate({ id, data: { notes: value } })
    }, 1500)
  }

  const handleCopyEmail = (email) => {
    navigator.clipboard.writeText(email).catch(() => {
      addToast({ type: 'error', message: 'Error al copiar email' })
    })
    addToast({ type: 'success', message: 'Email copiado' })
  }

  const handleContactSubmit = async (formData) => {
    try {
      if (editingContact) {
        await updateContact.mutateAsync({ id: editingContact.id, data: formData })
        addToast({ type: 'success', message: `${formData.first_name} actualizado` })
      } else {
        await createContact.mutateAsync(formData)
        addToast({ type: 'success', message: `${formData.first_name} añadido` })
      }
      setShowContactForm(false)
      setEditingContact(null)
    } catch (err) {
      addToast({ type: 'error', message: `Error: ${err.message}` })
    }
  }

  const handleArchive = () => {
    updateCompany.mutate(
      { id, data: { status: 'archived' } },
      {
        onSuccess: () => {
          addToast({ type: 'success', message: `${company.name} archivada` })
          setArchiveTarget(null)
        },
        onError: (err) =>
          addToast({ type: 'error', message: `Error: ${err.message}` }),
      }
    )
  }

  const handleMessageSubmit = async (data, shouldSend, pairName) => {
    try {
      const message = await createMessage.mutateAsync(data)
      if (shouldSend) {
        sendMessage.mutate(
          { messageId: message.id, pair_name: pairName },
          {
            onSuccess: () =>
              addToast({ type: 'success', message: `Mensaje enviado a ${data.recipient_email || 'destinatario'}` }),
            onError: (err) =>
              addToast({ type: 'error', message: `Error al enviar: ${err.message}` }),
          }
        )
      } else {
        addToast({ type: 'success', message: 'Borrador guardado' })
      }
      setShowMessageForm(false)
    } catch (err) {
      addToast({ type: 'error', message: `Error: ${err.message}` })
    }
  }

  const status = company
    ? COMPANY_STATUS_MAP[company.status] || COMPANY_STATUS_MAP.new
    : null

  if (loadingCompany) {
    return (
      <div>
        <SkeletonCard />
      </div>
    )
  }

  if (companyError) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg text-red-500">Error al cargar: {companyError.message}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-sm text-primary-600 hover:text-primary-700 cursor-pointer"
        >
          Volver atrás
        </button>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg text-slate-500">Empresa no encontrada</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-sm text-primary-600 hover:text-primary-700 cursor-pointer"
        >
          Volver atrás
        </button>
      </div>
    )
  }

  return (
    <>
    <div>
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 cursor-pointer"
      >
        <ArrowLeft size={16} />
        Volver atrás
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
              <div className="flex items-center gap-1">
                <a
                  href={company.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-primary-600 hover:text-primary-700"
                >
                  <ExternalLink size={14} />
                  {company.domain || company.website}
                </a>
                <button
                  onClick={() => setWebsiteModal({ open: true, value: company.website })}
                  className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                  title="Editar web"
                >
                  <Pencil size={12} />
                </button>
              </div>
            )}
          </div>
          <div className="mt-2 flex items-center gap-2">
            {company.email ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">{company.email}</span>
                <button
                  onClick={() => setEmailModal({ open: true, value: company.email })}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                  title="Editar email"
                >
                  <Pencil size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEmailModal({ open: true, value: '' })}
                className="flex items-center gap-1 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-sm text-slate-500 hover:border-primary-400 hover:text-primary-600 cursor-pointer"
              >
                <Plus size={14} />
                Añadir email
              </button>
            )}
          </div>
          <div className="mt-2 flex items-center gap-2">
            {company.job_portal_url ? (
              <div className="flex items-center gap-2">
                <a
                  href={company.job_portal_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
                >
                  <Briefcase size={14} />
                  Portal de empleo
                </a>
                <button
                  onClick={() => setJobPortalModal({ open: true, value: company.job_portal_url })}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                  title="Editar portal de empleo"
                >
                  <Pencil size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setJobPortalModal({ open: true, value: '' })}
                className="flex items-center gap-1 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-sm text-slate-500 hover:border-primary-400 hover:text-primary-600 cursor-pointer"
              >
                <Plus size={14} />
                Añadir portal de empleo
              </button>
            )}
          </div>
          <div className="mt-2 flex items-center gap-2">
            {company.my_role ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Rol: </span>
                <span className="text-sm text-slate-600 max-w-md truncate">{company.my_role}</span>
                <button
                  onClick={() => setMyRoleModal({ open: true, value: company.my_role })}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                  title="Editar rol"
                >
                  <Pencil size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setMyRoleModal({ open: true, value: '' })}
                className="flex items-center gap-1 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-sm text-slate-500 hover:border-primary-400 hover:text-primary-600 cursor-pointer"
              >
                <Plus size={14} />
                Añadir rol para plantillas
              </button>
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
          {company.status !== 'archived' && (
            <button
              onClick={() => setArchiveTarget(company)}
              className="rounded-lg p-2 text-slate-400 hover:bg-amber-50 hover:text-amber-600 cursor-pointer"
              title="Archivar empresa"
            >
              <Archive size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 pr-4">
          <Tabs tabs={tabDefs} activeTab={tab} onTabChange={setTab} />
          {(tab === 'contacts' || tab === 'messages') && (
            <Button
              size="sm"
              onClick={() => tab === 'contacts' ? setShowContactForm(true) : setShowMessageForm(true)}
            >
              <Plus size={16} />
              {tab === 'contacts' ? 'Añadir contacto' : 'Crear mensaje'}
            </Button>
          )}
        </div>

        <div className="p-6">
          {tab === 'contacts' && (
            <ContactsTab
              contacts={contacts}
              onAdd={() => { setEditingContact(null); setShowContactForm(true) }}
              onEdit={(contact) => { setEditingContact(contact); setShowContactForm(true) }}
              onDelete={(contact) => setDeleteContactTarget(contact)}
              onCopy={handleCopyEmail}
            />
          )}

          {tab === 'messages' && (
            <MessagesTab
              messages={companyMessages}
              companyEmail={company?.email}
              contactEmails={contacts?.filter(c => c.email).map(c => ({ name: `${c.first_name} ${c.last_name || ''}`, email: c.email })) || []}
              onAdd={() => setShowMessageForm(true)}
              onStatusChange={(msg, newStatus) => {
                const data = { status: newStatus }
                if (newStatus === 'sent') data.sent_at = new Date().toISOString()
                if (newStatus === 'replied') data.replied_at = new Date().toISOString()
                if (newStatus === 'closed') data.follow_up_done = true
                updateMessage.mutate(
                  { id: msg.id, data },
                  {
                    onSuccess: () =>
                      addToast({ type: 'success', message: `Estado cambiado a "${MESSAGE_STATUS_MAP[newStatus]?.label || newStatus}"` }),
                    onError: (err) =>
                      addToast({ type: 'error', message: `Error: ${err.message}` }),
                  }
                )
              }}
              onSend={(msg) => {
                sendMessage.mutate(
                  { messageId: msg.id },
                  {
                    onSuccess: () =>
                      addToast({ type: 'success', message: 'Mensaje enviado' }),
                    onError: (err) =>
                      addToast({ type: 'error', message: `Error: ${err.message}` }),
                  }
                )
              }}
              onDelete={(msg) => {
                deleteMessage.mutate(msg.id, {
                  onSuccess: () => addToast({ type: 'success', message: 'Mensaje eliminado' }),
                  onError: (err) => addToast({ type: 'error', message: `Error: ${err.message}` }),
                })
              }}
              isMutating={updateMessage.isPending || deleteMessage.isPending || sendMessage.isPending}
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
          contact={editingContact}
          onClose={() => { setShowContactForm(false); setEditingContact(null) }}
          onSubmit={handleContactSubmit}
          isSubmitting={createContact.isPending || updateContact.isPending}
        />
      )}

      {showMessageForm && (
        <EmailComposer
          open={showMessageForm}
          onClose={() => setShowMessageForm(false)}
          company={company}
          contacts={contacts || []}
          onSubmit={handleMessageSubmit}
          isSubmitting={createMessage.isPending}
        />
      )}

      <PromptModal
        open={emailModal.open}
        onClose={() => setEmailModal({ open: false, value: '' })}
        title={company?.email ? 'Editar email' : 'Añadir email'}
        label="Email de la empresa"
        placeholder="info@empresa.com"
        initialValue={emailModal.value}
        isSubmitting={updateCompany.isPending}
        onSubmit={(email) => {
          updateCompany.mutate(
            { id, data: { email } },
            {
              onSuccess: () => {
                addToast({ type: 'success', message: company?.email ? 'Email actualizado' : 'Email añadido' })
                setEmailModal({ open: false, value: '' })
              },
              onError: (err) =>
                addToast({ type: 'error', message: `Error: ${err.message}` }),
            }
          )
        }}
      />

      <PromptModal
        open={jobPortalModal.open}
        onClose={() => setJobPortalModal({ open: false, value: '' })}
        title={company?.job_portal_url ? 'Editar portal de empleo' : 'Añadir portal de empleo'}
        label="URL del portal de empleo"
        placeholder="https://.../jobs"
        initialValue={jobPortalModal.value}
        isSubmitting={updateCompany.isPending}
        onSubmit={(jobPortalUrl) => {
          updateCompany.mutate(
            { id, data: { job_portal_url: jobPortalUrl } },
            {
              onSuccess: () => {
                addToast({ type: 'success', message: company?.job_portal_url ? 'Portal de empleo actualizado' : 'Portal de empleo añadido' })
                setJobPortalModal({ open: false, value: '' })
              },
              onError: (err) =>
                addToast({ type: 'error', message: `Error: ${err.message}` }),
            }
          )
        }}
      />

      <PromptModal
        open={websiteModal.open}
        onClose={() => setWebsiteModal({ open: false, value: '' })}
        title="Editar sitio web"
        label="URL del sitio web"
        placeholder="https://..."
        initialValue={websiteModal.value}
        isSubmitting={updateCompany.isPending}
        onSubmit={(website) => {
          updateCompany.mutate(
            { id, data: { website } },
            {
              onSuccess: () => {
                addToast({ type: 'success', message: 'Web actualizada' })
                setWebsiteModal({ open: false, value: '' })
              },
              onError: (err) =>
                addToast({ type: 'error', message: `Error: ${err.message}` }),
            }
          )
        }}
      />

      <PromptModal
        open={myRoleModal.open}
        onClose={() => setMyRoleModal({ open: false, value: '' })}
        title={company?.my_role ? 'Editar rol para plantillas' : 'Añadir rol para plantillas'}
        label="Rol en esta empresa"
        placeholder="diseñador UI/UX y diseño digital end‑to‑end"
        initialValue={myRoleModal.value}
        isSubmitting={updateCompany.isPending}
        onSubmit={(myRole) => {
          updateCompany.mutate(
            { id, data: { my_role: myRole } },
            {
              onSuccess: () => {
                addToast({ type: 'success', message: company?.my_role ? 'Rol actualizado' : 'Rol añadido' })
                setMyRoleModal({ open: false, value: '' })
              },
              onError: (err) =>
                addToast({ type: 'error', message: `Error: ${err.message}` }),
            }
          )
        }}
      />

      <ConfirmModal
        open={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        title="Archivar empresa"
        message={`¿Archivar ${archiveTarget?.name || 'esta empresa'}? No aparecerá en la lista principal pero se conserva para evitar duplicados en futuras búsquedas.`}
        confirmLabel="Archivar"
        onConfirm={handleArchive}
      />

      <ConfirmModal
        open={!!deleteContactTarget}
        onClose={() => setDeleteContactTarget(null)}
        title="Eliminar contacto"
        message={`¿Eliminar a ${deleteContactTarget?.first_name}? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        danger
        isSubmitting={deleteContact.isPending}
        onConfirm={() => {
          if (!deleteContactTarget) return
          deleteContact.mutate(deleteContactTarget.id, {
            onSuccess: () => {
              addToast({ type: 'success', message: 'Contacto eliminado' })
              setDeleteContactTarget(null)
            },
            onError: (err) => {
              addToast({ type: 'error', message: `Error al eliminar: ${err.message}` })
              setDeleteContactTarget(null)
            },
          })
        }}
      />

      <ConfirmModal
        open={!!emailConfirm}
        onClose={() => setEmailConfirm(null)}
        title="Confirmar envío"
        message={`Se marcará como enviado el mensaje para ${emailConfirm?.recipient}. Recuerda enviarlo desde tu cliente de correo.`}
        confirmLabel="Confirmar envío"
        onConfirm={() => {
          if (!emailConfirm) return
          updateMessage.mutate(
            { id: emailConfirm.id, data: { status: 'sent' } },
            {
              onSuccess: () => {
                addToast({ type: 'success', message: `Mensaje marcado como enviado a ${emailConfirm.recipient}` })
                setEmailConfirm(null)
              },
              onError: (err) => {
                addToast({ type: 'error', message: `Error: ${err.message}` })
                setEmailConfirm(null)
              },
            }
          )
        }}
      />
    </div>
    </>
  )
}

function ContactsTab({ contacts, onAdd, onEdit, onDelete, onCopy }) {
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
                onClick={() => onEdit(c)}
                className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                title="Editar"
              >
                <Pencil size={14} />
              </button>
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

function MessagesTab({ messages, companyEmail, contactEmails, onAdd, onStatusChange, onSend, onDelete, isMutating }) {
  const [deleteTarget, setDeleteTarget] = useState(null)

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
      <div className="divide-y divide-slate-100">
        {messages.map((m) => {
          const statusInfo = MESSAGE_STATUS_MAP[m.status] || MESSAGE_STATUS_MAP.draft
          const recipient = m.contact_email || m.contact_first_name || companyEmail || 'sin destinatario'
          return (
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
                  {m.template_name && ` · Plantilla: ${m.template_name}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={m.status}
                  onChange={(e) => onStatusChange(m, e.target.value)}
                  disabled={isMutating}
                  className={`rounded-lg border px-2 py-1.5 text-xs font-semibold focus:ring-2 focus:outline-hidden disabled:opacity-50 cursor-pointer ${statusInfo.color}`}
                >
                  {Object.values(MESSAGE_STATUS_MAP).map((s) => (
                    <option key={s.value} value={s.value} className="bg-white text-slate-900 font-normal">
                      {s.label}
                    </option>
                  ))}
                </select>
                {m.status === 'draft' && (
                  <button
                    onClick={() => onSend(m)}
                    disabled={isMutating}
                    className="rounded-lg px-2 py-1.5 text-xs font-medium text-white bg-green-500 hover:bg-green-600 disabled:opacity-50 cursor-pointer flex items-center gap-1"
                    title="Enviar ahora"
                  >
                    <Send size={12} />
                    Enviar
                  </button>
                )}
                <span className="text-xs text-slate-400 min-w-16 text-right">
                  {m.sent_at
                    ? new Date(m.sent_at).toLocaleDateString('es-ES')
                    : 'Borrador'}
                </span>
                <button
                  onClick={() => setDeleteTarget(m)}
                  disabled={isMutating}
                  className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50 cursor-pointer"
                  title="Eliminar"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Eliminar mensaje"
        message={`¿Eliminar "${deleteTarget?.subject}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        danger
        onConfirm={() => {
          if (!deleteTarget) return
          onDelete(deleteTarget)
          setDeleteTarget(null)
        }}
      />
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

function ContactFormModal({ companyId, contact, onClose, onSubmit, isSubmitting }) {
  const isEditing = !!contact
  const [form, setForm] = useState({
    company_id: companyId,
    first_name: contact?.first_name || '',
    last_name: contact?.last_name || '',
    role: contact?.role || '',
    role_type: contact?.role_type || 'other',
    email: contact?.email || '',
    phone: contact?.phone || '',
    linkedin_url: contact?.linkedin_url || '',
    is_primary: contact?.is_primary || false,
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
            {isEditing ? 'Editar contacto' : 'Añadir contacto'}
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

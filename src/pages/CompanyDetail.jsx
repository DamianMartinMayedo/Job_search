import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowSquareOut, Copy, Trash, Plus, Envelope, X, Pencil, CheckCircle, Eye, PaperPlaneRight, Briefcase, Archive } from '@phosphor-icons/react'
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
  { value: 'messages', label: 'Mensajes' },
  { value: 'contacts', label: 'Contactos' },
  { value: 'notes', label: 'Notas' },
  { value: 'activity', label: 'Actividad' },
]

// Definición declarativa de cada campo editable inline. Antes había 6 PromptModals
// separados, todos haciendo lo mismo (updateCompany.mutate con un campo distinto).
// Ahora un solo modal lee el `kind` y deriva título, label, tipo y transform.
const EDIT_FIELDS = {
  name: { field: 'name', title: 'Editar nombre', label: 'Nombre', placeholder: 'Nombre de la empresa', type: 'text' },
  email: { field: 'email', title: 'Editar email', label: 'Email', placeholder: 'contacto@empresa.com', type: 'email' },
  website: { field: 'website', title: 'Editar sitio web', label: 'URL del sitio', placeholder: 'https://empresa.com', type: 'url' },
  jobPortal: { field: 'job_portal_url', title: 'Editar portal de empleo', label: 'URL del portal', placeholder: 'https://empresa.com/careers', type: 'url' },
  myRole: { field: 'my_role', title: 'Editar rol que ofreces', label: 'Rol', placeholder: 'Senior UX Designer', type: 'text' },
  interest: { field: 'interest_level', title: 'Nivel de interés', label: 'Interés (1-5)', placeholder: '1-5', type: 'number', min: 1, max: 5, transform: (v) => parseInt(v, 10) },
}

export default function CompanyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [tab, setTab] = useState('messages')
  const [showContactForm, setShowContactForm] = useState(false)
  const [showMessageForm, setShowMessageForm] = useState(false)
  // Prefill del composer cuando se llega desde una oferta vía query string.
  // Se vacía al cerrar el composer y se limpia el query.
  const [composerPrefill, setComposerPrefill] = useState(null)
  const [notes, setNotes] = useState('')
  const notesTimerRef = useRef(null)
  // Un único state para todos los inline edits: { kind: 'email'|'website'|..., value: string } | null
  const [editField, setEditField] = useState(null)
  const [editingContact, setEditingContact] = useState(null)
  const [archiveTarget, setArchiveTarget] = useState(null)
  const [deleteContactTarget, setDeleteContactTarget] = useState(null)

  const addToast = useAppStore((s) => s.addToast)
  const dismissLoadingToast = useAppStore((s) => s.dismissLoadingToast)

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

  // Llegada desde una oferta: ?compose=1&templateId=...&jobTitle=...&jobUrl=...&jobLocation=...
  // Abre el EmailComposer pre-rellenado y limpia el query de la URL.
  useEffect(() => {
    if (searchParams.get('compose') !== '1') return
    setComposerPrefill({
      templateId: searchParams.get('templateId') || null,
      jobTitle: searchParams.get('jobTitle') || '',
      jobUrl: searchParams.get('jobUrl') || '',
      jobLocation: searchParams.get('jobLocation') || '',
    })
    setShowMessageForm(true)
    // Limpiar el query string sin recargar para no abrir el composer en cada navegación.
    const next = new URLSearchParams(searchParams)
    next.delete('compose')
    next.delete('templateId')
    next.delete('jobTitle')
    next.delete('jobUrl')
    next.delete('jobLocation')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  const contacts = company?.contacts || []
  const companyMessages = company?.messages || []
  const companyActivity = company?.activity || []

  const handleStatusChange = (newStatus) => {
    addToast({ type: 'loading', message: 'Cambiando estado...' })
    updateCompany.mutate(
      { id, data: { status: newStatus } },
      {
        onSuccess: () => {
          dismissLoadingToast()
          addToast({ type: 'success', message: `Estado cambiado a "${newStatus}"` })
        },
        onError: (err) => {
          dismissLoadingToast()
          addToast({ type: 'error', message: `Error al cambiar estado: ${err.message}` })
        },
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
    addToast({ type: 'loading', message: 'Guardando contacto...' })
    try {
      if (editingContact) {
        await updateContact.mutateAsync({ id: editingContact.id, data: formData })
        dismissLoadingToast()
        addToast({ type: 'success', message: `${formData.first_name} actualizado` })
      } else {
        await createContact.mutateAsync(formData)
        dismissLoadingToast()
        addToast({ type: 'success', message: `${formData.first_name} añadido` })
      }
      setShowContactForm(false)
      setEditingContact(null)
    } catch (err) {
      dismissLoadingToast()
      addToast({ type: 'error', message: `Error: ${err.message}` })
    }
  }

  const handleArchive = () => {
    addToast({ type: 'loading', message: 'Archivando empresa...' })
    updateCompany.mutate(
      { id, data: { status: 'archived' } },
      {
        onSuccess: () => {
          dismissLoadingToast()
          addToast({ type: 'success', message: `${company.name} archivada` })
          setArchiveTarget(null)
        },
        onError: (err) => {
          dismissLoadingToast()
          addToast({ type: 'error', message: `Error: ${err.message}` })
        },
      }
    )
  }

  const handleMessageSubmit = async (data, shouldSend, pairName) => {
    addToast({ type: 'loading', message: shouldSend ? 'Enviando mensaje...' : 'Guardando borrador...' })
    try {
      const message = await createMessage.mutateAsync({ ...data, pair_name: pairName || null })
      if (shouldSend) {
        sendMessage.mutate(
          { messageId: message.id },
          {
            onSuccess: () => {
              dismissLoadingToast()
              addToast({ type: 'success', message: `Mensaje enviado a ${data.recipient_email || 'destinatario'}` })
            },
            onError: (err) => {
              dismissLoadingToast()
              addToast({ type: 'error', message: `Error al enviar: ${err.message}` })
            },
          }
        )
      } else {
        dismissLoadingToast()
        addToast({ type: 'success', message: 'Borrador guardado' })
      }
      setShowMessageForm(false)
    } catch (err) {
      dismissLoadingToast()
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
        <p className="text-lg text-[#9F2F2D]">Error al cargar: {companyError.message}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-sm text-[#111111] hover:underline cursor-pointer"
        >
          Volver atrás
        </button>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg text-[#787774]">Empresa no encontrada</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-sm text-[#111111] hover:underline cursor-pointer"
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
        className="mb-4 flex items-center gap-1 text-sm text-[#787774] hover:text-[#111111] cursor-pointer transition-colors"
      >
        <ArrowLeft size={16} />
        Volver atrás
      </button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-[family-name:var(--font-serif)] text-3xl font-semibold tracking-tight text-[#111111]">{company.name}</h1>
            <button
              onClick={() => setEditField({ kind: 'name', value: company.name || '' })}
              className="rounded p-1 text-[#ABABAB] hover:bg-[#F7F6F3] hover:text-[#111111] cursor-pointer transition-colors"
              title="Editar nombre"
            >
              <Pencil size={14} />
            </button>
            <Badge className={status.color}>{status.label}</Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-[#787774]">
            {company.sector && <span>{company.sector}</span>}
            {company.city && <span>· {company.city}</span>}
            {company.website && (
              <div className="flex items-center gap-1">
                <a
                  href={company.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[#111111] hover:underline"
                >
                  <ArrowSquareOut size={14} weight="bold" />
                  {company.domain || company.website}
                </a>
                <button
                  onClick={() => setEditField({ kind: 'website', value: company.website || '' })}
                  className="rounded p-0.5 text-[#ABABAB] hover:bg-[#F7F6F3] hover:text-[#111111] cursor-pointer transition-colors"
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
                <span className="text-sm text-[#2F3437]">{company.email}</span>
                <button
                  onClick={() => setEditField({ kind: 'email', value: company.email || '' })}
                  className="rounded p-1 text-[#ABABAB] hover:bg-[#F7F6F3] hover:text-[#111111] cursor-pointer transition-colors"
                  title="Editar email"
                >
                  <Pencil size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditField({ kind: 'email', value: '' })}
                className="flex items-center gap-1 rounded-lg border border-dashed border-[#EAEAEA] px-3 py-1.5 text-sm text-[#787774] hover:border-[#111111] hover:text-[#111111] cursor-pointer transition-colors"
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
                  className="flex items-center gap-1 text-sm text-[#111111] hover:underline"
                >
                  <Briefcase size={14} weight="regular" />
                  Portal de empleo
                </a>
                <button
                  onClick={() => setEditField({ kind: 'jobPortal', value: company.job_portal_url || '' })}
                  className="rounded p-1 text-[#ABABAB] hover:bg-[#F7F6F3] hover:text-[#111111] cursor-pointer transition-colors"
                  title="Editar portal de empleo"
                >
                  <Pencil size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditField({ kind: 'jobPortal', value: '' })}
                className="flex items-center gap-1 rounded-lg border border-dashed border-[#EAEAEA] px-3 py-1.5 text-sm text-[#787774] hover:border-[#111111] hover:text-[#111111] cursor-pointer transition-colors"
              >
                <Plus size={14} />
                Añadir portal de empleo
              </button>
            )}
          </div>
          <div className="mt-2 flex items-center gap-2">
            {company.my_role ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#787774]">Rol: </span>
                <span className="text-sm text-[#2F3437] max-w-md truncate">{company.my_role}</span>
                <button
                  onClick={() => setEditField({ kind: 'myRole', value: company.my_role || '' })}
                  className="rounded p-1 text-[#ABABAB] hover:bg-[#F7F6F3] hover:text-[#111111] cursor-pointer transition-colors"
                  title="Editar rol"
                >
                  <Pencil size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditField({ kind: 'myRole', value: '' })}
                className="flex items-center gap-1 rounded-lg border border-dashed border-[#EAEAEA] px-3 py-1.5 text-sm text-[#787774] hover:border-[#111111] hover:text-[#111111] cursor-pointer transition-colors"
              >
                <Plus size={14} />
                Añadir rol para plantillas
              </button>
            )}
          </div>
          <div className="mt-2 flex items-center gap-2">
            {company.interest_level ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#787774]">Interés: </span>
                <span className="text-sm font-medium text-[#2F3437]">{company.interest_level}/5</span>
                <button
                  onClick={() => setEditField({ kind: 'interest', value: String(company.interest_level) })}
                  className="rounded p-1 text-[#ABABAB] hover:bg-[#F7F6F3] hover:text-[#111111] cursor-pointer transition-colors"
                  title="Editar interés"
                >
                  <Pencil size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditField({ kind: 'interest', value: '' })}
                className="flex items-center gap-1 rounded-lg border border-dashed border-[#EAEAEA] px-3 py-1.5 text-sm text-[#787774] hover:border-[#111111] hover:text-[#111111] cursor-pointer transition-colors"
              >
                <Plus size={14} />
                Añadir interés
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={company.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="rounded-lg border border-[#EAEAEA] bg-white px-3 py-2 text-sm text-[#111111] focus:border-[#111111] focus:ring-2 focus:ring-black/5 focus:outline-hidden transition-colors"
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
              className="rounded-lg p-2 text-[#ABABAB] hover:bg-[#FBF3DB] hover:text-[#956400] cursor-pointer transition-colors"
              title="Archivar empresa"
            >
              <Archive size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-[#EAEAEA] bg-white">
        <div className="flex items-center justify-between border-b border-[#EAEAEA] pr-4">
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
                addToast({ type: 'loading', message: 'Cambiando estado...' })
                updateMessage.mutate(
                  { id: msg.id, data },
                  {
                    onSuccess: () => {
                      dismissLoadingToast()
                      addToast({ type: 'success', message: `Estado cambiado a "${MESSAGE_STATUS_MAP[newStatus]?.label || newStatus}"` })
                    },
                    onError: (err) => {
                      dismissLoadingToast()
                      addToast({ type: 'error', message: `Error: ${err.message}` })
                    },
                  }
                )
              }}
              onSend={(msg) => {
                addToast({ type: 'loading', message: 'Enviando mensaje...' })
                sendMessage.mutate(
                  { messageId: msg.id },
                  {
                    onSuccess: () => {
                      dismissLoadingToast()
                      addToast({ type: 'success', message: 'Mensaje enviado' })
                    },
                    onError: (err) => {
                      dismissLoadingToast()
                      addToast({ type: 'error', message: `Error: ${err.message}` })
                    },
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
              <label className="text-sm font-medium text-[#2F3437]">
                Notas sobre esta empresa
              </label>
              <textarea
                value={notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Escribe notas aquí... se guardan automáticamente"
                className="min-h-48 rounded-lg border border-[#EAEAEA] bg-white px-3 py-2 text-sm text-[#111111] placeholder:text-[#ABABAB] focus:border-[#111111] focus:ring-2 focus:ring-black/5 focus:outline-hidden resize-y transition-colors"
              />
              <p className="text-xs text-[#ABABAB]">
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
          onClose={() => { setShowMessageForm(false); setComposerPrefill(null) }}
          company={company}
          contacts={contacts || []}
          prefill={composerPrefill}
          onSubmit={handleMessageSubmit}
          isSubmitting={createMessage.isPending}
        />
      )}

      {/* Un único PromptModal compartido por todos los campos editables del header.
          editField === { kind, value } se mapea a la config de EDIT_FIELDS. */}
      {editField && (() => {
        const conf = EDIT_FIELDS[editField.kind]
        if (!conf) return null
        return (
          <PromptModal
            open
            onClose={() => setEditField(null)}
            title={conf.title}
            label={conf.label}
            placeholder={conf.placeholder}
            initialValue={editField.value}
            isSubmitting={updateCompany.isPending}
            type={conf.type}
            min={conf.min}
            max={conf.max}
            onSubmit={(raw) => {
              let value = raw
              if (conf.transform) {
                value = conf.transform(raw)
                if (conf.field === 'interest_level' && (isNaN(value) || value < 1 || value > 5)) {
                  addToast({ type: 'error', message: 'El interés debe ser un número del 1 al 5' })
                  return
                }
              }
              addToast({ type: 'loading', message: 'Guardando...' })
              updateCompany.mutate(
                { id, data: { [conf.field]: value } },
                {
                  onSuccess: () => {
                    dismissLoadingToast()
                    addToast({ type: 'success', message: `${conf.label} guardado` })
                    setEditField(null)
                  },
                  onError: (err) => {
                    dismissLoadingToast()
                    addToast({ type: 'error', message: `Error: ${err.message}` })
                  },
                }
              )
            }}
          />
        )
      })()}

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
          addToast({ type: 'loading', message: 'Eliminando contacto...' })
          deleteContact.mutate(deleteContactTarget.id, {
            onSuccess: () => {
              dismissLoadingToast()
              addToast({ type: 'success', message: 'Contacto eliminado' })
              setDeleteContactTarget(null)
            },
            onError: (err) => {
              dismissLoadingToast()
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
      <div className="divide-y divide-[#EAEAEA]">
        {contacts.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between gap-4 py-3"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-[#111111]">
                  {c.first_name} {c.last_name}
                </p>
                {c.is_primary && (
                  <Badge className="bg-[#E1F3FE] text-[#1F6C9F] border-[#BEE0F9]">
                    Principal
                  </Badge>
                )}
              </div>
              <p className="text-xs text-[#787774]">
                {ROLE_TYPES_MAP[c.role_type] || c.role || 'Sin rol'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {c.email && (
                <button
                  onClick={() => onCopy(c.email)}
                  className="rounded p-1.5 text-[#ABABAB] hover:bg-[#F7F6F3] hover:text-[#111111] cursor-pointer transition-colors"
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
                  className="rounded p-1.5 text-[#ABABAB] hover:bg-[#E1F3FE] hover:text-[#1F6C9F] transition-colors"
                  title="LinkedIn"
                >
                  <ArrowSquareOut size={16} weight="bold" />
                </a>
              )}
              <button
                onClick={() => onEdit(c)}
                className="rounded p-1.5 text-[#ABABAB] hover:bg-[#F7F6F3] hover:text-[#111111] cursor-pointer transition-colors"
                title="Editar"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => onDelete(c)}
                className="rounded p-1.5 text-[#ABABAB] hover:bg-[#FDEBEC] hover:text-[#9F2F2D] cursor-pointer transition-colors"
                title="Eliminar"
              >
                <Trash size={16} weight="bold" />
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
        icon={Envelope}
        title="Sin mensajes"
        description="Crea un email de contacto para esta empresa"
        action={
          <Button onClick={onAdd}>
            <Envelope size={18} weight="regular" />
            Crear mensaje
          </Button>
        }
      />
    )
  }

  return (
    <div>
      <div className="divide-y divide-[#EAEAEA]">
        {messages.map((m) => {
          const statusInfo = MESSAGE_STATUS_MAP[m.status] || MESSAGE_STATUS_MAP.draft
          const recipient = m.contact_email || m.contact_first_name || companyEmail || 'sin destinatario'
          return (
            <div
              key={m.id}
              className="flex items-center justify-between gap-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#111111] truncate">
                  {m.subject}
                </p>
                <p className="text-xs text-[#787774]">
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
                    <option key={s.value} value={s.value} className="bg-white text-[#111111] font-normal">
                      {s.label}
                    </option>
                  ))}
                </select>
                {m.status === 'draft' && (
                  <button
                    onClick={() => onSend(m)}
                    disabled={isMutating}
                    className="rounded-lg px-2 py-1.5 text-xs font-medium text-white bg-[#111111] hover:bg-[#333333] disabled:opacity-50 cursor-pointer flex items-center gap-1 transition-colors"
                    title="Enviar ahora"
                  >
                    <PaperPlaneRight size={12} weight="bold" />
                    Enviar
                  </button>
                )}
                <span className="text-xs text-[#ABABAB] min-w-16 text-right">
                  {m.sent_at
                    ? new Date(m.sent_at).toLocaleDateString('es-ES')
                    : 'Borrador'}
                </span>
                <button
                  onClick={() => setDeleteTarget(m)}
                  disabled={isMutating}
                  className="rounded p-1 text-[#ABABAB] hover:bg-[#FDEBEC] hover:text-[#9F2F2D] disabled:opacity-50 cursor-pointer transition-colors"
                  title="Eliminar"
                >
                  <Trash size={14} weight="bold" />
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
      <p className="py-8 text-center text-sm text-[#ABABAB]">
        No hay actividad registrada
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {activity.map((a) => (
        <div key={a.id} className="flex gap-3">
          <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#EAEAEA]" />
          <div>
            <p className="text-sm text-[#2F3437]">{a.description}</p>
            <p className="text-xs text-[#ABABAB]">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-lg border border-[#EAEAEA] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between border-b border-[#EAEAEA] px-6 py-4">
          <h2 className="text-base font-semibold text-[#111111] tracking-[-0.01em]">
            {isEditing ? 'Editar contacto' : 'Añadir contacto'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[#ABABAB] hover:bg-[#F7F6F3] hover:text-[#111111] cursor-pointer transition-colors"
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
            <label className="text-sm font-medium text-[#2F3437]">
              Tipo de rol
            </label>
            <select
              value={form.role_type}
              onChange={(e) => handleChange('role_type', e.target.value)}
              className="rounded-lg border border-[#EAEAEA] bg-white px-3 py-2 text-sm text-[#111111] focus:border-[#111111] focus:ring-2 focus:ring-black/5 focus:outline-hidden transition-colors"
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
          <label className="flex items-center gap-2 text-sm text-[#2F3437]">
            <input
              type="checkbox"
              checked={form.is_primary}
              onChange={(e) => handleChange('is_primary', e.target.checked)}
              className="rounded border-[#EAEAEA] cursor-pointer"
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

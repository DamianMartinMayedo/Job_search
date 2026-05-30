import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Envelope,
  Plus,
  Trash,
  PaperPlaneRight,
  Pencil,
  X,
  CaretLeft,
  CaretRight,
  Buildings,
} from '@phosphor-icons/react'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import ConfirmModal from '../components/ui/ConfirmModal'
import { useMessages, useCreateMessage, useUpdateMessage, useDeleteMessage, useSendMessage, useBatchMessages } from '../hooks/useMessages'
import { useCompanies } from '../hooks/useCompanies'
import { MESSAGE_STATUS, MESSAGE_STATUS_MAP } from '../utils/constants'
import GlobalEmailComposer from '../components/messages/GlobalEmailComposer'
import EmailComposer from '../components/messages/EmailComposer'
import useAppStore from '../store/useAppStore'

const PAGE_SIZE = 20

export default function Messages() {
  const navigate = useNavigate()
  const addToast = useAppStore((s) => s.addToast)
  const dismissLoadingToast = useAppStore((s) => s.dismissLoadingToast)
  const [statusFilter, setStatusFilter] = useState('')
  const [companyFilter, setCompanyFilter] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState([])
  const [showComposer, setShowComposer] = useState(false)
  const [editingDraft, setEditingDraft] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [batchAction, setBatchAction] = useState(null)

  const { data, isLoading, refetch } = useMessages(statusFilter || null, {
    page,
    limit: PAGE_SIZE,
    companyId: companyFilter || undefined,
  })
  const { data: companiesData } = useCompanies({ page: 1, limit: 100 })
  const companies = companiesData?.companies || []

  const messages = data?.messages || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const createMessage = useCreateMessage()
  const updateMessage = useUpdateMessage()
  const deleteMessage = useDeleteMessage()
  const sendMessage = useSendMessage()
  const batchMessages = useBatchMessages()

  const handleStatusChange = (messageId, newStatus) => {
    addToast({ message: 'Cambiando estado...', type: 'loading' })
    updateMessage.mutate(
      { id: messageId, data: { status: newStatus } },
      {
        onSuccess: () => {
          dismissLoadingToast()
          addToast({ message: `Mensaje marcado como ${MESSAGE_STATUS_MAP[newStatus]?.label}`, type: 'success' })
        },
        onError: (err) => {
          dismissLoadingToast()
          addToast({ message: `Error: ${err.message}`, type: 'error' })
        },
      }
    )
  }

  const handleDelete = (messageId) => {
    addToast({ message: 'Eliminando mensaje...', type: 'loading' })
    deleteMessage.mutate(messageId, {
      onSuccess: () => {
        dismissLoadingToast()
        addToast({ message: 'Mensaje eliminado', type: 'success' })
        setDeleteTarget(null)
      },
      onError: (err) => {
        dismissLoadingToast()
        addToast({ message: `Error: ${err.message}`, type: 'error' })
        setDeleteTarget(null)
      },
    })
  }

  const handleSend = (messageId, pairName = null) => {
    addToast({ message: 'Enviando mensaje...', type: 'loading' })
    sendMessage.mutate(
      { messageId, pair_name: pairName },
      {
        onSuccess: () => {
          dismissLoadingToast()
          addToast({ message: 'Mensaje enviado', type: 'success' })
        },
        onError: (err) => {
          dismissLoadingToast()
          addToast({ message: `Error al enviar: ${err.message}`, type: 'error' })
        },
      }
    )
  }

  const handleBatchAction = () => {
    if (!batchAction) return
    if (batchAction.action === 'delete') {
      addToast({ message: `Eliminando ${selected.length} mensajes...`, type: 'loading' })
      batchMessages.mutate(
        { ids: selected, action: 'delete' },
        {
          onSuccess: () => {
            dismissLoadingToast()
            addToast({ message: `${selected.length} mensajes eliminados`, type: 'success' })
            setSelected([])
            setBatchAction(null)
          },
          onError: (err) => {
            dismissLoadingToast()
            addToast({ message: `Error: ${err.message}`, type: 'error' })
            setBatchAction(null)
          },
        }
      )
    } else if (batchAction.action === 'status' && batchAction.status) {
      addToast({ message: `Actualizando ${selected.length} mensajes...`, type: 'loading' })
      batchMessages.mutate(
        { ids: selected, action: 'status', status: batchAction.status },
        {
          onSuccess: () => {
            dismissLoadingToast()
            addToast({ message: `${selected.length} mensajes actualizados`, type: 'success' })
            setSelected([])
            setBatchAction(null)
          },
          onError: (err) => {
            dismissLoadingToast()
            addToast({ message: `Error: ${err.message}`, type: 'error' })
            setBatchAction(null)
          },
        }
      )
    }
  }

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selected.length === messages.length) {
      setSelected([])
    } else {
      setSelected(messages.map((m) => m.id))
    }
  }

  const getStatusBadge = (status) => {
    const info = MESSAGE_STATUS_MAP[status]
    if (!info) return <Badge variant="secondary">—</Badge>
    return (
      <Badge
        variant="default"
        className={`${info.color} border`}
      >
        {info.label}
      </Badge>
    )
  }

  const getRecipientDisplay = (msg) => {
    if (msg.contact_first_name) {
      return `${msg.contact_first_name}${msg.contact_role ? ` · ${msg.contact_role}` : ''}`
    }
    if (msg.recipient_email) return msg.recipient_email
    return '—'
  }

  const handleDraftSubmit = (data, shouldSend, pairName) => {
    if (editingDraft) {
      addToast({ message: 'Actualizando borrador...', type: 'loading' })
      updateMessage.mutate(
        { id: editingDraft.id, data },
        {
          onSuccess: () => {
            dismissLoadingToast()
            if (shouldSend) {
              handleSend(editingDraft.id, pairName)
            } else {
              addToast({ message: 'Borrador actualizado', type: 'success' })
            }
            setEditingDraft(null)
          },
          onError: (err) => {
            dismissLoadingToast()
            addToast({ message: `Error: ${err.message}`, type: 'error' })
          },
        }
      )
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#EAEAEA] border-t-[#111111]" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-serif)] text-3xl font-semibold tracking-tight text-[#111111]">Mensajes</h1>
          <p className="mt-1 text-sm text-[#787774]">
            {total} mensaje{total !== 1 ? 's' : ''} en total
            {statusFilter && ` · ${MESSAGE_STATUS_MAP[statusFilter]?.label || statusFilter}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowComposer(true)}>
            <Plus size={18} />
            Nuevo mensaje
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="rounded-lg border border-[#EAEAEA] bg-white px-3 py-2 text-sm text-[#111111] focus:border-[#111111] focus:ring-2 focus:ring-black/5 focus:outline-hidden transition-colors"
        >
          <option value="">Todos los estados</option>
          {MESSAGE_STATUS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <select
          value={companyFilter}
          onChange={(e) => { setCompanyFilter(e.target.value); setPage(1) }}
          className="rounded-lg border border-[#EAEAEA] bg-white px-3 py-2 text-sm text-[#111111] focus:border-[#111111] focus:ring-2 focus:ring-black/5 focus:outline-hidden transition-colors"
        >
          <option value="">Todas las empresas</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {(statusFilter || companyFilter) && (
          <button
            onClick={() => { setStatusFilter(''); setCompanyFilter(''); setPage(1) }}
            className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-[#787774] hover:bg-[#F7F6F3] hover:text-[#111111] cursor-pointer transition-colors"
          >
            <X size={16} />
            Limpiar
          </button>
        )}
      </div>

      {selected.length > 0 && (
        <div className="mt-4 flex items-center justify-between rounded-lg bg-[#111111] px-4 py-3 text-white">
          <span className="text-sm font-medium">
            {selected.length} mensaje{selected.length !== 1 ? 's' : ''} seleccionado{selected.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            <select
              onChange={(e) => {
                const val = e.target.value
                if (!val) return
                e.target.value = ''
                const [action, status] = val.split(':')
                setBatchAction({ action, status })
              }}
              className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white focus:ring-2 focus:ring-white/20 focus:outline-hidden cursor-pointer"
            >
              <option value="">Cambiar estado...</option>
              <option value="status:sent">Enviado</option>
              <option value="status:replied">Respondido</option>
              <option value="status:closed">Cerrado</option>
              <option value="status:draft">Borrador</option>
            </select>
            {batchAction?.action?.startsWith('status') && (
              <button
                onClick={handleBatchAction}
                disabled={batchMessages.isPending}
                className="rounded-lg border border-white/20 px-3 py-1.5 text-sm hover:bg-white/15 disabled:opacity-50 cursor-pointer transition-colors"
              >
                {batchMessages.isPending ? 'Aplicando...' : 'Aplicar'}
              </button>
            )}
            <button
              onClick={() => {
                setBatchAction({ action: 'delete' })
                handleBatchAction()
              }}
              disabled={batchMessages.isPending}
              className="rounded-lg border border-white/20 px-3 py-1.5 text-sm hover:bg-white/15 disabled:opacity-50 cursor-pointer transition-colors"
            >
              {batchMessages.isPending ? 'Eliminando...' : 'Eliminar'}
            </button>
            <button
              onClick={() => setSelected([])}
              className="ml-2 text-sm text-white/70 hover:text-white cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="mt-4">
        {messages.length === 0 ? (
          <EmptyState
            icon={Envelope}
            title="No hay mensajes"
            description={
              statusFilter || companyFilter
                ? 'Prueba con otros filtros o borra los actuales'
                : 'Crea tu primer mensaje para empezar'
            }
            action={
              !statusFilter && !companyFilter ? (
                <Button onClick={() => setShowComposer(true)}>
                  <Plus size={18} />
                  Nuevo mensaje
                </Button>
              ) : (
                <Button variant="secondary" onClick={() => { setStatusFilter(''); setCompanyFilter('') }}>
                  Limpiar filtros
                </Button>
              )
            }
          />
        ) : (
          <div className="overflow-hidden rounded-lg border border-[#EAEAEA] bg-white">
            <div className="hidden md:flex items-center border-b border-[#EAEAEA] bg-[#F7F6F3]">
              <div className="shrink-0 px-3 py-2">
                <input
                  type="checkbox"
                  checked={selected.length === messages.length && messages.length > 0}
                  onChange={toggleSelectAll}
                  className="size-4 rounded border-[#EAEAEA] cursor-pointer"
                />
              </div>
              <div className="flex-1 grid grid-cols-12 gap-4 px-4 py-2">
                <div className="col-span-3 text-xs font-medium uppercase tracking-[0.04em] text-[#787774]">Empresa</div>
                <div className="col-span-2 text-xs font-medium uppercase tracking-[0.04em] text-[#787774]">Destinatario</div>
                <div className="col-span-3 text-xs font-medium uppercase tracking-[0.04em] text-[#787774]">Asunto</div>
                <div className="col-span-2 text-xs font-medium uppercase tracking-[0.04em] text-[#787774]">Estado</div>
                <div className="col-span-2 text-right text-xs font-medium uppercase tracking-[0.04em] text-[#787774]">Acciones</div>
              </div>
            </div>
            {messages.map((msg, index) => (
              <div
                key={msg.id}
                className="flex items-center border-b border-[#EAEAEA] last:border-b-0 hover:bg-[#F7F6F3] transition-colors duration-150"
                style={{
                  animation: 'fadeInUp 300ms ease-out forwards',
                  animationDelay: `${index * 50}ms`,
                  opacity: 0,
                }}
              >
                <div className="shrink-0 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={selected.includes(msg.id)}
                    onChange={() => toggleSelect(msg.id)}
                    className="size-4 rounded border-[#EAEAEA] cursor-pointer"
                  />
                </div>
                <div className="flex-1 grid grid-cols-1 px-4 py-3 md:grid-cols-12 md:items-center md:gap-4">
                  <div className="col-span-3">
                    <button
                      onClick={() => navigate(`/app/companies/${msg.company_id}`)}
                      className="flex items-center gap-1.5 text-sm text-[#2F3437] hover:text-[#111111] hover:underline cursor-pointer"
                    >
                      <Buildings size={14} weight="regular" className="text-[#ABABAB]" />
                      <span className="truncate max-w-32">{msg.company_name}</span>
                    </button>
                    <p className="text-xs text-slate-400 mt-0.5">{msg.template_name || '—'}</p>
                  </div>
                  <div className="col-span-2 text-sm text-slate-600 truncate">
                    {getRecipientDisplay(msg)}
                  </div>
                  <div className="col-span-3 text-sm text-slate-900 truncate">
                    {msg.subject || '—'}
                  </div>
                  <div className="col-span-2">
                    <select
                      value={msg.status}
                      onChange={(e) => handleStatusChange(msg.id, e.target.value)}
                      disabled={updateMessage.isPending}
                      className={`rounded-lg border px-2 py-1 text-xs font-semibold focus:ring-2 focus:outline-hidden disabled:opacity-50 cursor-pointer ${MESSAGE_STATUS_MAP[msg.status]?.color || ''}`}
                    >
                      {MESSAGE_STATUS.map((s) => (
                        <option key={s.value} value={s.value} className="bg-white text-slate-900 font-normal">
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-400 mt-1">
                      {msg.sent_at
                        ? new Date(msg.sent_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
                        : msg.created_at
                        ? new Date(msg.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
                        : '—'}
                    </p>
                  </div>
                  <div className="col-span-2 flex justify-end gap-1">
                    {msg.status === 'draft' && (
                      <>
                        <button
                          onClick={() => handleSend(msg.id)}
                          disabled={sendMessage.isPending}
                          className="rounded p-1.5 text-[#ABABAB] hover:bg-[#EDF3EC] hover:text-[#346538] disabled:opacity-50 cursor-pointer transition-colors"
                          title="Enviar"
                        >
                          <PaperPlaneRight size={14} weight="bold" />
                        </button>
                        <button
                          onClick={() => setEditingDraft(msg)}
                          disabled={updateMessage.isPending}
                          className="rounded p-1.5 text-[#ABABAB] hover:bg-[#F7F6F3] hover:text-[#111111] disabled:opacity-50 cursor-pointer transition-colors"
                          title="Editar borrador"
                        >
                          <Pencil size={14} weight="regular" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setDeleteTarget(msg)}
                      disabled={deleteMessage.isPending}
                      className="rounded p-1.5 text-[#ABABAB] hover:bg-[#FDEBEC] hover:text-[#9F2F2D] disabled:opacity-50 cursor-pointer transition-colors"
                      title="Eliminar"
                    >
                      <Trash size={14} weight="bold" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && messages.length > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-[#787774]">
              Página {page} de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <CaretLeft size={16} weight="bold" />
                Anterior
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Siguiente
                <CaretRight size={16} weight="bold" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <GlobalEmailComposer
        open={showComposer}
        onClose={() => setShowComposer(false)}
        onSubmit={(data, shouldSend, pairName) => {
          if (shouldSend) {
            addToast({ message: 'Enviando mensaje...', type: 'loading' })
            createMessage.mutate(data, {
              onSuccess: (msg) => {
                sendMessage.mutate({ messageId: msg.id, pair_name: pairName }, {
                  onSuccess: () => {
                    dismissLoadingToast()
                    addToast({ message: 'Mensaje creado y enviado', type: 'success' })
                    setShowComposer(false)
                  },
                  onError: (err) => {
                    dismissLoadingToast()
                    addToast({ message: `Error al enviar: ${err.message}`, type: 'error' })
                  },
                })
              },
              onError: (err) => {
                dismissLoadingToast()
                addToast({ message: `Error: ${err.message}`, type: 'error' })
              },
            })
          } else {
            addToast({ message: 'Guardando borrador...', type: 'loading' })
            createMessage.mutate(data, {
              onSuccess: () => {
                dismissLoadingToast()
                addToast({ message: 'Borrador guardado', type: 'success' })
                setShowComposer(false)
              },
              onError: (err) => {
                dismissLoadingToast()
                addToast({ message: `Error: ${err.message}`, type: 'error' })
              },
            })
          }
        }}
        isSubmitting={createMessage.isPending || sendMessage.isPending}
      />

      {editingDraft && (
        <EmailComposer
          open={true}
          onClose={() => setEditingDraft(null)}
          company={{ id: editingDraft.company_id, name: editingDraft.company_name }}
          contacts={[]}
          initialData={{
            subject: editingDraft.subject,
            body: editingDraft.body,
            template_id: editingDraft.template_id,
            recipient_email: editingDraft.recipient_email,
            contact_id: editingDraft.contact_id,
          }}
          onSubmit={handleDraftSubmit}
          isSubmitting={updateMessage.isPending || sendMessage.isPending}
        />
      )}

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => handleDelete(deleteTarget?.id)}
        title="Eliminar mensaje"
        message={`¿Eliminar el mensaje "${deleteTarget?.subject}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
      />
    </div>
  )
}

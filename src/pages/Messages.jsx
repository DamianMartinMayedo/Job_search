import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Trash2 } from 'lucide-react'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import ConfirmModal from '../components/ui/ConfirmModal'
import Pagination from '../components/ui/Pagination'
import { SkeletonRow } from '../components/ui/Skeleton'
import { useMessages, useUpdateMessage, useDeleteMessage } from '../hooks/useMessages'
import { MESSAGE_STATUS, MESSAGE_STATUS_MAP } from '../utils/constants'
import useAppStore from '../store/useAppStore'

export default function Messages() {
  const [filter, setFilter] = useState('')
  const page = useAppStore((s) => s.messagesPage)
  const setPage = useAppStore((s) => s.setMessagesPage)
  const limit = useAppStore((s) => s.messagesLimit)
  const setLimit = useAppStore((s) => s.setMessagesLimit)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const addToast = useAppStore((s) => s.addToast)
  const prevFilter = useRef(filter)

  useEffect(() => {
    if (prevFilter.current !== filter) {
      prevFilter.current = filter
      setPage(1)
    }
  }, [filter, setPage])

  const { data, isLoading } = useMessages(filter || undefined, { page, limit })
  const messages = data?.messages || []
  const total = data?.total || 0
  const updateMessage = useUpdateMessage()
  const deleteMessage = useDeleteMessage()

  const handleStatusChange = (msg, newStatus) => {
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
  }

  const handleDelete = (msg) => {
    deleteMessage.mutate(msg.id, {
      onSuccess: () => {
        addToast({ type: 'success', message: 'Mensaje eliminado' })
        setDeleteTarget(null)
      },
      onError: (err) => addToast({ type: 'error', message: `Error: ${err.message}` }),
    })
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonRow key={i} columns={5} />
        ))}
      </div>
    )
  }

  if (!messages || messages.length === 0) {
    return (
      <EmptyState
        icon={Mail}
        title="Sin mensajes"
        description="Crea mensajes desde la página de detalle de una empresa"
      />
    )
  }

  const isMutating = updateMessage.isPending || deleteMessage.isPending

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mensajes</h1>
          <p className="mt-1 text-sm text-slate-500">
            {total} mensaje{total !== 1 ? 's' : ''}
            {filter && ` · ${MESSAGE_STATUS_MAP[filter]?.label || filter}`}
          </p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-hidden"
        >
          <option value="">Todos</option>
          {MESSAGE_STATUS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="hidden grid-cols-12 gap-4 border-b border-slate-200 px-6 py-3 text-xs font-medium uppercase tracking-wider text-slate-500 md:grid">
          <div className="col-span-3">Asunto</div>
          <div className="col-span-2">Empresa</div>
          <div className="col-span-2">Contacto</div>
          <div className="col-span-1">Plantilla</div>
          <div className="col-span-2">Estado</div>
          <div className="col-span-1">Fecha</div>
          <div className="col-span-1 text-right">Acción</div>
        </div>

        {messages.map((m) => {
          const statusInfo = MESSAGE_STATUS_MAP[m.status] || MESSAGE_STATUS_MAP.draft
          return (
            <div
              key={m.id}
              className="grid grid-cols-1 gap-2 border-b border-slate-100 px-6 py-4 last:border-b-0 hover:bg-slate-50 md:grid-cols-12 md:items-center md:gap-4"
            >
              <div className="col-span-3">
                <Link
                  to={`/app/companies/${m.company_id}`}
                  className="text-sm font-medium text-slate-900 hover:text-primary-600 truncate block"
                >
                  {m.subject}
                </Link>
              </div>
              <div className="col-span-2 text-sm text-slate-600">
                <Link
                  to={`/app/companies/${m.company_id}`}
                  className="text-primary-600 hover:text-primary-700"
                >
                  {m.company_name || '—'}
                </Link>
              </div>
              <div className="col-span-2 text-sm text-slate-600">
                {m.contact_first_name || '—'}
              </div>
              <div className="col-span-1 text-sm text-slate-500">
                {m.template_name || '—'}
              </div>
              <div className="col-span-2">
                <select
                  value={m.status}
                  onChange={(e) => handleStatusChange(m, e.target.value)}
                  disabled={isMutating}
                  className={`rounded border px-2 py-1 text-xs font-medium focus:ring-2 focus:outline-hidden disabled:opacity-50 ${statusInfo.color} border-transparent`}
                >
                  {Object.values(MESSAGE_STATUS_MAP).map((s) => (
                    <option key={s.value} value={s.value} className="bg-white text-slate-900">
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-1 text-xs text-slate-400">
                {m.sent_at
                  ? new Date(m.sent_at).toLocaleDateString('es-ES')
                  : 'Borrador'}
              </div>
              <div className="col-span-1 flex justify-end">
                <button
                  onClick={() => setDeleteTarget(m)}
                  disabled={isMutating}
                  className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50 cursor-pointer"
                  title="Eliminar"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {!isLoading && (
        <Pagination
          page={page}
          total={total}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
          label="mensajes"
        />
      )}

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Eliminar mensaje"
        message={`¿Eliminar "${deleteTarget?.subject}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        danger
        isSubmitting={deleteMessage.isPending}
        onConfirm={() => {
          if (!deleteTarget) return
          handleDelete(deleteTarget)
        }}
      />
    </div>
  )
}

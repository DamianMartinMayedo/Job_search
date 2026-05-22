import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Eye, CheckCircle } from 'lucide-react'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import { SkeletonRow } from '../components/ui/Skeleton'
import { useMessages, useUpdateMessage } from '../hooks/useMessages'
import { MESSAGE_STATUS, MESSAGE_STATUS_MAP } from '../utils/constants'
import useAppStore from '../store/useAppStore'

export default function Messages() {
  const [filter, setFilter] = useState('')
  const addToast = useAppStore((s) => s.addToast)

  const { data: messages, isLoading } = useMessages(filter || undefined)
  const updateMessage = useUpdateMessage()

  const handleMarkSent = (msg) => {
    updateMessage.mutate(
      { id: msg.id, data: { status: 'sent' } },
      {
        onSuccess: () =>
          addToast({ type: 'success', message: 'Marcado como enviado' }),
      }
    )
  }

  const handleMarkReplied = (msg) => {
    updateMessage.mutate(
      { id: msg.id, data: { status: 'replied' } },
      {
        onSuccess: () =>
          addToast({ type: 'success', message: 'Marcado como respondido' }),
      }
    )
  }

  const handleMarkFollowUp = (msg) => {
    updateMessage.mutate(
      { id: msg.id, data: { follow_up_done: true, status: 'closed' } },
      {
        onSuccess: () =>
          addToast({ type: 'success', message: 'Seguimiento completado' }),
      }
    )
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

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mensajes</h1>
          <p className="mt-1 text-sm text-slate-500">
            {messages.length} mensaje{messages.length !== 1 ? 's' : ''}
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
          <div className="col-span-4">Asunto</div>
          <div className="col-span-2">Empresa</div>
          <div className="col-span-2">Contacto</div>
          <div className="col-span-2">Estado</div>
          <div className="col-span-2 text-right">Fecha</div>
        </div>

        {messages.map((m) => {
          const status = MESSAGE_STATUS_MAP[m.status] || MESSAGE_STATUS_MAP.draft
          return (
            <div
              key={m.id}
              className="grid grid-cols-1 gap-2 border-b border-slate-100 px-6 py-4 last:border-b-0 hover:bg-slate-50 md:grid-cols-12 md:items-center md:gap-4"
            >
              <div className="col-span-4">
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
              <div className="col-span-2">
                <Badge className={status.color}>{status.label}</Badge>
              </div>
              <div className="col-span-2 flex items-center justify-end gap-2">
                <span className="text-xs text-slate-400">
                  {m.sent_at
                    ? new Date(m.sent_at).toLocaleDateString('es-ES')
                    : 'Borrador'}
                </span>
                {m.status === 'draft' && (
                  <button
                    onClick={() => handleMarkSent(m)}
                    className="rounded p-1 text-slate-400 hover:bg-green-50 hover:text-green-600 cursor-pointer"
                    title="Marcar como enviado"
                  >
                    <CheckCircle size={16} />
                  </button>
                )}
                {m.status === 'sent' && (
                  <button
                    onClick={() => handleMarkReplied(m)}
                    className="rounded p-1 text-slate-400 hover:bg-amber-50 hover:text-amber-600 cursor-pointer"
                    title="Marcar como respondido"
                  >
                    <Eye size={16} />
                  </button>
                )}
                {m.status === 'follow_up' && !m.follow_up_done && (
                  <button
                    onClick={() => handleMarkFollowUp(m)}
                    className="text-xs text-orange-600 hover:text-orange-700 cursor-pointer"
                  >
                    Hecho
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

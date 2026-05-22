import { AlertTriangle } from 'lucide-react'
import { useMessages, useUpdateMessage } from '../../hooks/useMessages'
import useAppStore from '../../store/useAppStore'

export default function FollowUpAlert() {
  const { data: messages, isLoading } = useMessages('follow_up')
  const updateMessage = useUpdateMessage()
  const addToast = useAppStore((s) => s.addToast)

  if (isLoading || !messages || messages.length === 0) return null

  return (
    <div className="mb-6 rounded-xl border border-orange-200 bg-orange-50 p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-orange-100 p-1.5 text-orange-600">
          <AlertTriangle size={20} />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-orange-800">
            {messages.length} seguimiento{messages.length > 1 ? 's' : ''} pendiente{messages.length > 1 ? 's' : ''}
          </h3>
          <p className="mt-1 text-sm text-orange-700">
            Tienes mensajes que necesitan seguimiento hoy
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {messages.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-orange-200 bg-white px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {m.company_name}
                  </p>
                  <p className="text-xs text-slate-500">{m.subject}</p>
                </div>
                <button
                  onClick={() => {
                    updateMessage.mutate(
                      { id: m.id, data: { follow_up_done: true, status: 'closed' } },
                      {
                        onSuccess: () =>
                          addToast({
                            type: 'success',
                            message: 'Seguimiento marcado como hecho',
                          }),
                      }
                    )
                  }}
                  className="shrink-0 rounded-lg bg-orange-100 px-3 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-200 cursor-pointer"
                >
                  Hecho
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

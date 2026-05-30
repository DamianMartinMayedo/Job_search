import { Warning } from '@phosphor-icons/react'
import { useMessages, useUpdateMessage } from '../../hooks/useMessages'
import useAppStore from '../../store/useAppStore'

export default function FollowUpAlert() {
  const { data, isLoading } = useMessages('follow_up')
  const messages = data?.messages || []
  const updateMessage = useUpdateMessage()
  const addToast = useAppStore((s) => s.addToast)

  if (isLoading || messages.length === 0) return null

  return (
    <div className="mb-6 rounded-lg border border-[#F0E0A8] bg-[#FBF3DB] p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-[#F0E0A8] p-1.5 text-[#956400]">
          <Warning size={18} weight="bold" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-[#956400]">
            {messages.length} seguimiento{messages.length > 1 ? 's' : ''} pendiente{messages.length > 1 ? 's' : ''}
          </h3>
          <p className="mt-0.5 text-sm text-[#956400]/80">
            Tienes mensajes que necesitan seguimiento hoy
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {messages.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-[#F0E0A8] bg-white px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#111111]">
                    {m.company_name}
                  </p>
                  <p className="text-xs text-[#787774] truncate">{m.subject}</p>
                </div>
                <button
                  onClick={() => {
                    updateMessage.mutate(
                      { id: m.id, data: { follow_up_done: true, status: 'closed' } },
                      {
                        onSuccess: () =>
                          addToast({ type: 'success', message: 'Seguimiento marcado como hecho' }),
                        onError: (err) =>
                          addToast({ type: 'error', message: `Error: ${err.message}` }),
                      }
                    )
                  }}
                  className="shrink-0 rounded-lg border border-[#F0E0A8] bg-[#FBF3DB] px-3 py-1.5 text-xs font-medium text-[#956400] hover:bg-[#F0E0A8] cursor-pointer transition-colors"
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

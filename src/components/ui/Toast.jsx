import { useCallback, useEffect, useRef, useState } from 'react'
import { CheckCircle, XCircle, Warning, Info, X, CircleNotch } from '@phosphor-icons/react'
import useAppStore from '../../store/useAppStore'

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  warning: Warning,
  info: Info,
  loading: CircleNotch,
}

const colorMap = {
  success: 'border-[#C5DCC4] bg-[#EDF3EC] text-[#346538]',
  error: 'border-[#F9C9CB] bg-[#FDEBEC] text-[#9F2F2D]',
  warning: 'border-[#F0E0A8] bg-[#FBF3DB] text-[#956400]',
  info: 'border-[#BEE0F9] bg-[#E1F3FE] text-[#1F6C9F]',
  loading: 'border-[#D0D0D0] bg-white text-[#2F3437]',
}

// El spinner del loading toast lleva un color con presencia (azul info) para
// que el toast se perciba como "actividad en curso" y no se confunda con el
// fondo. El resto de iconos heredan el color del texto de su colorMap.
const iconColorMap = {
  loading: 'text-[#1F6C9F]',
}

export default function ToastContainer() {
  const toasts = useAppStore((s) => s.toasts)
  const removeToast = useAppStore((s) => s.removeToast)

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={() => removeToast(toast.id)}
        />
      ))}
    </div>
  )
}

function ToastItem({ toast, onDismiss }) {
  const Icon = iconMap[toast.type] || Info
  const isLoading = toast.type === 'loading'
  const [isExiting, setIsExiting] = useState(false)
  const mountedAt = useRef(Date.now())

  // Tiempo mínimo visible antes de poder salir: cubre la entrada (300ms) y deja
  // margen para que el ojo registre el toast aunque la operación sea instantánea.
  const MIN_VISIBLE_MS = 600

  const handleDismiss = useCallback(() => {
    setIsExiting(true)
    setTimeout(onDismiss, 200)
  }, [onDismiss])

  // Auto-cierre de los toasts no-loading a los 3s.
  useEffect(() => {
    if (isLoading) return
    const timer = setTimeout(handleDismiss, 3000)
    return () => clearTimeout(timer)
  }, [isLoading, handleDismiss])

  // El loading se cierra cuando el store lo marca `exiting` (dismissLoadingToast),
  // respetando el mínimo de visibilidad para que siempre se perciba.
  useEffect(() => {
    if (!toast.exiting) return
    const elapsed = Date.now() - mountedAt.current
    const wait = Math.max(0, MIN_VISIBLE_MS - elapsed)
    const timer = setTimeout(handleDismiss, wait)
    return () => clearTimeout(timer)
  }, [toast.exiting, handleDismiss])

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg ${colorMap[toast.type] || colorMap.info}`}
      style={{
        animation: isExiting
          ? 'toastOut 200ms var(--ease-out-expo) forwards'
          : 'toastIn 300ms var(--ease-out-expo)',
      }}
      role="alert"
    >
      <Icon
        size={16}
        weight="bold"
        className={`shrink-0 ${iconColorMap[toast.type] || ''} ${isLoading ? 'animate-spin' : ''}`}
      />
      <p className="text-sm font-medium">{toast.message}</p>
      {!isLoading && (
        <button
          onClick={handleDismiss}
          className="ml-2 cursor-pointer rounded p-0.5 opacity-60 transition-opacity duration-150 hover:opacity-100"
          aria-label="Cerrar"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}

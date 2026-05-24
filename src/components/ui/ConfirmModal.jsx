import { AlertTriangle, Trash2 } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'

export default function ConfirmModal({
  open,
  onClose,
  title,
  message,
  onConfirm,
  confirmLabel = 'Eliminar',
  danger = false,
  isSubmitting = false,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`rounded-lg p-2 ${danger ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}
          >
            {danger ? <Trash2 size={20} /> : <AlertTriangle size={20} />}
          </div>
          <p className="text-sm text-slate-600">{message}</p>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Procesando...' : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

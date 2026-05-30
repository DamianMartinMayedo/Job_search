import { Warning, Trash } from '@phosphor-icons/react'
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
            className={`rounded-lg p-2 ${danger ? 'bg-[#FDEBEC] text-[#9F2F2D]' : 'bg-[#FBF3DB] text-[#956400]'}`}
          >
            {danger ? <Trash size={18} weight="bold" /> : <Warning size={18} weight="bold" />}
          </div>
          <p className="text-sm text-[#2F3437]">{message}</p>
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

import { useState, useEffect } from 'react'
import Modal from './Modal'
import Button from './Button'
import Input from './Input'

export default function PromptModal({
  open,
  onClose,
  title,
  label,
  placeholder,
  initialValue = '',
  onSubmit,
  isSubmitting = false,
  type = 'text',
  min,
  max,
}) {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    if (open) setValue(initialValue)
  }, [open, initialValue])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!value.trim()) return
    onSubmit(value.trim())
  }

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label={label}
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          type={type}
          min={min}
          max={max}
          autoFocus
        />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting || !value.trim()}>
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

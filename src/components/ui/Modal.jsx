import { useEffect, useRef, useState } from 'react'
import { X } from '@phosphor-icons/react'

export default function Modal({ open, onClose, title, children, size = 'md' }) {
  const overlayRef = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (open) {
      setIsVisible(true)
    } else {
      const timer = setTimeout(() => setIsVisible(false), 200)
      return () => clearTimeout(timer)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!isVisible) return null

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <div
      ref={overlayRef}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 transition-opacity duration-200 ease-out ${open ? 'opacity-100' : 'opacity-0'}`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`w-full ${sizeClasses[size]} rounded-lg border border-[#EAEAEA] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-[opacity,transform] duration-200 ease-[var(--ease-out-expo)] ${open ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
      >
        <div className="flex items-center justify-between border-b border-[#EAEAEA] px-6 py-4">
          <h2 className="text-base font-semibold text-[#111111] tracking-[-0.01em]">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[#ABABAB] transition-colors duration-150 hover:bg-[#F7F6F3] hover:text-[#111111] cursor-pointer active:scale-95"
            aria-label="Cerrar"
          >
            <X size={18} weight="bold" />
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  )
}

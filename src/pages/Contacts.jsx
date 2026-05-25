import { useState } from 'react'
import { Users, Copy, ExternalLink, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import Pagination from '../components/ui/Pagination'
import ConfirmModal from '../components/ui/ConfirmModal'
import { SkeletonRow } from '../components/ui/Skeleton'
import { useAllContacts, useBatchContacts } from '../hooks/useContacts'
import { ROLE_TYPES_MAP } from '../utils/constants'
import useAppStore from '../store/useAppStore'

export default function Contacts() {
  const page = useAppStore((s) => s.contactsPage)
  const setPage = useAppStore((s) => s.setContactsPage)
  const limit = useAppStore((s) => s.contactsLimit)
  const setLimit = useAppStore((s) => s.setContactsLimit)
  const { data, isLoading } = useAllContacts({ page, limit })
  const contacts = data?.contacts || []
  const total = data?.total || 0
  const addToast = useAppStore((s) => s.addToast)
  const batchContacts = useBatchContacts()

  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkDelete, setBulkDelete] = useState(false)

  const allSelected = contacts.length > 0 && selectedIds.size === contacts.length

  const toggleSelectAll = () => {
    allSelected ? setSelectedIds(new Set()) : setSelectedIds(new Set(contacts.map((c) => c.id)))
  }

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const clearSelection = () => setSelectedIds(new Set())

  const handleBulkDelete = () => {
    batchContacts.mutate(
      { ids: Array.from(selectedIds) },
      {
        onSuccess: () => {
          addToast({ type: 'success', message: `${selectedIds.size} contactos eliminados` })
          clearSelection()
          setBulkDelete(false)
        },
        onError: (err) => addToast({ type: 'error', message: `Error: ${err.message}` }),
      }
    )
  }

  const handleCopyEmail = (email) => {
    navigator.clipboard.writeText(email).catch(() => {
      addToast({ type: 'error', message: 'Error al copiar email' })
    })
    addToast({ type: 'success', message: 'Email copiado' })
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

  if (!contacts || contacts.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Sin contactos"
        description="Añade contactos desde la página de detalle de cada empresa"
      />
    )
  }

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Contactos</h1>
        <p className="mt-1 text-sm text-slate-500">
          {total} contactos
        </p>
      </div>

      {selectedIds.size > 0 && (
        <div className="mt-4 flex items-center justify-between rounded-lg bg-primary-600 px-4 py-3 text-white">
          <span className="text-sm font-medium">
            {selectedIds.size} contacto{selectedIds.size !== 1 ? 's' : ''} seleccionado{selectedIds.size !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBulkDelete(true)}
              className="rounded-lg bg-white/15 px-3 py-1.5 text-sm hover:bg-white/25 cursor-pointer"
              disabled={batchContacts.isPending}
            >
              <Trash2 size={14} className="inline mr-1" />
              Eliminar
            </button>
            <button
              onClick={clearSelection}
              className="ml-2 text-sm text-white/70 hover:text-white cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="hidden md:flex items-center border-b border-slate-200">
          <div className="flex shrink-0 items-center justify-center px-3 py-3">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleSelectAll}
              className="size-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
            />
          </div>
          <div className="flex-1 grid grid-cols-11 gap-4 px-6 py-3 text-xs font-medium uppercase tracking-wider text-slate-500">
            <div className="col-span-3">Nombre</div>
            <div className="col-span-2">Empresa</div>
            <div className="col-span-2">Rol</div>
            <div className="col-span-2">Email</div>
            <div className="col-span-2 text-right">Acciones</div>
          </div>
        </div>

        {contacts.map((c) => (
          <div
            key={c.id}
            className="flex items-center border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
          >
            <div className="flex shrink-0 items-center justify-center px-3 py-4">
              <input
                type="checkbox"
                checked={selectedIds.has(c.id)}
                onChange={() => toggleSelect(c.id)}
                className="size-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
              />
            </div>
            <div className="flex-1 grid grid-cols-1 gap-2 px-6 py-4 md:grid-cols-11 md:items-center md:gap-4">
              <div className="col-span-3">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-900">
                    {c.first_name} {c.last_name}
                  </p>
                  {c.is_primary && (
                    <Badge className="bg-primary-100 text-primary-700 border-primary-200 text-[10px]">
                      Principal
                    </Badge>
                  )}
                </div>
              </div>
              <div className="col-span-2">
                <Link
                  to={`/app/companies/${c.company_id}`}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  {c.company_name}
                </Link>
              </div>
              <div className="col-span-2 text-sm text-slate-600">
                {ROLE_TYPES_MAP[c.role_type] || c.role || '—'}
              </div>
              <div className="col-span-2 text-sm text-slate-600">
                {c.email || '—'}
              </div>
              <div className="col-span-2 flex justify-end gap-2">
                {c.email && (
                  <button
                    onClick={() => handleCopyEmail(c.email)}
                    className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                    title="Copiar email"
                  >
                    <Copy size={14} />
                  </button>
                )}
                {c.linkedin_url && (
                  <a
                    href={c.linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                    title="LinkedIn"
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {!isLoading && (
        <Pagination
          page={page}
          total={total}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
          label="contactos"
        />
      )}

      <ConfirmModal
        open={bulkDelete}
        onClose={() => setBulkDelete(false)}
        title="Eliminar contactos"
        message={`¿Eliminar ${selectedIds.size} contacto${selectedIds.size !== 1 ? 's' : ''}? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        danger
        isSubmitting={batchContacts.isPending}
        onConfirm={handleBulkDelete}
      />
    </div>
  )
}

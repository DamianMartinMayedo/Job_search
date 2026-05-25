import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, ExternalLink, Archive, ArrowUp, ArrowDown } from 'lucide-react'
import Badge from '../ui/Badge'
import EmptyState from '../ui/EmptyState'
import { SkeletonRow } from '../ui/Skeleton'
import ConfirmModal from '../ui/ConfirmModal'
import { COMPANY_STATUS, COMPANY_STATUS_MAP } from '../../utils/constants'
import { useUpdateCompany, useBatchCompanies } from '../../hooks/useCompanies'
import useAppStore from '../../store/useAppStore'

function SortHeader({ label, field, sort, onSort }) {
  const isActive = sort.field === field
  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-slate-500 hover:text-slate-700 cursor-pointer"
    >
      {label}
      {isActive ? (
        sort.dir === 'ASC' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
      ) : (
        <ArrowDown size={12} className="opacity-20" />
      )}
    </button>
  )
}

export default function CompanyTable({ companies, isLoading, sort, onSort }) {
  const updateCompany = useUpdateCompany()
  const batchCompanies = useBatchCompanies()
  const addToast = useAppStore((s) => s.addToast)
  const [archiveTarget, setArchiveTarget] = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkAction, setBulkAction] = useState(null)

  const allSelected = companies && companies.length > 0 && selectedIds.size === companies.length

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(companies.map((c) => c.id)))
    }
  }

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const clearSelection = () => setSelectedIds(new Set())

  const handleBulkAction = () => {
    if (!bulkAction || selectedIds.size === 0) return
    const ids = Array.from(selectedIds)
    const action = bulkAction

    batchCompanies.mutate(
      { ids, action },
      {
        onSuccess: () => {
          addToast({
            type: 'success',
            message: `${ids.length} empresas ${action === 'delete' ? 'eliminadas' : 'archivadas'}`,
          })
          clearSelection()
          setBulkAction(null)
        },
        onError: (err) => {
          addToast({ type: 'error', message: `Error: ${err.message}` })
          setBulkAction(null)
        },
      }
    )
  }

  const handleBulkStatus = (newStatus) => {
    if (selectedIds.size === 0) return
    const ids = Array.from(selectedIds)
    batchCompanies.mutate(
      { ids, action: 'status', status: newStatus },
      {
        onSuccess: () => {
          addToast({ type: 'success', message: `${ids.length} empresas actualizadas a "${COMPANY_STATUS_MAP[newStatus]?.label || newStatus}"` })
          clearSelection()
        },
        onError: (err) => addToast({ type: 'error', message: `Error: ${err.message}` }),
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

  if (!companies || companies.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="No hay empresas"
        description="Busca empresas con Google Places o añade una manualmente"
      />
    )
  }

  return (
    <>
    {selectedIds.size > 0 && (
      <div className="mb-4 flex items-center justify-between rounded-lg bg-primary-600 px-4 py-3 text-white">
        <span className="text-sm font-medium">
          {selectedIds.size} empresa{selectedIds.size !== 1 ? 's' : ''} seleccionada{selectedIds.size !== 1 ? 's' : ''}
        </span>
        <div className="flex items-center gap-2">
          <select
            onChange={(e) => {
              const val = e.target.value
              if (!val) return
              e.target.value = ''
              handleBulkStatus(val)
            }}
            className="rounded-lg border border-primary-400 bg-primary-700 px-3 py-1.5 text-sm text-white focus:ring-2 focus:ring-white/20 focus:outline-hidden cursor-pointer"
          >
            <option value="">Cambiar estado...</option>
            {COMPANY_STATUS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => setBulkAction('archive')}
            className="rounded-lg bg-white/15 px-3 py-1.5 text-sm hover:bg-white/25 cursor-pointer"
            disabled={batchCompanies.isPending}
          >
            Archivar
          </button>
          <button
            onClick={() => setBulkAction('delete')}
            className="rounded-lg bg-white/15 px-3 py-1.5 text-sm hover:bg-white/25 cursor-pointer"
            disabled={batchCompanies.isPending}
          >
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

    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="hidden md:flex items-center border-b border-slate-200">
        <div className="flex shrink-0 items-center justify-center px-3 py-3">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleSelectAll}
            className="size-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
          />
        </div>
        <div className="flex-1 grid grid-cols-11 gap-4 px-6 py-3">
          <div className="col-span-2">
            <SortHeader label="Empresa" field="name" sort={sort} onSort={onSort} />
          </div>
          <div className="col-span-2">Email</div>
          <div className="col-span-2">
            <SortHeader label="Sector" field="sector" sort={sort} onSort={onSort} />
          </div>
          <div className="col-span-2">
            <SortHeader label="Ciudad" field="city" sort={sort} onSort={onSort} />
          </div>
          <div className="col-span-1">
            <SortHeader label="Estado" field="status" sort={sort} onSort={onSort} />
          </div>
          <div className="col-span-2 text-right">Acciones</div>
        </div>
      </div>

      {companies.map((company) => {
        const status = COMPANY_STATUS_MAP[company.status] || COMPANY_STATUS_MAP.new
        return (
          <div
            key={company.id}
            className="flex items-center border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
          >
            <div className="flex shrink-0 items-center justify-center px-3 py-4">
              <input
                type="checkbox"
                checked={selectedIds.has(company.id)}
                onChange={() => toggleSelect(company.id)}
                className="size-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
              />
            </div>
            <div className="flex-1 grid grid-cols-1 gap-2 px-6 py-4 md:grid-cols-11 md:items-center md:gap-4">
              <div className="col-span-2">
                <Link
                  to={`/app/companies/${company.id}`}
                  className="text-sm font-medium text-slate-900 hover:text-primary-600"
                >
                  {company.name}
                </Link>
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-primary-500"
                  >
                    <ExternalLink size={12} />
                    {company.domain || company.website}
                  </a>
                )}
              </div>
              <div className="col-span-2 text-sm text-slate-600">
                {company.email || company.primary_email || '—'}
              </div>
              <div className="col-span-2 text-sm text-slate-600">
                {company.sector || '—'}
              </div>
              <div className="col-span-2 text-sm text-slate-600">
                {company.city || '—'}
              </div>
              <div className="col-span-1">
                <Badge className={status.color}>{status.label}</Badge>
              </div>
              <div className="col-span-2 flex justify-end gap-2">
                <Link
                  to={`/app/companies/${company.id}`}
                  className="text-xs text-slate-400 hover:text-primary-600"
                >
                  Ver
                </Link>
                <button
                  onClick={() => setArchiveTarget(company)}
                  className="rounded p-1 text-slate-400 hover:bg-amber-50 hover:text-amber-600 cursor-pointer"
                  title="Archivar"
                >
                  <Archive size={14} />
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>

    <ConfirmModal
      open={!!bulkAction && (bulkAction === 'archive' || bulkAction === 'delete')}
      onClose={() => setBulkAction(null)}
      title={bulkAction === 'delete' ? 'Eliminar empresas' : 'Archivar empresas'}
      message={
        bulkAction === 'delete'
          ? `¿Eliminar ${selectedIds.size} empresa${selectedIds.size !== 1 ? 's' : ''}? Esta acción no se puede deshacer.`
          : `¿Archivar ${selectedIds.size} empresa${selectedIds.size !== 1 ? 's' : ''}? No aparecerán en la lista principal pero se conservan para evitar duplicados.`
      }
      confirmLabel={bulkAction === 'delete' ? 'Eliminar' : 'Archivar'}
      danger={bulkAction === 'delete'}
      isSubmitting={batchCompanies.isPending}
      onConfirm={handleBulkAction}
    />

    <ConfirmModal
      open={!!archiveTarget}
      onClose={() => setArchiveTarget(null)}
      title="Archivar empresa"
      message={`¿Archivar ${archiveTarget?.name}? No aparecerá en la lista principal pero se conserva para evitar duplicados en futuras búsquedas.`}
      confirmLabel="Archivar"
      isSubmitting={updateCompany.isPending}
      onConfirm={() => {
        if (!archiveTarget) return
        updateCompany.mutate(
          { id: archiveTarget.id, data: { status: 'archived' } },
          {
            onSuccess: () => {
              addToast({ type: 'success', message: `${archiveTarget.name} archivada` })
              setArchiveTarget(null)
            },
            onError: (err) => {
              addToast({ type: 'error', message: `Error al archivar: ${err.message}` })
              setArchiveTarget(null)
            },
          }
        )
      }}
    />
    </>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Buildings, ArrowSquareOut, Archive, ArrowUp, ArrowDown } from '@phosphor-icons/react'
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
      className="flex items-center gap-1 text-xs font-medium uppercase tracking-[0.04em] text-[#787774] hover:text-[#111111] cursor-pointer transition-colors"
    >
      {label}
      {isActive ? (
        sort.dir === 'ASC' ? <ArrowUp size={12} weight="bold" /> : <ArrowDown size={12} weight="bold" />
      ) : (
        <ArrowDown size={12} weight="bold" className="opacity-20" />
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

  const handleBulkInterest = (level) => {
    if (selectedIds.size === 0) return
    const ids = Array.from(selectedIds)
    batchCompanies.mutate(
      { ids, action: 'interest', interest_level: level },
      {
        onSuccess: () => {
          addToast({ type: 'success', message: `${ids.length} empresas actualizadas a interés ${level}/5` })
          clearSelection()
        },
        onError: (err) => addToast({ type: 'error', message: `Error: ${err.message}` }),
      }
    )
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-[#EAEAEA] bg-white">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonRow key={i} columns={5} />
        ))}
      </div>
    )
  }

  if (!companies || companies.length === 0) {
    return (
      <EmptyState
        icon={Buildings}
        title="No hay empresas"
        description="Busca empresas con Google Places o añade una manualmente"
      />
    )
  }

  return (
    <>
    {selectedIds.size > 0 && (
      <div className="mb-4 flex items-center justify-between rounded-lg bg-[#111111] px-4 py-3 text-white">
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
            className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white focus:ring-2 focus:ring-white/20 focus:outline-hidden cursor-pointer"
          >
            <option value="">Cambiar estado...</option>
            {COMPANY_STATUS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            onChange={(e) => {
              const val = +e.target.value
              if (!val) { e.target.value = ''; return }
              e.target.value = ''
              handleBulkInterest(val)
            }}
            className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white focus:ring-2 focus:ring-white/20 focus:outline-hidden cursor-pointer"
          >
            <option value="">Interés...</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n} className="text-slate-900">
                {n}
              </option>
            ))}
          </select>
          <button
            onClick={() => setBulkAction('archive')}
            className="rounded-lg border border-white/20 px-3 py-1.5 text-sm hover:bg-white/15 cursor-pointer transition-colors"
            disabled={batchCompanies.isPending}
          >
            Archivar
          </button>
          <button
            onClick={() => setBulkAction('delete')}
            className="rounded-lg border border-white/20 px-3 py-1.5 text-sm hover:bg-white/15 cursor-pointer transition-colors"
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

    <div className="overflow-hidden rounded-lg border border-[#EAEAEA] bg-white">
      <div className="hidden md:flex items-center border-b border-[#EAEAEA]">
        <div className="flex shrink-0 items-center justify-center px-3 py-3">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleSelectAll}
            className="size-4 rounded border-[#EAEAEA] cursor-pointer"
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
          <div className="col-span-1">
            <SortHeader label="Ciudad" field="city" sort={sort} onSort={onSort} />
          </div>
          <div className="col-span-1">
            <SortHeader label="Interés" field="interest_level" sort={sort} onSort={onSort} />
          </div>
          <div className="col-span-1">
            <SortHeader label="Estado" field="status" sort={sort} onSort={onSort} />
          </div>
          <div className="col-span-2 text-right">Acciones</div>
        </div>
      </div>

      {companies.map((company, index) => {
        const status = COMPANY_STATUS_MAP[company.status] || COMPANY_STATUS_MAP.new
        return (
          <div
            key={company.id}
            className="flex items-center border-b border-[#EAEAEA] last:border-b-0 hover:bg-[#F7F6F3] transition-colors duration-150"
            style={{
              animation: 'fadeInUp 300ms ease-out forwards',
              animationDelay: `${index * 50}ms`,
              opacity: 0,
            }}
          >
            <div className="flex shrink-0 items-center justify-center px-3 py-4">
              <input
                type="checkbox"
                checked={selectedIds.has(company.id)}
                onChange={() => toggleSelect(company.id)}
                className="size-4 rounded border-[#EAEAEA] cursor-pointer"
              />
            </div>
            <div className="flex-1 grid grid-cols-1 gap-2 px-6 py-4 md:grid-cols-11 md:items-center md:gap-4">
              <div className="col-span-2">
                <Link
                  to={`/app/companies/${company.id}`}
                  className="text-sm font-medium text-[#111111] hover:underline"
                >
                  {company.name}
                </Link>
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-[#ABABAB] hover:text-[#111111] transition-colors"
                  >
                    <ArrowSquareOut size={12} weight="bold" />
                    {company.domain || company.website}
                  </a>
                )}
              </div>
              <div className="col-span-2 text-sm text-[#2F3437]">
                {company.email || company.primary_email || '—'}
              </div>
              <div className="col-span-2 text-sm text-[#2F3437]">
                {company.sector || '—'}
              </div>
              <div className="col-span-1 text-sm text-[#2F3437]">
                {company.city || '—'}
              </div>
              <div className="col-span-1 text-sm text-[#2F3437] text-center">
                {company.interest_level || '—'}
              </div>
              <div className="col-span-1">
                <Badge className={status.color}>{status.label}</Badge>
              </div>
              <div className="col-span-2 flex justify-end gap-2">
                <Link
                  to={`/app/companies/${company.id}`}
                  className="text-xs text-[#787774] hover:text-[#111111] hover:underline transition-colors"
                >
                  Ver
                </Link>
                <button
                  onClick={() => setArchiveTarget(company)}
                  className="rounded p-1 text-[#ABABAB] hover:bg-[#FBF3DB] hover:text-[#956400] cursor-pointer transition-colors"
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

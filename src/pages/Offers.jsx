import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, ArrowSquareOut, MapPin, WifiHigh, Trash, PaperPlaneRight } from '@phosphor-icons/react'
import EmptyState from '../components/ui/EmptyState'
import ConfirmModal from '../components/ui/ConfirmModal'
import Pagination from '../components/ui/Pagination'
import { SkeletonRow } from '../components/ui/Skeleton'
import ApplyToOfferDialog from '../components/offers/ApplyToOfferDialog'
import {
  useJobOffers,
  useUpdateJobOffer,
  useDeleteJobOffer,
  useJobSources,
  useBatchJobOffers,
} from '../hooks/useJobOffers'
import { OFFER_STATUS, OFFER_STATUS_MAP } from '../utils/constants'
import useAppStore from '../store/useAppStore'

export default function Offers() {
  const page = useAppStore((s) => s.offersPage)
  const setPage = useAppStore((s) => s.setOffersPage)
  const limit = useAppStore((s) => s.offersLimit)
  const setLimit = useAppStore((s) => s.setOffersLimit)
  const filters = useAppStore((s) => s.offersFilters)
  const setFilter = useAppStore((s) => s.setOffersFilter)
  const addToast = useAppStore((s) => s.addToast)
  const dismissLoadingToast = useAppStore((s) => s.dismissLoadingToast)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkDelete, setBulkDelete] = useState(false)
  // Oferta sobre la que se ha pulsado "Aplicar". El diálogo decide si redirige
  // directo al composer (empresa matcheada) o muestra el form de crear empresa.
  const [applyTarget, setApplyTarget] = useState(null)

  const queryFilters = { ...filters, page, limit }
  const { data, isLoading } = useJobOffers(queryFilters)
  const { data: sources } = useJobSources()
  const offers = data?.offers || []
  const total = data?.total || 0
  const updateOffer = useUpdateJobOffer()
  const deleteOffer = useDeleteJobOffer()
  const batchOffers = useBatchJobOffers()

  const allSelected = offers.length > 0 && selectedIds.size === offers.length

  const toggleSelectAll = () => {
    allSelected ? setSelectedIds(new Set()) : setSelectedIds(new Set(offers.map((o) => o.id)))
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
    const n = selectedIds.size
    addToast({ type: 'loading', message: `Eliminando ${n} ofertas...` })
    batchOffers.mutate(
      { ids: Array.from(selectedIds), action: 'delete' },
      {
        onSuccess: () => {
          dismissLoadingToast()
          addToast({ type: 'success', message: `${n} ofertas eliminadas` })
          clearSelection()
          setBulkDelete(false)
        },
        onError: (err) => {
          dismissLoadingToast()
          addToast({ type: 'error', message: `Error: ${err.message}` })
        },
      }
    )
  }

  const handleBulkStatus = (newStatus) => {
    if (selectedIds.size === 0) return
    const n = selectedIds.size
    addToast({ type: 'loading', message: `Actualizando ${n} ofertas...` })
    batchOffers.mutate(
      { ids: Array.from(selectedIds), action: 'status', status: newStatus },
      {
        onSuccess: () => {
          dismissLoadingToast()
          addToast({ type: 'success', message: `${n} ofertas actualizadas a "${OFFER_STATUS_MAP[newStatus]?.label}"` })
          clearSelection()
        },
        onError: (err) => {
          dismissLoadingToast()
          addToast({ type: 'error', message: `Error: ${err.message}` })
        },
      }
    )
  }

  const handleStatusChange = (offer, newStatus) => {
    addToast({ type: 'loading', message: 'Cambiando estado...' })
    updateOffer.mutate(
      { id: offer.id, data: { status: newStatus } },
      {
        onSuccess: () => {
          dismissLoadingToast()
          addToast({ type: 'success', message: `Oferta marcada como "${OFFER_STATUS_MAP[newStatus]?.label}"` })
        },
        onError: (err) => {
          dismissLoadingToast()
          addToast({ type: 'error', message: `Error: ${err.message}` })
        },
      }
    )
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-serif)] text-3xl font-semibold tracking-tight text-[#111111]">Ofertas</h1>
          <p className="mt-1 text-sm text-[#787774]">
            {total} oferta{total !== 1 ? 's' : ''}
            {filters.status && ` · ${OFFER_STATUS_MAP[filters.status]?.label || filters.status}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="search"
            placeholder="Buscar título o empresa..."
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
            className="rounded-lg border border-[#EAEAEA] bg-white px-3 py-2 text-sm text-[#111111] focus:border-[#111111] focus:ring-2 focus:ring-black/5 focus:outline-hidden transition-colors"
          />
          <select
            value={filters.source_id}
            onChange={(e) => setFilter('source_id', e.target.value)}
            className="rounded-lg border border-[#EAEAEA] bg-white px-3 py-2 text-sm text-[#111111] focus:border-[#111111] focus:ring-2 focus:ring-black/5 focus:outline-hidden transition-colors"
          >
            <option value="">Todas las fuentes</option>
            {sources?.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilter('status', e.target.value)}
            className="rounded-lg border border-[#EAEAEA] bg-white px-3 py-2 text-sm text-[#111111] focus:border-[#111111] focus:ring-2 focus:ring-black/5 focus:outline-hidden transition-colors"
          >
            <option value="">Todos los estados</option>
            {OFFER_STATUS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="mt-4 flex items-center justify-between rounded-lg bg-[#111111] px-4 py-3 text-white">
          <span className="text-sm font-medium">
            {selectedIds.size} oferta{selectedIds.size !== 1 ? 's' : ''} seleccionada{selectedIds.size !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            <select
              onChange={(e) => {
                const v = e.target.value
                if (!v) return
                e.target.value = ''
                handleBulkStatus(v)
              }}
              className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white focus:ring-2 focus:ring-white/20 focus:outline-hidden cursor-pointer"
            >
              <option value="">Cambiar estado...</option>
              {OFFER_STATUS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <button
              onClick={() => setBulkDelete(true)}
              className="rounded-lg border border-white/20 px-3 py-1.5 text-sm hover:bg-white/15 cursor-pointer transition-colors"
              disabled={batchOffers.isPending}
            >
              <Trash size={14} weight="bold" className="inline mr-1" />
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

      {isLoading ? (
        <div className="mt-4 rounded-lg border border-[#EAEAEA] bg-white">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRow key={i} columns={4} />
          ))}
        </div>
      ) : offers.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="Sin ofertas"
          description="Configura una fuente RSS en Ajustes y ejecuta el agregador para empezar a recibir ofertas."
        />
      ) : (
        <div className="mt-4 overflow-hidden rounded-lg border border-[#EAEAEA] bg-white">
          <div className="hidden md:flex items-center border-b border-[#EAEAEA]">
            <div className="flex shrink-0 items-center justify-center px-3 py-3">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                className="size-4 rounded border-[#EAEAEA] cursor-pointer"
              />
            </div>
            <div className="flex-1 py-3 pr-6 text-xs font-medium uppercase tracking-wider text-slate-500">
              Seleccionar todo
            </div>
          </div>
          {offers.map((o) => {
            const statusInfo = OFFER_STATUS_MAP[o.status] || OFFER_STATUS_MAP.new
            return (
              <div
                key={o.id}
                className="flex items-start border-b border-[#EAEAEA] last:border-b-0 hover:bg-[#F7F6F3]"
              >
                <div className="flex shrink-0 items-center justify-center px-3 py-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(o.id)}
                    onChange={() => toggleSelect(o.id)}
                    className="size-4 rounded border-[#EAEAEA] cursor-pointer"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-3 py-4 pr-6 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                      <Link
                        to={`/app/offers/${o.id}`}
                        className="text-sm font-semibold text-[#111111] hover:underline"
                      >
                        {o.title}
                      </Link>
                      <a
                        href={o.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-[#ABABAB] hover:text-[#111111] transition-colors"
                        title="Abrir en el portal"
                      >
                        <ArrowSquareOut size={12} weight="bold" />
                      </a>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      {o.company_id ? (
                        <Link to={`/app/companies/${o.company_id}`} className="font-medium text-[#111111] hover:underline">
                          {o.company_known_name || o.company_name}
                        </Link>
                      ) : (
                        o.company_name && <span className="font-medium text-[#2F3437]">{o.company_name}</span>
                      )}
                      {o.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} />
                          {o.location}
                        </span>
                      )}
                      {o.remote && (
                        <span className="flex items-center gap-1 text-[#346538]">
                          <WifiHigh size={12} weight="bold" />
                          Remoto
                        </span>
                      )}
                      {o.source_name && <span className="text-slate-400">· {o.source_name}</span>}
                      {o.posted_at && (
                        <span className="text-slate-400">
                          · {new Date(o.posted_at).toLocaleDateString('es-ES')}
                        </span>
                      )}
                    </div>
                    {o.description && (
                      <p className="mt-2 text-xs text-slate-500">
                        {o.description.split(/\s+/).slice(0, 20).join(' ')}{o.description.split(/\s+/).length > 20 ? '...' : ''}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => setApplyTarget(o)}
                      className="flex items-center gap-1 rounded-lg bg-[#111111] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#333333] cursor-pointer transition-colors"
                      title="Crear borrador con plantilla y placeholders rellenos"
                    >
                      <PaperPlaneRight size={12} weight="bold" />
                      Aplicar
                    </button>
                    <select
                      value={o.status}
                      onChange={(e) => handleStatusChange(o, e.target.value)}
                      disabled={updateOffer.isPending || batchOffers.isPending}
                      className={`rounded border px-2 py-1 text-xs font-medium focus:ring-2 focus:outline-hidden disabled:opacity-50 ${statusInfo.color} border-transparent`}
                    >
                      {OFFER_STATUS.map((s) => (
                        <option key={s.value} value={s.value} className="bg-white text-slate-900">
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => setDeleteTarget(o)}
                      className="rounded p-1.5 text-[#ABABAB] hover:bg-[#FDEBEC] hover:text-[#9F2F2D] cursor-pointer transition-colors"
                      title="Eliminar"
                    >
                      <Trash size={14} weight="bold" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!isLoading && offers.length > 0 && (
        <Pagination
          page={page}
          total={total}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
          label="ofertas"
        />
      )}

      <ConfirmModal
        open={bulkDelete}
        onClose={() => setBulkDelete(false)}
        title="Eliminar ofertas"
        message={`¿Eliminar ${selectedIds.size} oferta${selectedIds.size !== 1 ? 's' : ''}? La próxima ejecución del agregador podría volver a importarlas si siguen activas en la fuente.`}
        confirmLabel="Eliminar"
        danger
        isSubmitting={batchOffers.isPending}
        onConfirm={handleBulkDelete}
      />

      <ApplyToOfferDialog
        open={!!applyTarget}
        offer={applyTarget}
        onClose={() => setApplyTarget(null)}
      />

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Eliminar oferta"
        message={`¿Eliminar "${deleteTarget?.title}"? La próxima ejecución del agregador podría volver a importarla si sigue activa en la fuente.`}
        confirmLabel="Eliminar"
        danger
        isSubmitting={deleteOffer.isPending}
        onConfirm={() => {
          if (!deleteTarget) return
          addToast({ type: 'loading', message: 'Eliminando oferta...' })
          deleteOffer.mutate(deleteTarget.id, {
            onSuccess: () => {
              dismissLoadingToast()
              addToast({ type: 'success', message: 'Oferta eliminada' })
              setDeleteTarget(null)
            },
            onError: (err) => {
              dismissLoadingToast()
              addToast({ type: 'error', message: `Error: ${err.message}` })
            },
          })
        }}
      />
    </div>
  )
}

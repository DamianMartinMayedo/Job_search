import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, ExternalLink, MapPin, Wifi, Trash2 } from 'lucide-react'
import EmptyState from '../components/ui/EmptyState'
import ConfirmModal from '../components/ui/ConfirmModal'
import Pagination from '../components/ui/Pagination'
import { SkeletonRow } from '../components/ui/Skeleton'
import {
  useJobOffers,
  useUpdateJobOffer,
  useDeleteJobOffer,
  useJobSources,
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
  const [deleteTarget, setDeleteTarget] = useState(null)

  const queryFilters = { ...filters, page, limit }
  const { data, isLoading } = useJobOffers(queryFilters)
  const { data: sources } = useJobSources()
  const offers = data?.offers || []
  const total = data?.total || 0

  const updateOffer = useUpdateJobOffer()
  const deleteOffer = useDeleteJobOffer()

  const handleStatusChange = (offer, newStatus) => {
    updateOffer.mutate(
      { id: offer.id, data: { status: newStatus } },
      {
        onSuccess: () =>
          addToast({ type: 'success', message: `Oferta marcada como "${OFFER_STATUS_MAP[newStatus]?.label}"` }),
        onError: (err) =>
          addToast({ type: 'error', message: `Error: ${err.message}` }),
      }
    )
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ofertas</h1>
          <p className="mt-1 text-sm text-slate-500">
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
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-hidden"
          />
          <select
            value={filters.source_id}
            onChange={(e) => setFilter('source_id', e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-hidden"
          >
            <option value="">Todas las fuentes</option>
            {sources?.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilter('status', e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-hidden"
          >
            <option value="">Todos los estados</option>
            {OFFER_STATUS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white">
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
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {offers.map((o) => {
            const statusInfo = OFFER_STATUS_MAP[o.status] || OFFER_STATUS_MAP.new
            return (
              <div
                key={o.id}
                className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 last:border-b-0 hover:bg-slate-50 md:flex-row md:items-start md:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-2">
                    <a
                      href={o.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-slate-900 hover:text-primary-600"
                    >
                      {o.title}
                      <ExternalLink size={12} className="ml-1 inline opacity-50" />
                    </a>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    {o.company_id ? (
                      <Link to={`/app/companies/${o.company_id}`} className="font-medium text-primary-600 hover:text-primary-700">
                        {o.company_known_name || o.company_name}
                      </Link>
                    ) : (
                      o.company_name && <span className="font-medium text-slate-600">{o.company_name}</span>
                    )}
                    {o.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {o.location}
                      </span>
                    )}
                    {o.remote && (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <Wifi size={12} />
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
                    <p className="mt-2 line-clamp-2 text-xs text-slate-500">{o.description}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <select
                    value={o.status}
                    onChange={(e) => handleStatusChange(o, e.target.value)}
                    disabled={updateOffer.isPending}
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
                    className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 cursor-pointer"
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
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
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Eliminar oferta"
        message={`¿Eliminar "${deleteTarget?.title}"? La próxima ejecución del agregador podría volver a importarla si sigue activa en la fuente.`}
        confirmLabel="Eliminar"
        danger
        isSubmitting={deleteOffer.isPending}
        onConfirm={() => {
          if (!deleteTarget) return
          deleteOffer.mutate(deleteTarget.id, {
            onSuccess: () => {
              addToast({ type: 'success', message: 'Oferta eliminada' })
              setDeleteTarget(null)
            },
            onError: (err) =>
              addToast({ type: 'error', message: `Error: ${err.message}` }),
          })
        }}
      />
    </div>
  )
}

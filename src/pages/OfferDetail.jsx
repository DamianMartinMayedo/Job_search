import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  ExternalLink,
  MapPin,
  Wifi,
  Send,
  Trash2,
  Building2,
  Calendar,
  Rss,
} from 'lucide-react'
import { useJobOffer, useUpdateJobOffer, useDeleteJobOffer } from '../hooks/useJobOffers'
import ApplyToOfferDialog from '../components/offers/ApplyToOfferDialog'
import ConfirmModal from '../components/ui/ConfirmModal'
import { SkeletonCard } from '../components/ui/Skeleton'
import { OFFER_STATUS, OFFER_STATUS_MAP } from '../utils/constants'
import useAppStore from '../store/useAppStore'

export default function OfferDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: offer, isLoading } = useJobOffer(id)
  const updateOffer = useUpdateJobOffer()
  const deleteOffer = useDeleteJobOffer()
  const addToast = useAppStore((s) => s.addToast)
  const [applyOpen, setApplyOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  if (isLoading) {
    return (
      <div>
        <SkeletonCard />
      </div>
    )
  }

  if (!offer) {
    return (
      <div>
        <button
          onClick={() => navigate('/app/offers')}
          className="mb-4 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 cursor-pointer"
        >
          <ArrowLeft size={16} />
          Volver a ofertas
        </button>
        <p className="text-sm text-slate-500">Oferta no encontrada o eliminada.</p>
      </div>
    )
  }

  const statusInfo = OFFER_STATUS_MAP[offer.status] || OFFER_STATUS_MAP.new

  const handleStatusChange = (newStatus) => {
    updateOffer.mutate(
      { id: offer.id, data: { status: newStatus } },
      {
        onSuccess: () =>
          addToast({ type: 'success', message: `Marcada como "${OFFER_STATUS_MAP[newStatus]?.label}"` }),
        onError: (err) => addToast({ type: 'error', message: `Error: ${err.message}` }),
      }
    )
  }

  return (
    <div>
      <button
        onClick={() => navigate('/app/offers')}
        className="mb-4 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 cursor-pointer"
      >
        <ArrowLeft size={16} />
        Volver a ofertas
      </button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-slate-900">{offer.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
            {offer.company_id ? (
              <Link
                to={`/app/companies/${offer.company_id}`}
                className="flex items-center gap-1 font-medium text-primary-600 hover:text-primary-700"
              >
                <Building2 size={14} />
                {offer.company_known_name || offer.company_name}
              </Link>
            ) : offer.company_name ? (
              <span className="flex items-center gap-1 font-medium text-slate-700">
                <Building2 size={14} />
                {offer.company_name}
                <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                  sin empresa en BD
                </span>
              </span>
            ) : null}
            {offer.location && (
              <span className="flex items-center gap-1">
                <MapPin size={14} />
                {offer.location}
              </span>
            )}
            {offer.remote && (
              <span className="flex items-center gap-1 text-emerald-600">
                <Wifi size={14} />
                Remoto
              </span>
            )}
            {offer.source_name && (
              <span className="flex items-center gap-1 text-slate-400">
                <Rss size={12} />
                {offer.source_name}
              </span>
            )}
            {offer.posted_at && (
              <span className="flex items-center gap-1 text-slate-400">
                <Calendar size={12} />
                {new Date(offer.posted_at).toLocaleDateString('es-ES')}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <select
            value={offer.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={updateOffer.isPending}
            className={`rounded border px-2.5 py-1.5 text-sm font-medium focus:ring-2 focus:outline-hidden disabled:opacity-50 ${statusInfo.color} border-transparent`}
          >
            {OFFER_STATUS.map((s) => (
              <option key={s.value} value={s.value} className="bg-white text-slate-900">{s.label}</option>
            ))}
          </select>
          <button
            onClick={() => setApplyOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 cursor-pointer"
          >
            <Send size={14} />
            Aplicar
          </button>
        </div>
      </div>

      {offer.description && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-slate-900">Descripción</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{offer.description}</p>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
        <a
          href={offer.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-primary-600 hover:text-primary-700"
        >
          <ExternalLink size={14} />
          Abrir oferta en el portal
        </a>
        <button
          onClick={() => setDeleteOpen(true)}
          className="ml-auto flex items-center gap-1 text-xs text-red-500 hover:text-red-600 cursor-pointer"
        >
          <Trash2 size={12} />
          Eliminar oferta
        </button>
      </div>

      <ApplyToOfferDialog
        open={applyOpen}
        offer={offer}
        onClose={() => setApplyOpen(false)}
      />

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Eliminar oferta"
        message={`¿Eliminar "${offer.title}"? La próxima ejecución del agregador podría volver a importarla si sigue activa en la fuente.`}
        confirmLabel="Eliminar"
        danger
        isSubmitting={deleteOffer.isPending}
        onConfirm={() => {
          deleteOffer.mutate(offer.id, {
            onSuccess: () => {
              addToast({ type: 'success', message: 'Oferta eliminada' })
              navigate('/app/offers')
            },
            onError: (err) => addToast({ type: 'error', message: `Error: ${err.message}` }),
          })
        }}
      />
    </div>
  )
}

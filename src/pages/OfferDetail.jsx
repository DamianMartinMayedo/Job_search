import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowSquareOut,
  MapPin,
  WifiHigh,
  PaperPlaneRight,
  Trash,
  Buildings,
  Calendar,
  Rss,
} from '@phosphor-icons/react'
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
    return <div><SkeletonCard /></div>
  }

  if (!offer) {
    return (
      <div>
        <button
          onClick={() => navigate('/app/offers')}
          className="mb-4 flex items-center gap-1 text-sm text-[#787774] hover:text-[#111111] cursor-pointer transition-colors"
        >
          <ArrowLeft size={16} weight="bold" />
          Volver a ofertas
        </button>
        <p className="text-sm text-[#787774]">Oferta no encontrada o eliminada.</p>
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
        className="mb-4 flex items-center gap-1 text-sm text-[#787774] hover:text-[#111111] cursor-pointer transition-colors"
      >
        <ArrowLeft size={16} weight="bold" />
        Volver a ofertas
      </button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="font-[family-name:var(--font-serif)] text-3xl font-semibold tracking-tight text-[#111111]">{offer.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[#2F3437]">
            {offer.company_id ? (
              <Link
                to={`/app/companies/${offer.company_id}`}
                className="flex items-center gap-1 font-medium text-[#111111] hover:underline"
              >
                <Buildings size={14} weight="regular" />
                {offer.company_known_name || offer.company_name}
              </Link>
            ) : offer.company_name ? (
              <span className="flex items-center gap-1 font-medium text-[#2F3437]">
                <Buildings size={14} weight="regular" />
                {offer.company_name}
                <span className="ml-1 rounded-full bg-[#FBF3DB] px-2 py-0.5 text-[10px] font-medium text-[#956400]">
                  sin empresa en BD
                </span>
              </span>
            ) : null}
            {offer.location && (
              <span className="flex items-center gap-1">
                <MapPin size={14} weight="regular" />
                {offer.location}
              </span>
            )}
            {offer.remote && (
              <span className="flex items-center gap-1 text-[#346538]">
                <WifiHigh size={14} weight="regular" />
                Remoto
              </span>
            )}
            {offer.source_name && (
              <span className="flex items-center gap-1 text-[#ABABAB]">
                <Rss size={12} weight="regular" />
                {offer.source_name}
              </span>
            )}
            {offer.posted_at && (
              <span className="flex items-center gap-1 text-[#ABABAB]">
                <Calendar size={12} weight="regular" />
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
              <option key={s.value} value={s.value} className="bg-white text-[#111111]">{s.label}</option>
            ))}
          </select>
          <button
            onClick={() => setApplyOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-[#111111] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#333333] cursor-pointer transition-colors"
          >
            <PaperPlaneRight size={14} weight="bold" />
            Aplicar
          </button>
        </div>
      </div>

      {offer.description && (
        <div className="mt-6 rounded-lg border border-[#EAEAEA] bg-white p-6">
          <h2 className="text-sm font-semibold text-[#111111] tracking-[-0.01em]">Descripción</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm text-[#2F3437]">{offer.description}</p>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
        <a
          href={offer.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[#111111] hover:underline transition-colors"
        >
          <ArrowSquareOut size={14} weight="bold" />
          Abrir oferta en el portal
        </a>
        <button
          onClick={() => setDeleteOpen(true)}
          className="ml-auto flex items-center gap-1 text-xs text-[#9F2F2D] hover:text-[#7A1F1C] cursor-pointer transition-colors"
        >
          <Trash size={12} weight="bold" />
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

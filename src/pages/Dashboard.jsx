import { Link } from 'react-router-dom'
import {
  Briefcase,
  NotePencil,
  Clock,
  ChartLineUp,
  CalendarDots,
  ArrowSquareOut,
  MapPin,
  WifiHigh,
  CaretRight,
} from '@phosphor-icons/react'
import { useDashboardStats } from '../hooks/useDashboard'
import { useMessages, useUpdateMessage } from '../hooks/useMessages'
import { useActivity } from '../hooks/useActivity'
import { useJobOffers, useUpdateJobOffer } from '../hooks/useJobOffers'
import { useAllContacts } from '../hooks/useContacts'
import { SkeletonCard, SkeletonRow } from '../components/ui/Skeleton'
import useAppStore from '../store/useAppStore'

const KPIS = [
  { key: 'newOffers7d', label: 'Ofertas nuevas · 7d', icon: Briefcase, iconColor: 'text-[#1F6C9F]' },
  { key: 'drafts', label: 'Borradores sin enviar', icon: NotePencil, iconColor: 'text-[#787774]' },
  { key: 'waitingReply', label: 'Esperando respuesta', icon: Clock, iconColor: 'text-[#956400]' },
  { key: 'responseRate', label: 'Tasa de respuesta · 30d', icon: ChartLineUp, iconColor: 'text-[#346538]', isRate: true },
  { key: 'followupsToday', label: 'Seguimientos hoy', icon: CalendarDots, iconColor: 'text-[#9F2F2D]' },
]

export default function Dashboard() {
  const { data: stats, isLoading: loadingStats } = useDashboardStats()
  const { data: draftsData } = useMessages('draft', { page: 1, limit: 5 })
  const { data: followupsData } = useMessages('follow_up', { page: 1, limit: 5 })
  const { data: newOffersData } = useJobOffers({ status: 'new', sortBy: 'posted_at', page: 1, limit: 8 })
  const { data: activity, isLoading: loadingActivity } = useActivity(8)
  const { data: contactsData } = useAllContacts({ page: 1, limit: 8 })

  const updateMessage = useUpdateMessage()
  const updateOffer = useUpdateJobOffer()
  const addToast = useAppStore((s) => s.addToast)

  const drafts = draftsData?.messages || []
  const followups = followupsData?.messages || []
  const offers = newOffersData?.offers || []
  const contacts = contactsData?.contacts || []

  return (
    <div>
      <h1 className="font-[family-name:var(--font-serif)] text-3xl font-semibold tracking-tight text-[#111111]">Dashboard</h1>
      <p className="mt-1 text-sm text-[#787774]">Resumen de tu búsqueda de empleo</p>

      {/* Hero strip de KPIs */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {loadingStats
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
          : KPIS.map((kpi, index) => {
              const raw = stats?.[kpi.key]
              const display = kpi.isRate
                ? raw == null ? '—' : `${raw}%`
                : raw ?? 0
              return (
                <div
                  key={kpi.key}
                  className="rounded-lg border border-[#EAEAEA] bg-white p-5 animate-[fadeInUp_300ms_ease-out_both]"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <p className="text-3xl font-semibold text-[#111111] leading-none tabular-nums">{display}</p>
                  <div className="mt-3 flex items-center gap-1.5">
                    <kpi.icon size={12} weight="bold" className={kpi.iconColor} />
                    <p className="text-xs text-[#787774] leading-tight">{kpi.label}</p>
                  </div>
                  {kpi.isRate && stats?.responseRateSent > 0 && (
                    <p className="mt-1 text-[10px] text-[#ABABAB]">
                      {stats.responseRateReplied}/{stats.responseRateSent} mensajes
                    </p>
                  )}
                </div>
              )
            })}
      </div>

      {/* Banda central: bandeja + ofertas */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Bandeja de borradores y follow-ups */}
        <section className="overflow-hidden rounded-lg border border-[#EAEAEA] bg-white">
          <div className="flex items-center justify-between border-b border-[#EAEAEA] px-5 py-3.5">
            <h2 className="text-sm font-semibold text-[#111111] tracking-[-0.01em]">Bandeja de envíos</h2>
            <span className="text-xs text-slate-400">
              {drafts.length} borradores · {followups.length} follow-ups
            </span>
          </div>
          <div className="divide-y divide-[#EAEAEA]">
            {drafts.length === 0 && followups.length === 0 && (
              <p className="px-5 py-6 text-center text-sm text-slate-400">
                Nada pendiente. Buen momento para preparar el próximo email.
              </p>
            )}
            {drafts.map((m) => (
              <InboxRow
                key={`d-${m.id}`}
                tag="Borrador"
                tagColor="bg-[#F7F6F3] text-[#787774]"
                subject={m.subject}
                meta={`${m.company_name || '—'} · ${m.contact_first_name || 'sin contacto'}`}
                href={`/app/companies/${m.company_id}`}
                primaryAction={{
                  label: 'Marcar enviado',
                  onClick: () =>
                    updateMessage.mutate(
                      { id: m.id, data: { status: 'sent' } },
                      {
                        onSuccess: () => addToast({ type: 'success', message: 'Mensaje marcado como enviado' }),
                        onError: (err) => addToast({ type: 'error', message: `Error: ${err.message}` }),
                      }
                    ),
                  disabled: updateMessage.isPending,
                }}
              />
            ))}
            {followups.map((m) => (
              <InboxRow
                key={`f-${m.id}`}
                tag="Seguimiento"
                tagColor="bg-[#FBF3DB] text-[#956400]"
                subject={m.subject}
                meta={`${m.company_name || '—'} · enviado ${m.sent_at ? new Date(m.sent_at).toLocaleDateString('es-ES') : '—'}`}
                href={`/app/companies/${m.company_id}`}
                primaryAction={{
                  label: 'Marcar hecho',
                  onClick: () =>
                    updateMessage.mutate(
                      { id: m.id, data: { follow_up_done: true } },
                      {
                        onSuccess: () => addToast({ type: 'success', message: 'Seguimiento marcado como hecho' }),
                        onError: (err) => addToast({ type: 'error', message: `Error: ${err.message}` }),
                      }
                    ),
                  disabled: updateMessage.isPending,
                }}
              />
            ))}
          </div>
        </section>

        {/* Ofertas nuevas para revisar */}
        <section className="overflow-hidden rounded-lg border border-[#EAEAEA] bg-white">
          <div className="flex items-center justify-between border-b border-[#EAEAEA] px-5 py-3.5">
            <h2 className="text-sm font-semibold text-[#111111] tracking-[-0.01em]">
              Ofertas nuevas{stats?.newOffers7d ? ` (${stats.newOffers7d} en 7 días)` : ''}
            </h2>
            <Link to="/app/offers" className="text-xs text-[#787774] transition-colors hover:text-[#111111]">
              Ver todas →
            </Link>
          </div>
          <div className="divide-y divide-[#EAEAEA]">
            {offers.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-slate-400">
                Sin ofertas nuevas. Configura fuentes en Ajustes.
              </p>
            ) : (
              offers.map((o) => (
                <div key={o.id} className="flex items-start gap-3 px-5 py-3 hover:bg-[#F7F6F3]">
                  <div className="min-w-0 flex-1">
                    <a
                      href={o.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-[#111111] hover:underline line-clamp-1"
                    >
                      {o.title}
                      <ArrowSquareOut size={11} weight="bold" className="ml-1 inline opacity-40" />
                    </a>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      {o.company_id ? (
                        <Link to={`/app/companies/${o.company_id}`} className="text-primary-600 hover:underline">
                          {o.company_known_name || o.company_name}
                        </Link>
                      ) : (
                        o.company_name && <span>{o.company_name}</span>
                      )}
                      {o.location && (
                        <span className="flex items-center gap-0.5">
                          <MapPin size={10} weight="bold" />
                          {o.location}
                        </span>
                      )}
                      {o.remote && (
                        <span className="flex items-center gap-0.5 text-[#346538]">
                          <WifiHigh size={10} weight="bold" />
                          Remoto
                        </span>
                      )}
                      <span className="text-slate-400">· {o.source_name}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() =>
                        updateOffer.mutate(
                          { id: o.id, data: { status: 'interesting' } },
                          {
                            onSuccess: () =>
                              addToast({ type: 'success', message: 'Marcada como interesante' }),
                            onError: (err) =>
                              addToast({ type: 'error', message: `Error: ${err.message}` }),
                          }
                        )
                      }
                      disabled={updateOffer.isPending}
                      className="rounded px-2 py-1 text-xs text-[#956400] hover:bg-[#FBF3DB] disabled:opacity-50 cursor-pointer transition-colors"
                      title="Marcar como interesante"
                    >
                      Me interesa
                    </button>
                    <button
                      onClick={() =>
                        updateOffer.mutate(
                          { id: o.id, data: { status: 'rejected' } },
                          {
                            onSuccess: () => addToast({ type: 'success', message: 'Descartada' }),
                            onError: (err) =>
                              addToast({ type: 'error', message: `Error: ${err.message}` }),
                          }
                        )
                      }
                      disabled={updateOffer.isPending}
                      className="rounded px-2 py-1 text-xs text-[#787774] hover:bg-[#F7F6F3] disabled:opacity-50 cursor-pointer transition-colors"
                      title="Descartar"
                    >
                      Descartar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Banda inferior: actividad + contactos */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="overflow-hidden rounded-lg border border-[#EAEAEA] bg-white">
          <div className="border-b border-[#EAEAEA] px-5 py-3.5">
            <h2 className="text-sm font-semibold text-[#111111] tracking-[-0.01em]">Actividad reciente</h2>
          </div>
          <div className="p-5">
            {loadingActivity ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} columns={2} />
                ))}
              </div>
            ) : !activity || activity.length === 0 ? (
              <p className="text-sm text-slate-400">Sin actividad aún.</p>
            ) : (
              <div className="space-y-3">
                {activity.map((a) => (
                  <div key={a.id} className="flex gap-3">
                    <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#EAEAEA]" />
                    <div className="min-w-0">
                      <p className="text-sm text-[#2F3437]">{a.description}</p>
                      <p className="text-xs text-[#ABABAB]">
                        {a.company_name} · {timeAgo(a.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-[#EAEAEA] bg-white">
          <div className="border-b border-[#EAEAEA] px-5 py-3.5">
            <h2 className="text-sm font-semibold text-[#111111] tracking-[-0.01em]">Contactos recientes</h2>
          </div>
          <div className="divide-y divide-[#EAEAEA]">
            {contacts.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-slate-400">
                Aún no hay contactos. Añádelos desde el detalle de una empresa.
              </p>
            ) : (
              contacts.map((c) => (
                <Link
                  key={c.id}
                  to={`/app/companies/${c.company_id}`}
                  className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-[#F7F6F3]"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#111111]">
                      {c.first_name} {c.last_name || ''}
                    </p>
                    <p className="text-xs text-[#787774]">
                      {c.role ? `${c.role} · ` : ''}
                      {c.company_name}
                    </p>
                  </div>
                  <CaretRight size={14} weight="bold" className="text-[#EAEAEA]" />
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function InboxRow({ tag, tagColor, subject, meta, href, primaryAction }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3 hover:bg-[#F7F6F3]">
      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.05em] ${tagColor}`}>
        {tag}
      </span>
      <div className="min-w-0 flex-1">
        <Link to={href} className="text-sm font-medium text-[#111111] hover:underline line-clamp-1">
          {subject}
        </Link>
        <p className="mt-0.5 text-xs text-[#787774] truncate">{meta}</p>
      </div>
      {primaryAction && (
        <button
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled}
          className="shrink-0 rounded px-2 py-1 text-xs text-[#111111] hover:bg-[#F7F6F3] border border-[#EAEAEA] disabled:opacity-50 cursor-pointer transition-colors"
        >
          {primaryAction.label}
        </button>
      )}
    </div>
  )
}

function timeAgo(dateStr) {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now - date) / 1000)
  if (diff < 60) return 'hace un momento'
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`
  if (diff < 604800) return `hace ${Math.floor(diff / 86400)}d`
  return date.toLocaleDateString('es-ES')
}

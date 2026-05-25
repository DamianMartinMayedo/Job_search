import { Link } from 'react-router-dom'
import {
  Briefcase,
  FileEdit,
  Clock3,
  PercentSquare,
  CalendarClock,
  ExternalLink,
  MapPin,
  Wifi,
  ChevronRight,
} from 'lucide-react'
import { useDashboardStats } from '../hooks/useDashboard'
import { useMessages, useUpdateMessage } from '../hooks/useMessages'
import { useActivity } from '../hooks/useActivity'
import { useJobOffers, useUpdateJobOffer } from '../hooks/useJobOffers'
import { useAllContacts } from '../hooks/useContacts'
import { SkeletonCard, SkeletonRow } from '../components/ui/Skeleton'
import useAppStore from '../store/useAppStore'

const KPIS = [
  { key: 'newOffers7d', label: 'Ofertas nuevas · 7d', icon: Briefcase, color: 'text-blue-600 bg-blue-50' },
  { key: 'drafts', label: 'Borradores sin enviar', icon: FileEdit, color: 'text-slate-600 bg-slate-100' },
  { key: 'waitingReply', label: 'Esperando respuesta', icon: Clock3, color: 'text-amber-600 bg-amber-50' },
  { key: 'responseRate', label: 'Tasa de respuesta · 30d', icon: PercentSquare, color: 'text-emerald-600 bg-emerald-50', isRate: true },
  { key: 'followupsToday', label: 'Seguimientos hoy', icon: CalendarClock, color: 'text-orange-600 bg-orange-50' },
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
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">Resumen de tu búsqueda de empleo</p>

      {/* Hero strip de KPIs */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {loadingStats
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
          : KPIS.map((kpi) => {
              const raw = stats?.[kpi.key]
              const display = kpi.isRate
                ? raw == null ? '—' : `${raw}%`
                : raw ?? 0
              return (
                <div key={kpi.key} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start gap-3">
                    <div className={`rounded-lg p-2 ${kpi.color}`}>
                      <kpi.icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-2xl font-bold text-slate-900 leading-tight">{display}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{kpi.label}</p>
                      {kpi.isRate && stats?.responseRateSent > 0 && (
                        <p className="mt-0.5 text-[10px] text-slate-400">
                          {stats.responseRateReplied}/{stats.responseRateSent} mensajes
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
      </div>

      {/* Banda central: bandeja + ofertas */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Bandeja de borradores y follow-ups */}
        <section className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Bandeja de envíos</h2>
            <span className="text-xs text-slate-400">
              {drafts.length} borradores · {followups.length} follow-ups
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {drafts.length === 0 && followups.length === 0 && (
              <p className="px-5 py-6 text-center text-sm text-slate-400">
                Nada pendiente. Buen momento para preparar el próximo email.
              </p>
            )}
            {drafts.map((m) => (
              <InboxRow
                key={`d-${m.id}`}
                tag="Borrador"
                tagColor="bg-slate-100 text-slate-700"
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
                tagColor="bg-orange-100 text-orange-700"
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
        <section className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Ofertas nuevas{stats?.newOffers7d ? ` (${stats.newOffers7d} en 7 días)` : ''}
            </h2>
            <Link to="/app/offers" className="text-xs text-primary-600 hover:underline">
              Ver todas →
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {offers.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-slate-400">
                Sin ofertas nuevas. Configura fuentes en Ajustes.
              </p>
            ) : (
              offers.map((o) => (
                <div key={o.id} className="flex items-start gap-3 px-5 py-3 hover:bg-slate-50">
                  <div className="min-w-0 flex-1">
                    <a
                      href={o.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-slate-900 hover:text-primary-600 line-clamp-1"
                    >
                      {o.title}
                      <ExternalLink size={11} className="ml-1 inline opacity-50" />
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
                          <MapPin size={10} />
                          {o.location}
                        </span>
                      )}
                      {o.remote && (
                        <span className="flex items-center gap-0.5 text-emerald-600">
                          <Wifi size={10} />
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
                      className="rounded px-2 py-1 text-xs text-amber-700 hover:bg-amber-50 disabled:opacity-50 cursor-pointer"
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
                      className="rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
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
        <section className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Actividad reciente</h2>
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
                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-400" />
                    <div className="min-w-0">
                      <p className="text-sm text-slate-700">{a.description}</p>
                      <p className="text-xs text-slate-400">
                        {a.company_name} · {timeAgo(a.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Contactos recientes</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {contacts.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-slate-400">
                Aún no hay contactos. Añádelos desde el detalle de una empresa.
              </p>
            ) : (
              contacts.map((c) => (
                <Link
                  key={c.id}
                  to={`/app/companies/${c.company_id}`}
                  className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">
                      {c.first_name} {c.last_name || ''}
                    </p>
                    <p className="text-xs text-slate-500">
                      {c.role ? `${c.role} · ` : ''}
                      {c.company_name}
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-slate-400" />
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
    <div className="flex items-start gap-3 px-5 py-3 hover:bg-slate-50">
      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${tagColor}`}>
        {tag}
      </span>
      <div className="min-w-0 flex-1">
        <Link to={href} className="text-sm font-medium text-slate-900 hover:text-primary-600 line-clamp-1">
          {subject}
        </Link>
        <p className="mt-0.5 text-xs text-slate-500 truncate">{meta}</p>
      </div>
      {primaryAction && (
        <button
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled}
          className="shrink-0 rounded px-2 py-1 text-xs text-primary-700 hover:bg-primary-50 disabled:opacity-50 cursor-pointer"
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

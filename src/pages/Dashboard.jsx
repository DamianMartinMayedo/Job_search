import { Building2, Users, Mail, CalendarClock } from 'lucide-react'
import { useCompanies } from '../hooks/useCompanies'
import { useMessages } from '../hooks/useMessages'
import { useActivity } from '../hooks/useActivity'
import FollowUpAlert from '../components/messages/FollowUpAlert'
import { SkeletonCard } from '../components/ui/Skeleton'
import { COMPANY_STATUS_MAP } from '../utils/constants'

const kpiCards = [
  { label: 'Empresas nuevas', status: 'new', icon: Building2, color: 'text-blue-600 bg-blue-50' },
  { label: 'Contactadas', status: 'contacted', icon: Mail, color: 'text-amber-600 bg-amber-50' },
  { label: 'En entrevista', status: 'interview', icon: Users, color: 'text-green-600 bg-green-50' },
  { label: 'Seguimientos hoy', followUp: true, icon: CalendarClock, color: 'text-orange-600 bg-orange-50' },
]

export default function Dashboard() {
  const { data: companies, isLoading: loadingCompanies } = useCompanies()
  const { data: messages, isLoading: loadingMessages } = useMessages('follow_up')
  const { data: activity, isLoading: loadingActivity } = useActivity(10)

  const today = new Date().toISOString().split('T')[0]
  const followUpCount = messages?.length || 0

  const isLoading = loadingCompanies || loadingMessages

  if (isLoading) {
    return (
      <div>
        <div className="mb-6">
          <SkeletonCard />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  const counts = {}
  companies?.forEach((c) => {
    counts[c.status] = (counts[c.status] || 0) + 1
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">Resumen de tu búsqueda de empleo</p>

      <FollowUpAlert />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => {
          const value = card.followUp
            ? followUpCount
            : counts[card.status] || 0
          return (
            <div
              key={card.label}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2 ${card.color}`}>
                  <card.icon size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{value}</p>
                  <p className="text-xs text-slate-500">{card.label}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Actividad reciente
        </h2>
        {activity && activity.length > 0 ? (
          <div className="mt-4 space-y-3">
            {activity.map((a) => (
              <div key={a.id} className="flex gap-3">
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary-400" />
                <div>
                  <p className="text-sm text-slate-700">{a.description}</p>
                  <p className="text-xs text-slate-400">
                    {a.company_name} · {timeAgo(a.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-400">
            Aún no hay actividad. Empieza añadiendo empresas desde la sección Empresas.
          </p>
        )}
      </div>
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

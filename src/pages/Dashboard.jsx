import { Building2, Users, Mail, CalendarClock } from 'lucide-react'

const kpiCards = [
  { label: 'Empresas nuevas', value: 0, icon: Building2, color: 'text-blue-600 bg-blue-50' },
  { label: 'Contactadas', value: 0, icon: Mail, color: 'text-amber-600 bg-amber-50' },
  { label: 'En entrevista', value: 0, icon: Users, color: 'text-green-600 bg-green-50' },
  { label: 'Seguimientos hoy', value: 0, icon: CalendarClock, color: 'text-orange-600 bg-orange-50' },
]

export default function Dashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">Resumen de tu búsqueda de empleo</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-slate-200 bg-white p-5"
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 ${card.color}`}>
                <card.icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{card.value}</p>
                <p className="text-xs text-slate-500">{card.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Actividad reciente
        </h2>
        <p className="mt-4 text-sm text-slate-400">
          Aún no hay actividad. Empieza añadiendo empresas desde la sección Empresas.
        </p>
      </div>
    </div>
  )
}

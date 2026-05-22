import { Plus } from 'lucide-react'
import Button from '../components/ui/Button'

export default function Companies() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Empresas</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestiona las empresas que quieres contactar
          </p>
        </div>
        <Button>
          <Plus size={18} />
          Buscar empresas
        </Button>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <p className="text-center text-sm text-slate-400">
          Aún no hay empresas. Usa el botón Buscar empresas para encontrar compañías con Google Places.
        </p>
      </div>
    </div>
  )
}

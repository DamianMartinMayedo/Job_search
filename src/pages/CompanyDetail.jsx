import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Tabs from '../components/ui/Tabs'
import { useState } from 'react'

export default function CompanyDetail() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('contacts')

  const tabs = [
    { value: 'contacts', label: 'Contactos' },
    { value: 'messages', label: 'Mensajes' },
    { value: 'notes', label: 'Notas' },
    { value: 'activity', label: 'Actividad' },
  ]

  return (
    <div>
      <button
        onClick={() => navigate('/app/companies')}
        className="mb-4 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 cursor-pointer"
      >
        <ArrowLeft size={16} />
        Volver a empresas
      </button>

      <h1 className="text-2xl font-bold text-slate-900">Nombre de la empresa</h1>
      <p className="mt-1 text-sm text-slate-500">Sector · Ciudad</p>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white">
        <Tabs tabs={tabs} activeTab={tab} onTabChange={setTab} />
        <div className="p-6">
          <p className="text-sm text-slate-400">
            {tab === 'contacts' && 'Aquí aparecerán los contactos de esta empresa.'}
            {tab === 'messages' && 'Aquí aparecerán los mensajes enviados a esta empresa.'}
            {tab === 'notes' && 'Notas sobre esta empresa. Se guardan automáticamente.'}
            {tab === 'activity' && 'Registro de actividad de esta empresa.'}
          </p>
        </div>
      </div>
    </div>
  )
}

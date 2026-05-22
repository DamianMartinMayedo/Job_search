import { useState, useEffect } from 'react'
import { User } from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { useSettings, useSaveSettings } from '../hooks/useSettings'
import useAppStore from '../store/useAppStore'

export default function Settings() {
  const { data: settings, isLoading } = useSettings()
  const saveSettings = useSaveSettings()
  const addToast = useAppStore((s) => s.addToast)

  const [form, setForm] = useState({
    my_name: '',
    my_role: '',
    my_web: '',
    my_email: '',
  })

  useEffect(() => {
    if (settings) {
      setForm({
        my_name: settings.my_name || '',
        my_role: settings.my_role || '',
        my_web: settings.my_web || '',
        my_email: settings.my_email || '',
      })
    }
  }, [settings])

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    saveSettings.mutate(form, {
      onSuccess: () => addToast({ type: 'success', message: 'Perfil guardado' }),
    })
  }

  if (isLoading) {
    return <p className="text-sm text-slate-400">Cargando...</p>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Ajustes</h1>
      <p className="mt-1 text-sm text-slate-500">
        Tu perfil se usa en las plantillas de email
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 max-w-lg rounded-xl border border-slate-200 bg-white p-6"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-primary-100 p-2 text-primary-600">
            <User size={20} />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">
            Perfil profesional
          </h2>
        </div>

        <div className="flex flex-col gap-4">
          <Input
            label="Nombre completo"
            placeholder="Damian Martin"
            value={form.my_name}
            onChange={(e) => handleChange('my_name', e.target.value)}
          />
          <Input
            label="Rol / Título profesional"
            placeholder="UI/UX Designer & Frontend Developer"
            value={form.my_role}
            onChange={(e) => handleChange('my_role', e.target.value)}
          />
          <Input
            label="Sitio web"
            placeholder="https://www.damianmartin.es"
            value={form.my_web}
            onChange={(e) => handleChange('my_web', e.target.value)}
          />
          <Input
            label="Email profesional"
            type="email"
            placeholder="tu@email.com"
            value={form.my_email}
            onChange={(e) => handleChange('my_email', e.target.value)}
          />

          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-500">
              Placeholders disponibles en plantillas:
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {['{{my_name}}', '{{my_role}}', '{{my_web}}', '{{my_email}}'].map(
                (p) => (
                  <code
                    key={p}
                    className="rounded bg-slate-200 px-2 py-0.5 text-xs font-mono text-slate-600"
                  >
                    {p}
                  </code>
                )
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={saveSettings.isPending}
            >
              {saveSettings.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

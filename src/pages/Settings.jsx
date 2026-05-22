import { useState, useEffect } from 'react'
import { User, Plus, X, Tag, Pencil, Check } from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Badge from '../components/ui/Badge'
import { useSettings, useSaveSettings } from '../hooks/useSettings'
import { SECTORS } from '../utils/constants'
import useAppStore from '../store/useAppStore'

export default function Settings() {
  const { data: settings, isLoading } = useSettings()
  const saveSettings = useSaveSettings()
  const addToast = useAppStore((s) => s.addToast)

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    my_name: '',
    my_role: '',
    my_web: '',
    my_email: '',
  })

  const [newSector, setNewSector] = useState('')
  const [customSectors, setCustomSectors] = useState([])

  useEffect(() => {
    if (settings) {
      setForm({
        my_name: settings.my_name || '',
        my_role: settings.my_role || '',
        my_web: settings.my_web || '',
        my_email: settings.my_email || '',
      })
      setCustomSectors(Array.isArray(settings.custom_sectors) ? settings.custom_sectors : [])
    }
  }, [settings])

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }))
  }

  const handleSave = () => {
    saveSettings.mutate({ ...form, custom_sectors: customSectors }, {
      onSuccess: () => {
        addToast({ type: 'success', message: 'Perfil guardado' })
        setEditing(false)
      },
    })
  }

  const addSector = () => {
    const trimmed = newSector.trim()
    if (!trimmed) return
    if (customSectors.includes(trimmed) || SECTORS.includes(trimmed)) {
      addToast({ type: 'warning', message: 'Ese sector ya existe' })
      return
    }
    setCustomSectors([...customSectors, trimmed])
    setNewSector('')
  }

  const removeSector = (sector) => {
    setCustomSectors(customSectors.filter((s) => s !== sector))
  }

  const allSectors = [...SECTORS.filter((s) => s !== 'Otro'), ...customSectors]

  if (isLoading) {
    return <p className="text-sm text-slate-400">Cargando...</p>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Ajustes</h1>
      <p className="mt-1 text-sm text-slate-500">
        Tu perfil y configuración de sectores
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary-100 p-2 text-primary-600">
                <User size={20} />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">
                Perfil profesional
              </h2>
            </div>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 cursor-pointer"
              >
                <Pencil size={14} />
                Editar
              </button>
            )}
          </div>

          {editing ? (
            <div className="p-6">
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

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setEditing(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saveSettings.isPending}
                  >
                    <Check size={16} />
                    {saveSettings.isPending ? 'Guardando...' : 'Guardar'}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Nombre', value: form.my_name },
                  { label: 'Rol', value: form.my_role },
                  { label: 'Web', value: form.my_web },
                  { label: 'Email', value: form.my_email },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs font-medium uppercase text-slate-400">
                      {label}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-900">
                      {value || '—'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
            <div className="rounded-lg bg-amber-100 p-2 text-amber-600">
              <Tag size={20} />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">
              Sectores
            </h2>
          </div>

          <div className="p-6">
            <p className="mb-4 text-sm text-slate-500">
              Sectores disponibles para buscar empresas con Google Places.
            </p>

            <div className="mb-4 flex flex-wrap gap-2">
              {allSectors.map((s) => {
                const isCustom = customSectors.includes(s)
                return (
                  <Badge
                    key={s}
                    className={`${
                      isCustom
                        ? 'bg-amber-100 text-amber-700 border-amber-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    } flex items-center gap-1`}
                  >
                    {s}
                    {isCustom && (
                      <button
                        type="button"
                        onClick={() => removeSector(s)}
                        className="ml-1 rounded-full p-0.5 hover:bg-amber-200 cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </Badge>
                )
              })}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Nuevo sector..."
                value={newSector}
                onChange={(e) => setNewSector(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addSector()
                  }
                }}
              />
              <Button type="button" onClick={addSector} variant="secondary">
                <Plus size={18} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

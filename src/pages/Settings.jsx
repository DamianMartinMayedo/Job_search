import { useState, useEffect, useRef } from 'react'
import { User, Plus, X, Tag, Pencil, Check, Upload, FileText, Trash2, FolderOpen } from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import ConfirmModal from '../components/ui/ConfirmModal'
import { useSettings, useSaveSettings } from '../hooks/useSettings'
import { useDocumentPairs, useCreateDocumentPair, useDeleteDocumentPair } from '../hooks/useDocuments'
import { SECTORS } from '../utils/constants'
import useAppStore from '../store/useAppStore'
import JobSourcesSection from '../components/offers/JobSourcesSection'

export default function Settings() {
  const { data: settings, isLoading } = useSettings()
  const saveSettings = useSaveSettings()
  const { data: pairs } = useDocumentPairs()
  const createPair = useCreateDocumentPair()
  const deletePair = useDeleteDocumentPair()
  const addToast = useAppStore((s) => s.addToast)

  const cvInputRef = useRef(null)
  const coverInputRef = useRef(null)
  const [deletePairTarget, setDeletePairTarget] = useState(null)
  const [pairModalOpen, setPairModalOpen] = useState(false)
  const [pairForm, setPairForm] = useState({ pair_name: '' })
  const [pairCv, setPairCv] = useState(null)
  const [pairCover, setPairCover] = useState(null)

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
      onError: (err) =>
        addToast({ type: 'error', message: `Error: ${err.message}` }),
    })
  }

  const handleSaveSectors = () => {
    saveSettings.mutate({ ...form, custom_sectors: customSectors }, {
      onSuccess: () =>
        addToast({ type: 'success', message: 'Sectores guardados' }),
      onError: (err) =>
        addToast({ type: 'error', message: `Error: ${err.message}` }),
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

  const handleCreatePair = () => {
    if (!pairForm.pair_name.trim()) return
    if (!pairCv || !pairCover) {
      addToast({ type: 'error', message: 'Selecciona un CV y una carta' })
      return
    }

    const readFile = (file) =>
      new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve({ name: file.name, content: reader.result.split(',')[1] })
        reader.readAsDataURL(file)
      })

    Promise.all([readFile(pairCv), readFile(pairCover)]).then(([cv, cover]) => {
      createPair.mutate(
        { pair_name: pairForm.pair_name.trim(), cv, cover },
        {
          onSuccess: () => {
            addToast({ type: 'success', message: `Par "${pairForm.pair_name.trim()}" creado` })
            setPairModalOpen(false)
            setPairForm({ pair_name: '' })
            setPairCv(null)
            setPairCover(null)
          },
          onError: (err) =>
            addToast({ type: 'error', message: `Error: ${err.message}` }),
        }
      )
    })
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

            <div className="mt-3 flex justify-end">
              <Button
                onClick={handleSaveSectors}
                disabled={saveSettings.isPending}
                size="sm"
              >
                <Check size={16} />
                {saveSettings.isPending ? 'Guardando...' : 'Guardar sectores'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2 text-green-600">
              <FolderOpen size={20} />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">
              Pares de documentos (CV + carta)
            </h2>
          </div>
          <Button size="sm" onClick={() => setPairModalOpen(true)}>
            <Plus size={16} />
            Nuevo par
          </Button>
        </div>

        <div className="p-6">
          <p className="mb-4 text-sm text-slate-500">
            Cada par agrupa un CV y una carta de presentación. Al enviar un correo puedes elegir qué par adjuntar (o ninguno).
          </p>

          {pairs && pairs.length > 0 ? (
            <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
              {pairs.map((p) => (
                <div key={p.pair_name} className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900">{p.pair_name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      {p.cv && (
                        <span className="flex items-center gap-1">
                          <FileText size={12} />
                          CV: {p.cv.name}
                        </span>
                      )}
                      {p.cover && (
                        <span className="flex items-center gap-1">
                          <FileText size={12} />
                          Carta: {p.cover.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setDeletePairTarget(p)}
                    className="shrink-0 rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 cursor-pointer"
                    title="Eliminar par"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-slate-400">
              No hay pares de documentos. Crea uno con el botón "Nuevo par".
            </p>
          )}
        </div>
      </div>

      <JobSourcesSection />

      <Modal
        open={pairModalOpen}
        onClose={() => {
          setPairModalOpen(false)
          setPairForm({ pair_name: '' })
          setPairCv(null)
          setPairCover(null)
        }}
        title="Nuevo par de documentos"
      >
        <div className="flex flex-col gap-4 p-1">
          <Input
            label="Nombre del par"
            placeholder="UI/UX, Diseño, General..."
            value={pairForm.pair_name}
            onChange={(e) => setPairForm((f) => ({ ...f, pair_name: e.target.value }))}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">CV (PDF)</label>
            {pairCv ? (
              <div className="flex items-center justify-between rounded-lg border border-slate-200 p-2">
                <span className="text-sm text-slate-600 truncate">{pairCv.name}</span>
                <button
                  onClick={() => setPairCv(null)}
                  className="rounded p-1 text-slate-400 hover:text-red-500 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500 hover:border-primary-400 hover:text-primary-600">
                <Upload size={16} className="mr-2" />
                Seleccionar CV
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => setPairCv(e.target.files?.[0] || null)}
                />
              </label>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Carta de presentación (PDF)</label>
            {pairCover ? (
              <div className="flex items-center justify-between rounded-lg border border-slate-200 p-2">
                <span className="text-sm text-slate-600 truncate">{pairCover.name}</span>
                <button
                  onClick={() => setPairCover(null)}
                  className="rounded p-1 text-slate-400 hover:text-red-500 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500 hover:border-primary-400 hover:text-primary-600">
                <Upload size={16} className="mr-2" />
                Seleccionar carta
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => setPairCover(e.target.files?.[0] || null)}
                />
              </label>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setPairModalOpen(false)
                setPairForm({ pair_name: '' })
                setPairCv(null)
                setPairCover(null)
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreatePair}
              disabled={createPair.isPending || !pairForm.pair_name.trim() || !pairCv || !pairCover}
            >
              {createPair.isPending ? 'Creando...' : 'Crear par'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deletePairTarget}
        onClose={() => setDeletePairTarget(null)}
        title="Eliminar par de documentos"
        message={`¿Eliminar el par "${deletePairTarget?.pair_name}" (CV y carta)?`}
        confirmLabel="Eliminar"
        danger
        isSubmitting={deletePair.isPending}
        onConfirm={() => {
          if (!deletePairTarget) return
          deletePair.mutate(deletePairTarget.pair_name, {
            onSuccess: () => {
              addToast({ type: 'success', message: `Par "${deletePairTarget.pair_name}" eliminado` })
              setDeletePairTarget(null)
            },
            onError: (err) => {
              addToast({ type: 'error', message: `Error: ${err.message}` })
              setDeletePairTarget(null)
            },
          })
        }}
      />
    </div>
  )
}

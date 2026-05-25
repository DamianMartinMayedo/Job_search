import { useState, useEffect, useRef } from 'react'
import { User, Plus, X, Tag, Pencil, Check, Upload, FileText, Trash2 } from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Badge from '../components/ui/Badge'
import ConfirmModal from '../components/ui/ConfirmModal'
import { useSettings, useSaveSettings } from '../hooks/useSettings'
import { useDocuments, useUploadDocument, useDeleteDocument } from '../hooks/useDocuments'
import { SECTORS } from '../utils/constants'
import useAppStore from '../store/useAppStore'

export default function Settings() {
  const { data: settings, isLoading } = useSettings()
  const saveSettings = useSaveSettings()
  const { data: documents } = useDocuments()
  const uploadDocument = useUploadDocument()
  const deleteDocument = useDeleteDocument()
  const addToast = useAppStore((s) => s.addToast)

  const cvInputRef = useRef(null)
  const coverInputRef = useRef(null)
  const [deleteDocTarget, setDeleteDocTarget] = useState(null)

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

  const handleFileUpload = (type, file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]
      uploadDocument.mutate(
        { type, name: file.name, content: base64 },
        {
          onSuccess: () =>
            addToast({ type: 'success', message: `${type === 'cv' ? 'CV' : 'Carta'} subido` }),
          onError: (err) =>
            addToast({ type: 'error', message: `Error al subir: ${err.message}` }),
        }
      )
    }
    reader.readAsDataURL(file)
  }

  const getDocByType = (type) => {
    if (!documents) return null
    return documents.find((d) => d.type === type && !d.company_id) || null
  }

  const cvDoc = getDocByType('cv')
  const coverDoc = getDocByType('cover_letter')

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
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
          <div className="rounded-lg bg-green-100 p-2 text-green-600">
            <FileText size={20} />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">
            CV y carta de presentación
          </h2>
        </div>

        <div className="p-6">
          <p className="mb-4 text-sm text-slate-500">
            Se adjuntan automáticamente al enviar correos. Si una empresa tiene sus propios documentos, esos tienen prioridad.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { type: 'cv', label: 'Currículum (CV)', doc: cvDoc, ref: cvInputRef },
              { type: 'cover_letter', label: 'Carta de presentación', doc: coverDoc, ref: coverInputRef },
            ].map(({ type, label, doc, ref }) => (
              <div
                key={type}
                className="rounded-lg border border-slate-200 p-4"
              >
                <p className="text-sm font-medium text-slate-700">{label}</p>
                {doc ? (
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={16} className="shrink-0 text-slate-400" />
                      <div className="min-w-0">
                        <p className="text-sm text-slate-900 truncate">{doc.name}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(doc.created_at).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => ref.current?.click()}
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                        title="Reemplazar"
                      >
                        <Upload size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteDocTarget(doc)}
                        className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <input
                      ref={ref}
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleFileUpload(type, e.target.files[0])
                        e.target.value = ''
                      }}
                    />
                  </div>
                ) : (
                  <div className="mt-2">
                    <button
                      onClick={() => ref.current?.click()}
                      className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500 hover:border-primary-400 hover:text-primary-600 cursor-pointer w-full"
                    >
                      <Upload size={16} />
                      Subir {type === 'cv' ? 'CV' : 'carta'}
                    </button>
                    <input
                      ref={ref}
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleFileUpload(type, e.target.files[0])
                        e.target.value = ''
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <ConfirmModal
        open={!!deleteDocTarget}
        onClose={() => setDeleteDocTarget(null)}
        title="Eliminar documento"
        message={`¿Eliminar ${deleteDocTarget?.name || 'este documento'}?`}
        confirmLabel="Eliminar"
        danger
        isSubmitting={deleteDocument.isPending}
        onConfirm={() => {
          if (!deleteDocTarget) return
          deleteDocument.mutate(deleteDocTarget.id, {
            onSuccess: () => {
              addToast({ type: 'success', message: 'Documento eliminado' })
              setDeleteDocTarget(null)
            },
            onError: (err) => {
              addToast({ type: 'error', message: `Error: ${err.message}` })
              setDeleteDocTarget(null)
            },
          })
        }}
      />
    </div>
  )
}

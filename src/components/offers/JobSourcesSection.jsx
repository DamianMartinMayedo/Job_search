import { useState, useMemo } from 'react'
import { Plus, Rss, Trash2, RefreshCw, AlertCircle, CheckCircle2, Pencil } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Modal from '../ui/Modal'
import ConfirmModal from '../ui/ConfirmModal'
import {
  useJobSources,
  useCreateJobSource,
  useUpdateJobSource,
  useDeleteJobSource,
  useRunSources,
} from '../../hooks/useJobOffers'
import useAppStore from '../../store/useAppStore'
import { JOB_PORTAL_CATALOG, getPortalById } from '../../utils/jobSourceCatalog'

// Defaults usados solo para el flujo "Editar fuente existente" (formulario libre).
const BLANK_EDIT = { name: '', url: '', type: 'rss', language: 'es', region: '' }

export default function JobSourcesSection() {
  const { data: sources } = useJobSources()
  const createSource = useCreateJobSource()
  const updateSource = useUpdateJobSource()
  const deleteSource = useDeleteJobSource()
  const runSources = useRunSources()
  const addToast = useAppStore((s) => s.addToast)

  // Modal nueva fuente: wizard guiado por catálogo. `wizardPortalId` define qué
  // portal está activo y `wizardValues` los campos seleccionados.
  const [showWizard, setShowWizard] = useState(false)
  const [wizardPortalId, setWizardPortalId] = useState(JOB_PORTAL_CATALOG[0].id)
  const [wizardValues, setWizardValues] = useState({})

  // Modal editar fuente: formulario libre para fuentes existentes (que pueden
  // venir de cualquier configuración antigua).
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(BLANK_EDIT)

  const [deleteTarget, setDeleteTarget] = useState(null)
  // Qué se está ejecutando ahora: id concreto, 'es', 'intl', o null.
  // Solo gira el spinner del botón pulsado (runSources.isPending es global).
  const [runningId, setRunningId] = useState(null)

  const wizardPortal = getPortalById(wizardPortalId)
  // Aplica defaults a wizardValues para los fields sin valor explícito.
  const wizardEffectiveValues = useMemo(() => {
    if (!wizardPortal) return {}
    const out = { ...wizardValues }
    for (const f of wizardPortal.fields) {
      if (out[f.key] === undefined && f.default !== undefined) out[f.key] = f.default
    }
    return out
  }, [wizardPortal, wizardValues])
  const wizardBuilt = wizardPortal?.build(wizardEffectiveValues)

  const openWizard = () => {
    setWizardPortalId(JOB_PORTAL_CATALOG[0].id)
    setWizardValues({})
    setShowWizard(true)
  }

  const closeWizard = () => {
    setShowWizard(false)
    setWizardValues({})
  }

  const handleWizardSubmit = () => {
    if (!wizardBuilt?.url) {
      addToast({ type: 'error', message: 'Completa la URL' })
      return
    }
    const existingUrls = new Set((sources || []).map((s) => s.url))
    if (existingUrls.has(wizardBuilt.url)) {
      addToast({ type: 'error', message: 'Ya tienes una fuente con esa URL' })
      return
    }
    createSource.mutate(
      {
        name: wizardBuilt.name,
        url: wizardBuilt.url,
        type: wizardBuilt.type || 'rss',
        language: wizardBuilt.language || null,
        region: wizardBuilt.region || null,
      },
      {
        onSuccess: () => {
          addToast({ type: 'success', message: `Fuente "${wizardBuilt.name}" creada` })
          closeWizard()
        },
        onError: (err) => addToast({ type: 'error', message: `Error: ${err.message}` }),
      }
    )
  }

  const openEditForm = (s) => {
    setEditingId(s.id)
    setEditForm({
      name: s.name || '',
      url: s.url || '',
      type: s.type || 'rss',
      language: s.language || '',
      region: s.region || '',
    })
  }

  const closeEditForm = () => {
    setEditingId(null)
    setEditForm(BLANK_EDIT)
  }

  const handleEditSubmit = () => {
    if (!editForm.name.trim() || !editForm.url.trim()) return
    updateSource.mutate(
      {
        id: editingId,
        data: {
          name: editForm.name.trim(),
          url: editForm.url.trim(),
          type: editForm.type,
          language: editForm.language || null,
          region: editForm.region.trim() || null,
        },
      },
      {
        onSuccess: () => {
          addToast({ type: 'success', message: `Fuente "${editForm.name}" actualizada` })
          closeEditForm()
        },
        onError: (err) => addToast({ type: 'error', message: `Error: ${err.message}` }),
      }
    )
  }

  // arg: string (UUID), 'es', 'intl', o undefined (todas — sin uso público hoy).
  const handleRun = (arg) => {
    const runKey = arg || 'all'
    setRunningId(runKey)
    const mutationArg =
      arg === 'es' || arg === 'intl'
        ? { language: arg }
        : arg /* UUID string */ || undefined
    runSources.mutate(mutationArg, {
      onSettled: () => setRunningId(null),
      onSuccess: (data) => {
        if (typeof arg === 'string' && arg !== 'es' && arg !== 'intl') {
          // Ejecución de una fuente concreta
          const r = data.sources[0]
          if (!r) {
            addToast({ type: 'error', message: 'La fuente no devolvió resultado' })
            return
          }
          if (r.ok) {
            addToast({ type: 'success', message: `${r.source}: ${r.inserted} nuevas / ${r.fetched} leídas` })
          } else {
            addToast({ type: 'error', message: `${r.source}: ${r.error}` })
          }
        } else {
          // Ejecución de un grupo (es / intl / all)
          const groupLabel = arg === 'es' ? 'España' : arg === 'intl' ? 'Internacional' : 'Todas'
          const failed = data.sources.filter((s) => !s.ok)
          if (data.sources.length === 0) {
            addToast({ type: 'success', message: `${groupLabel}: no hay fuentes habilitadas para ejecutar` })
          } else if (failed.length === 0) {
            const totalNew = data.sources.reduce((acc, s) => acc + (s.inserted || 0), 0)
            addToast({ type: 'success', message: `${groupLabel}: ${data.sources.length} fuentes · ${totalNew} ofertas nuevas` })
          } else {
            addToast({ type: 'error', message: `${groupLabel}: ${failed.length} de ${data.sources.length} fuentes fallaron` })
          }
        }
      },
      onError: (err) => addToast({ type: 'error', message: `Error: ${err.message}` }),
    })
  }

  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-orange-100 p-2 text-orange-600">
            <Rss size={20} />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Fuentes de ofertas</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={openWizard}>
            <Plus size={16} />
            Nueva fuente
          </Button>
        </div>
      </div>

      <div className="p-6">
        {sources && sources.length > 0 ? (
          (() => {
            const esSources = sources.filter((s) => s.language === 'es')
            const intlSources = sources.filter((s) => s.language !== 'es')
            const renderRow = (s) => (
              <div key={s.id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-slate-900">{s.name}</p>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{s.type}</span>
                    {s.region && (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{s.region}</span>
                    )}
                    {!s.enabled && (
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">deshabilitada</span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{s.url}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span>{s.offers_count} ofertas</span>
                    {s.last_run_at && (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        Última: {new Date(s.last_run_at).toLocaleString('es-ES')}
                      </span>
                    )}
                    {s.last_error && (
                      <span className="flex items-center gap-1 text-red-500" title={s.last_error}>
                        <AlertCircle size={12} />
                        Error en la última ejecución
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => handleRun(s.id)}
                    disabled={runSources.isPending}
                    className="rounded p-1.5 text-slate-400 hover:bg-orange-50 hover:text-orange-600 disabled:opacity-50 cursor-pointer"
                    title="Ejecutar ahora"
                  >
                    <RefreshCw size={14} className={runningId === s.id ? 'animate-spin' : ''} />
                  </button>
                  <button
                    onClick={() => openEditForm(s)}
                    disabled={runSources.isPending}
                    className="rounded p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50 cursor-pointer"
                    title="Editar"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(s)}
                    className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 cursor-pointer"
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
            const groupBlock = (label, icon, list, runKey, emptyCopy) => (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <span>{icon}</span>
                    {label}
                    <span className="text-slate-400">({list.length})</span>
                  </h3>
                  {list.length > 0 && (
                    <button
                      onClick={() => handleRun(runKey)}
                      disabled={runSources.isPending}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw size={12} className={runningId === runKey ? 'animate-spin' : ''} />
                      Ejecutar grupo
                    </button>
                  )}
                </div>
                {list.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-slate-200 px-4 py-3 text-xs text-slate-400">{emptyCopy}</p>
                ) : (
                  <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                    {list.map(renderRow)}
                  </div>
                )}
              </div>
            )
            return (
              <div className="space-y-4">
                {groupBlock(
                  'España',
                  '🇪🇸',
                  esSources,
                  'es',
                  'Sin fuentes españolas. Tecnoempleo (RSS) y los portales por email (LinkedIn, InfoJobs, Manfred, Domestika — próximamente) caerán aquí.'
                )}
                {groupBlock(
                  'Internacional',
                  '🌍',
                  intlSources,
                  'intl',
                  'Sin fuentes internacionales.'
                )}
              </div>
            )
          })()
        ) : (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-sm text-slate-400">
              No hay fuentes configuradas todavía.
            </p>
            <Button size="sm" onClick={openWizard}>
              <Plus size={14} />
              Añadir primera fuente
            </Button>
          </div>
        )}
      </div>

      {/* Wizard: nueva fuente desde catálogo. Selección de portal + campos
          contextuales (provincia, keyword) + preview de URL en vivo. */}
      <Modal open={showWizard} onClose={closeWizard} title="Nueva fuente de ofertas">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Portal</label>
            <select
              value={wizardPortalId}
              onChange={(e) => {
                setWizardPortalId(e.target.value)
                setWizardValues({})
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-hidden"
            >
              {JOB_PORTAL_CATALOG.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
            {wizardPortal?.description && (
              <p className="mt-1 text-xs text-slate-500">{wizardPortal.description}</p>
            )}
          </div>

          {wizardPortal?.fields.map((f) => {
            const value = wizardEffectiveValues[f.key] ?? ''
            if (f.type === 'select') {
              return (
                <div key={f.key}>
                  <label className="mb-1 block text-sm font-medium text-slate-700">{f.label}</label>
                  <select
                    value={value}
                    onChange={(e) => setWizardValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-hidden"
                  >
                    {f.options.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              )
            }
            if (f.type === 'select-or-custom') {
              const isCustom = value && !f.options.some((o) => o.value === value)
              return (
                <div key={f.key}>
                  <label className="mb-1 block text-sm font-medium text-slate-700">{f.label}</label>
                  <div className="flex gap-2">
                    <select
                      value={isCustom ? '__custom__' : value}
                      onChange={(e) => {
                        const v = e.target.value
                        if (v === '__custom__') {
                          setWizardValues((vs) => ({ ...vs, [f.key]: vs[f.key] || 'custom' }))
                        } else {
                          setWizardValues((vs) => ({ ...vs, [f.key]: v }))
                        }
                      }}
                      className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-hidden"
                    >
                      {f.options.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                      <option value="__custom__">{f.customLabel || 'Otra keyword…'}</option>
                    </select>
                    {isCustom && (
                      <Input
                        value={value}
                        onChange={(e) => setWizardValues((vs) => ({ ...vs, [f.key]: e.target.value }))}
                        placeholder={f.customPlaceholder || 'ej: figma'}
                        className="flex-1"
                      />
                    )}
                  </div>
                </div>
              )
            }
            // text
            return (
              <Input
                key={f.key}
                label={f.label}
                value={value}
                placeholder={f.placeholder}
                onChange={(e) => setWizardValues((vs) => ({ ...vs, [f.key]: e.target.value }))}
              />
            )
          })}

          {/* Preview en vivo de lo que se va a guardar */}
          {wizardBuilt && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
              <p className="font-semibold text-slate-700">{wizardBuilt.name || '(sin nombre)'}</p>
              <p className="mt-1 truncate text-slate-500">{wizardBuilt.url || '(URL incompleta)'}</p>
              <p className="mt-1 text-slate-400">
                {wizardBuilt.language === 'es' ? '🇪🇸 España' : wizardBuilt.language === 'en' ? '🌍 Internacional' : 'Sin grupo'}
                {wizardBuilt.region ? ` · ${wizardBuilt.region}` : ''}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={closeWizard}>Cancelar</Button>
            <Button
              onClick={handleWizardSubmit}
              disabled={createSource.isPending || !wizardBuilt?.url || !wizardBuilt?.name}
            >
              {createSource.isPending ? 'Creando...' : 'Crear fuente'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Editor libre: para fuentes ya existentes que pueden no encajar en el catálogo. */}
      <Modal open={!!editingId} onClose={closeEditForm} title="Editar fuente de ofertas">
        <div className="space-y-4">
          <Input
            label="Nombre"
            value={editForm.name}
            onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Input
            label="URL del feed"
            value={editForm.url}
            onChange={(e) => setEditForm((f) => ({ ...f, url: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Grupo</label>
              <select
                value={editForm.language}
                onChange={(e) => setEditForm((f) => ({ ...f, language: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-hidden"
              >
                <option value="es">🇪🇸 España</option>
                <option value="en">🌍 Internacional</option>
                <option value="">Sin clasificar</option>
              </select>
            </div>
            <Input
              label="Región (opcional)"
              value={editForm.region}
              onChange={(e) => setEditForm((f) => ({ ...f, region: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={closeEditForm}>Cancelar</Button>
            <Button
              onClick={handleEditSubmit}
              disabled={updateSource.isPending || !editForm.name.trim() || !editForm.url.trim()}
            >
              {updateSource.isPending ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Eliminar fuente"
        message={`¿Eliminar "${deleteTarget?.name}"? Las ofertas ya ingestadas no se borran.`}
        confirmLabel="Eliminar"
        danger
        isSubmitting={deleteSource.isPending}
        onConfirm={() => {
          if (!deleteTarget) return
          deleteSource.mutate(deleteTarget.id, {
            onSuccess: () => {
              addToast({ type: 'success', message: 'Fuente eliminada' })
              setDeleteTarget(null)
            },
            onError: (err) =>
              addToast({ type: 'error', message: `Error: ${err.message}` }),
          })
        }}
      />
    </div>
  )
}

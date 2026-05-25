import { useState } from 'react'
import { Plus, Rss, Trash2, RefreshCw, AlertCircle, CheckCircle2, Sparkles, Pencil } from 'lucide-react'
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
import { RECOMMENDED_JOB_SOURCES } from '../../utils/recommendedJobSources'

const SOURCE_TYPES = [
  { value: 'rss', label: 'RSS / Atom' },
]

const BLANK_FORM = { name: '', url: '', type: 'rss', language: 'es', region: '' }

export default function JobSourcesSection() {
  const { data: sources } = useJobSources()
  const createSource = useCreateJobSource()
  const updateSource = useUpdateJobSource()
  const deleteSource = useDeleteJobSource()
  const runSources = useRunSources()
  const addToast = useAppStore((s) => s.addToast)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(BLANK_FORM)
  const [deleteTarget, setDeleteTarget] = useState(null)
  // Qué se está ejecutando ahora: id concreto, 'es', 'intl', o null.
  // Solo gira el spinner del botón pulsado (runSources.isPending es global).
  const [runningId, setRunningId] = useState(null)

  const openNewForm = () => {
    setEditingId(null)
    setForm(BLANK_FORM)
    setShowForm(true)
  }

  const openEditForm = (s) => {
    setEditingId(s.id)
    setForm({
      name: s.name || '',
      url: s.url || '',
      type: s.type || 'rss',
      language: s.language || '',
      region: s.region || '',
    })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(BLANK_FORM)
  }

  const handleSubmitForm = () => {
    if (!form.name.trim() || !form.url.trim()) return
    const payload = {
      name: form.name.trim(),
      url: form.url.trim(),
      type: form.type,
      language: form.language || null,
      region: form.region.trim() || null,
    }
    const mutation = editingId
      ? updateSource.mutateAsync({ id: editingId, data: payload })
      : createSource.mutateAsync(payload)

    mutation
      .then(() => {
        addToast({
          type: 'success',
          message: editingId ? `Fuente "${form.name}" actualizada` : `Fuente "${form.name}" creada`,
        })
        closeForm()
      })
      .catch((err) => addToast({ type: 'error', message: `Error: ${err.message}` }))
  }

  const handleAddRecommended = async () => {
    const existingUrls = new Set((sources || []).map((s) => s.url))
    const toAdd = RECOMMENDED_JOB_SOURCES.filter((r) => !existingUrls.has(r.url))
    if (toAdd.length === 0) {
      addToast({ type: 'success', message: 'Todas las fuentes recomendadas ya están añadidas' })
      return
    }
    let added = 0
    let failed = 0
    for (const r of toAdd) {
      try {
        await createSource.mutateAsync({
          name: r.name,
          url: r.url,
          type: r.type,
          language: r.language,
          region: r.region,
        })
        added++
      } catch {
        failed++
      }
    }
    addToast({
      type: failed > 0 ? 'error' : 'success',
      message: `${added} fuentes añadidas${failed > 0 ? `, ${failed} fallidas` : ''}. Pulsa "Ejecutar España" o "Ejecutar internacional" para traer ofertas.`,
    })
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
          <Button
            size="sm"
            variant="secondary"
            onClick={handleAddRecommended}
            disabled={createSource.isPending}
          >
            <Sparkles size={14} />
            Añadir recomendadas
          </Button>
          <Button size="sm" onClick={openNewForm}>
            <Plus size={16} />
            Nueva fuente
          </Button>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-4 space-y-2 text-sm text-slate-500">
          <p>
            Las fuentes RSS se consultan automáticamente cada día a las 08:00 UTC. También puedes ejecutarlas a mano. Las ofertas se deduplican por URL.
          </p>
          <p>
            <strong className="text-slate-700">Cobertura para tu perfil (UX/UI · España):</strong>
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>
              <strong>Tecnoempleo</strong> sí publica RSS por provincia. Las recomendadas incluyen Sevilla, Madrid y un feed general de toda España. Para otra provincia copia la URL del icono RSS desde su web tras hacer una búsqueda.
            </li>
            <li>
              Tablones internacionales de empleo remoto (<strong>WeWorkRemotely</strong>, <strong>RemoteOK</strong>, <strong>Remotive</strong>). En inglés pero muchas ofertas son worldwide y aceptan España.
            </li>
            <li>
              <strong>InfoJobs</strong>, <strong>LinkedIn</strong>, <strong>Manfred</strong> y <strong>Domestika</strong> no exponen RSS. Para esos usa el panel de <em>Ingesta por email</em> más abajo (alertas → Gmail → polling IMAP).
            </li>
          </ul>
          <p className="pt-1">
            Pulsa <em>Añadir recomendadas</em> para preconfigurar las 7 fuentes verificadas. Después borra o ajusta las que no te interesen.
          </p>
        </div>

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
                  'Sin fuentes internacionales. Si las quieres, pulsa "Añadir recomendadas".'
                )}
              </div>
            )
          })()
        ) : (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-sm text-slate-400">
              No hay fuentes configuradas todavía.
            </p>
            <Button size="sm" onClick={handleAddRecommended} disabled={createSource.isPending}>
              <Sparkles size={14} />
              Añadir fuentes recomendadas
            </Button>
          </div>
        )}
      </div>

      <Modal
        open={showForm}
        onClose={closeForm}
        title={editingId ? 'Editar fuente de ofertas' : 'Nueva fuente de ofertas'}
      >
        <div className="space-y-4">
          <Input
            label="Nombre"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Ej: Tecnoempleo · Sevilla diseño"
          />
          <Input
            label="URL del feed"
            value={form.url}
            onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            placeholder="https://..."
          />
          <p className="-mt-2 text-xs text-slate-500">
            Para Tecnoempleo puedes combinar provincia y keyword: <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">?pr=274&amp;te=diseño</code> (Sevilla + diseño).
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Tipo</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-hidden"
              >
                {SOURCE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Grupo</label>
              <select
                value={form.language}
                onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-hidden"
              >
                <option value="es">🇪🇸 España</option>
                <option value="en">🌍 Internacional</option>
                <option value="">Sin clasificar</option>
              </select>
            </div>
          </div>
          <Input
            label="Región o etiqueta (opcional)"
            value={form.region}
            onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
            placeholder="Ej: Sevilla, Madrid, Remoto, España…"
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={closeForm}>Cancelar</Button>
            <Button
              onClick={handleSubmitForm}
              disabled={
                (editingId ? updateSource.isPending : createSource.isPending) ||
                !form.name.trim() ||
                !form.url.trim()
              }
            >
              {(editingId ? updateSource.isPending : createSource.isPending)
                ? (editingId ? 'Guardando...' : 'Creando...')
                : (editingId ? 'Guardar cambios' : 'Crear')}
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

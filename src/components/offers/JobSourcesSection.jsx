import { useState } from 'react'
import { Plus, Rss, Trash2, RefreshCw, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Modal from '../ui/Modal'
import ConfirmModal from '../ui/ConfirmModal'
import {
  useJobSources,
  useCreateJobSource,
  useDeleteJobSource,
  useRunSources,
} from '../../hooks/useJobOffers'
import useAppStore from '../../store/useAppStore'
import { RECOMMENDED_JOB_SOURCES } from '../../utils/recommendedJobSources'

const SOURCE_TYPES = [
  { value: 'rss', label: 'RSS / Atom' },
]

export default function JobSourcesSection() {
  const { data: sources } = useJobSources()
  const createSource = useCreateJobSource()
  const deleteSource = useDeleteJobSource()
  const runSources = useRunSources()
  const addToast = useAppStore((s) => s.addToast)

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', url: '', type: 'rss' })
  const [deleteTarget, setDeleteTarget] = useState(null)

  const handleCreate = () => {
    if (!form.name.trim() || !form.url.trim()) return
    createSource.mutate(form, {
      onSuccess: () => {
        addToast({ type: 'success', message: `Fuente "${form.name}" creada` })
        setShowForm(false)
        setForm({ name: '', url: '', type: 'rss' })
      },
      onError: (err) => addToast({ type: 'error', message: `Error: ${err.message}` }),
    })
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
        await createSource.mutateAsync({ name: r.name, url: r.url, type: r.type })
        added++
      } catch {
        failed++
      }
    }
    addToast({
      type: failed > 0 ? 'error' : 'success',
      message: `${added} fuentes añadidas${failed > 0 ? `, ${failed} fallidas` : ''}. Pulsa "Ejecutar todas" para traer ofertas.`,
    })
  }

  const handleRun = (sourceId) => {
    runSources.mutate(sourceId, {
      onSuccess: (data) => {
        if (sourceId) {
          const r = data.sources[0]
          if (r.ok) {
            addToast({ type: 'success', message: `${r.source}: ${r.inserted} nuevas / ${r.fetched} leídas` })
          } else {
            addToast({ type: 'error', message: `${r.source}: ${r.error}` })
          }
        } else {
          const failed = data.sources.filter((s) => !s.ok)
          if (failed.length === 0) {
            const totalNew = data.sources.reduce((acc, s) => acc + (s.inserted || 0), 0)
            addToast({ type: 'success', message: `${data.sources.length} fuentes ejecutadas · ${totalNew} ofertas nuevas` })
          } else {
            addToast({ type: 'error', message: `${failed.length} de ${data.sources.length} fuentes fallaron. Revisa el detalle en la lista.` })
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
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleRun(null)}
            disabled={runSources.isPending || !sources?.length}
          >
            <RefreshCw size={14} className={runSources.isPending ? 'animate-spin' : ''} />
            Ejecutar todas
          </Button>
          <Button size="sm" onClick={() => setShowForm(true)}>
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
            <strong className="text-slate-700">Realidad en 2026 para tu perfil (UX/UI · España):</strong>
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>
              Ningún portal español grande expone RSS público hoy. <strong>Tecnoempleo</strong>, <strong>InfoJobs</strong>, <strong>LinkedIn</strong>, <strong>Indeed</strong> y <strong>Manfred</strong> han retirado o nunca han ofrecido feeds, y bloquean scraping directo.
            </li>
            <li>
              Las opciones recomendadas son tablones internacionales de empleo remoto (<strong>WeWorkRemotely</strong>, <strong>RemoteOK</strong>, <strong>Remotive</strong>). Están en inglés pero muchas ofertas son worldwide y aceptan España.
            </li>
            <li>
              Para portales españoles habría que ir por otra vía (alertas Gmail por IMAP, o autohostear <em>RSSHub</em> para LinkedIn/InfoJobs). Lo dejamos como ampliación futura.
            </li>
          </ul>
          <p className="pt-1">
            Pulsa <em>Añadir recomendadas</em> para preconfigurar las 4 fuentes verificadas. Después borra o ajusta las que no te interesen.
          </p>
        </div>

        {sources && sources.length > 0 ? (
          <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
            {sources.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900">{s.name}</p>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{s.type}</span>
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
                    <RefreshCw size={14} className={runSources.isPending ? 'animate-spin' : ''} />
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
            ))}
          </div>
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

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Nueva fuente de ofertas">
        <div className="space-y-4">
          <Input
            label="Nombre"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Ej: Tecnoempleo - UX"
          />
          <Input
            label="URL del feed"
            value={form.url}
            onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            placeholder="https://..."
          />
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
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={createSource.isPending || !form.name.trim() || !form.url.trim()}>
              {createSource.isPending ? 'Creando...' : 'Crear'}
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

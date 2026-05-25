import { Mail, RefreshCw, CheckCircle2, AlertCircle, Inbox } from 'lucide-react'
import Button from '../ui/Button'
import {
  useEmailIngestStatus,
  useEmailIngestLog,
  usePollEmails,
} from '../../hooks/useJobOffers'
import useAppStore from '../../store/useAppStore'

const PARSER_LABELS = {
  linkedin: 'LinkedIn',
  infojobs: 'InfoJobs',
  manfred: 'Manfred',
  domestika: 'Domestika',
  unmatched: 'Sin parser',
}

export default function EmailIngestSection() {
  const { data: status } = useEmailIngestStatus()
  const { data: log } = useEmailIngestLog(10)
  const pollEmails = usePollEmails()
  const addToast = useAppStore((s) => s.addToast)

  const configured = !!status?.configured

  const handlePoll = () => {
    pollEmails.mutate(undefined, {
      onSuccess: (data) => {
        if (data.fetched === 0) {
          addToast({ type: 'success', message: 'No había correos nuevos' })
          return
        }
        const breakdown = Object.entries(data.byParser || {})
          .map(([p, n]) => `${PARSER_LABELS[p] || p}: ${n}`)
          .join(' · ')
        addToast({
          type: data.errors?.length ? 'error' : 'success',
          message: `${data.fetched} correos · ${data.totalOffers} ofertas nuevas${breakdown ? ' · ' + breakdown : ''}${data.errors?.length ? ` · ${data.errors.length} con error` : ''}`,
        })
      },
      onError: (err) => addToast({ type: 'error', message: `Error: ${err.message}` }),
    })
  }

  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
            <Mail size={20} />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">
            Ingesta por email <span className="text-xs font-normal text-slate-400">(LinkedIn, InfoJobs…)</span>
          </h2>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={handlePoll}
          disabled={!configured || pollEmails.isPending}
        >
          <RefreshCw size={14} className={pollEmails.isPending ? 'animate-spin' : ''} />
          Comprobar emails ahora
        </Button>
      </div>

      <div className="space-y-4 p-6">
        {/* Estado de configuración */}
        {configured ? (
          <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-emerald-900">
                Configurado · {status.user}
              </p>
              <p className="mt-0.5 text-xs text-emerald-700">
                Cron horario: comprueba {status.host}:{status.port} cada hora en punto.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-amber-900">No configurado</p>
              <p className="mt-0.5 text-xs text-amber-800">
                Define las variables de entorno <code className="rounded bg-amber-100 px-1">IMAP_USER</code> y{' '}
                <code className="rounded bg-amber-100 px-1">IMAP_APP_PASSWORD</code> en Netlify y redeploya.
              </p>
            </div>
          </div>
        )}

        {/* Setup instrucciones */}
        <details className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <summary className="cursor-pointer text-sm font-medium text-slate-700">
            ¿Cómo lo configuro? (5 minutos)
          </summary>
          <ol className="mt-3 ml-5 list-decimal space-y-2 text-sm text-slate-600">
            <li>
              Crea una cuenta Gmail dedicada (ej. <code>ofertas.tunombre@gmail.com</code>). Mejor que mezclarlas con tu correo principal.
            </li>
            <li>
              Activa la verificación en dos pasos en{' '}
              <a className="text-primary-600 hover:underline" href="https://myaccount.google.com/security" target="_blank" rel="noreferrer">
                myaccount.google.com/security
              </a>.
            </li>
            <li>
              Genera una "Contraseña de aplicación" en{' '}
              <a className="text-primary-600 hover:underline" href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer">
                myaccount.google.com/apppasswords
              </a>{' '}
              (nombre: "Job CRM").
            </li>
            <li>
              En Netlify (Site settings → Environment variables) añade:
              <ul className="mt-1 ml-5 list-disc text-xs">
                <li><code className="rounded bg-slate-200 px-1">IMAP_USER</code> = tu cuenta Gmail</li>
                <li><code className="rounded bg-slate-200 px-1">IMAP_APP_PASSWORD</code> = los 16 caracteres del app password</li>
              </ul>
            </li>
            <li>
              En LinkedIn / InfoJobs / Manfred / Domestika, configura una <strong>alerta de búsqueda</strong> apuntando a esa cuenta Gmail. Te llegará un email por cada batch de ofertas.
            </li>
            <li>
              Redeploya el sitio en Netlify para que las variables surtan efecto y pulsa "Comprobar emails ahora".
            </li>
          </ol>
        </details>

        {/* Log reciente */}
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <Inbox size={14} />
            Últimos correos procesados
          </h3>
          {!log || log.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-200 px-4 py-3 text-xs text-slate-400">
              No hay correos procesados todavía.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 text-sm">
              {log.map((row) => (
                <div key={row.id} className="flex items-start justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                        {PARSER_LABELS[row.parser] || row.parser || '—'}
                      </span>
                      <span className="truncate text-sm text-slate-800">{row.subject || '(sin asunto)'}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {row.from_addr} · {new Date(row.processed_at).toLocaleString('es-ES')}
                    </p>
                    {row.error && (
                      <p className="mt-0.5 text-xs text-red-600" title={row.error}>
                        ⚠ {row.error.length > 100 ? row.error.slice(0, 100) + '…' : row.error}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right text-xs">
                    {row.error ? (
                      <span className="rounded bg-red-100 px-1.5 py-0.5 text-red-700">error</span>
                    ) : row.parser === 'unmatched' ? (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-700">sin parser</span>
                    ) : (
                      <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-700">
                        +{row.offers_extracted}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

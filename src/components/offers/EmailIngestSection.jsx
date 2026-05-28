import { Mail, RefreshCw, CheckCircle2, AlertCircle, Inbox, RotateCcw } from 'lucide-react'
import Button from '../ui/Button'
import {
  useEmailIngestStatus,
  useEmailIngestLog,
  usePollEmails,
  useReprocessUnmatched,
} from '../../hooks/useJobOffers'
import useAppStore from '../../store/useAppStore'

const PARSER_LABELS = {
  linkedin: 'LinkedIn',
  infojobs: 'InfoJobs',
  tecnoempleo: 'Tecnoempleo',
  manfred: 'Manfred',
  domestika: 'Domestika',
  unmatched: 'Sin parser',
}

export default function EmailIngestSection() {
  const { data: status } = useEmailIngestStatus()
  const { data: log } = useEmailIngestLog(10)
  const pollEmails = usePollEmails()
  const reprocessUnmatched = useReprocessUnmatched()
  const addToast = useAppStore((s) => s.addToast)

  const configured = !!status?.configured
  const hasUnmatched = (log || []).some((row) => row.parser === 'unmatched')

  const handleReprocess = () => {
    reprocessUnmatched.mutate(undefined, {
      onSuccess: (data) => {
        if (data.found === 0) {
          addToast({ type: 'success', message: 'No hay correos sin parser pendientes' })
          return
        }
        addToast({
          type: data.missingInGmail ? 'error' : 'success',
          message: `${data.reopened}/${data.found} correos reabiertos en Gmail · pulsa "Comprobar emails" para reintentar${data.missingInGmail ? ` · ${data.missingInGmail} ya no están en el folder` : ''}`,
        })
      },
      onError: (err) => addToast({ type: 'error', message: `Error: ${err.message}` }),
    })
  }

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
        <div className="flex items-center gap-2">
          {hasUnmatched && (
            <Button
              size="sm"
              variant="secondary"
              onClick={handleReprocess}
              disabled={!configured || reprocessUnmatched.isPending}
              title="Reabre en Gmail los correos sin parser y borra su entrada del log para reintentarlos."
            >
              <RotateCcw size={14} className={reprocessUnmatched.isPending ? 'animate-spin' : ''} />
              Reintentar sin parser
            </Button>
          )}
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
                Polling: {status.host}:{status.port} · carpeta <code className="rounded bg-emerald-100 px-1">{status.folder}</code> · 2 veces al día (≈9:00 y 18:00 hora España).
              </p>
              {status.folder === 'INBOX' && (
                <p className="mt-2 rounded border border-amber-300 bg-amber-50 px-2 py-1.5 text-xs text-amber-800">
                  ⚠ Estás leyendo el INBOX entero. Si esta cuenta también recibe correos personales, configura un label dedicado y setea <code className="rounded bg-amber-100 px-1">IMAP_FOLDER</code> en Netlify para no marcar como leído tu correo normal. Mira las instrucciones de abajo.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-amber-900">No configurado</p>
              <p className="mt-0.5 text-xs text-amber-800">
                Define las variables de entorno <code className="rounded bg-amber-100 px-1">IMAP_USER</code>,{' '}
                <code className="rounded bg-amber-100 px-1">IMAP_APP_PASSWORD</code> y{' '}
                <code className="rounded bg-amber-100 px-1">IMAP_FOLDER</code> en Netlify y redeploya.
              </p>
            </div>
          </div>
        )}

        {/* Setup instrucciones */}
        <details className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3" open={!configured}>
          <summary className="cursor-pointer text-sm font-medium text-slate-700">
            ¿Cómo lo configuro? (10 minutos · usa tu Gmail actual sin tocar el INBOX)
          </summary>
          <div className="mt-3 space-y-4 text-sm text-slate-600">
            <div>
              <p className="font-semibold text-slate-700">1. Credenciales (si ya tienes SMTP funcionando, salta al paso 2)</p>
              <ul className="mt-1 ml-5 list-disc space-y-1 text-xs">
                <li>
                  <strong>Verificación en 2 pasos:</strong> debe estar activa. Compruébalo en{' '}
                  <a className="text-primary-600 hover:underline" href="https://myaccount.google.com/security" target="_blank" rel="noreferrer">myaccount.google.com/security</a>.
                  Si pudiste crear el app password de SMTP, ya está activa.
                </li>
                <li>
                  <strong>App password:</strong> puedes reusar la que ya usas para SMTP. Una app password de Google vale para SMTP e IMAP indistintamente.
                  Si quieres una nueva: <a className="text-primary-600 hover:underline" href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer">myaccount.google.com/apppasswords</a>.
                </li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-slate-700">2. Crear un label dedicado en Gmail</p>
              <p className="mt-1 text-xs">
                Para que el CRM solo lea correos de portales y no marque como leído todo tu Inbox.
              </p>
              <ul className="mt-1 ml-5 list-disc space-y-1 text-xs">
                <li>
                  En Gmail (web) → sidebar izquierdo → <strong>Más → Crear etiqueta nueva</strong>. Nombre: <code className="rounded bg-slate-200 px-1">Ofertas-CRM</code>.
                </li>
                <li>
                  Asegúrate de que IMAP está activado: <a className="text-primary-600 hover:underline" href="https://mail.google.com/mail/u/0/#settings/fwdandpop" target="_blank" rel="noreferrer">Configuración → Reenvío y POP/IMAP → Habilitar IMAP</a>.
                </li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-slate-700">3. Filtros automáticos en Gmail</p>
              <p className="mt-1 text-xs">
                Crear un filtro por cada portal para aplicar la etiqueta automáticamente. En Gmail → barra de búsqueda → flecha desplegable → "Crear filtro".
              </p>
              <ul className="mt-1 ml-5 list-disc space-y-1 text-xs">
                <li>
                  <strong>LinkedIn:</strong> en <em>De</em>: <code className="rounded bg-slate-200 px-1">jobs-noreply@linkedin.com OR jobalerts-noreply@linkedin.com</code>
                </li>
                <li>
                  <strong>InfoJobs:</strong> <code className="rounded bg-slate-200 px-1">@infojobs.net</code>
                </li>
                <li>
                  <strong>Tecnoempleo:</strong> <code className="rounded bg-slate-200 px-1">@tecnoempleo.com</code>
                </li>
                <li>
                  <strong>Manfred:</strong> <code className="rounded bg-slate-200 px-1">@getmanfred.com</code>
                </li>
                <li>
                  <strong>Domestika:</strong> <code className="rounded bg-slate-200 px-1">@domestika.org</code>
                </li>
              </ul>
              <p className="mt-2 text-xs">
                En cada filtro marca <strong>"Aplicar etiqueta: Ofertas-CRM"</strong>. Opcionalmente <strong>"Saltar Recibidos"</strong> si no quieres verlos también en el Inbox.
              </p>
            </div>

            <div>
              <p className="font-semibold text-slate-700">4. Variables de entorno en Netlify</p>
              <p className="mt-1 text-xs">Site settings → Environment variables. Añade:</p>
              <ul className="mt-1 ml-5 list-disc space-y-1 text-xs">
                <li><code className="rounded bg-slate-200 px-1">IMAP_USER</code> = damianmartinmayedo@gmail.com</li>
                <li><code className="rounded bg-slate-200 px-1">IMAP_APP_PASSWORD</code> = el mismo app password de SMTP (16 chars)</li>
                <li><code className="rounded bg-slate-200 px-1">IMAP_FOLDER</code> = <code className="rounded bg-slate-200 px-1">Ofertas-CRM</code></li>
              </ul>
              <p className="mt-1 text-xs">
                Tras añadirlas, dispara un redeploy (Deploys → Trigger deploy).
              </p>
            </div>

            <div>
              <p className="font-semibold text-slate-700">5. Configurar alertas en cada portal</p>
              <p className="mt-1 text-xs">
                Ya con todo enchufado: en LinkedIn / InfoJobs / Manfred / Domestika configura una alerta de búsqueda apuntando a tu Gmail. Te llegará un email por cada batch. Pulsa "Comprobar emails ahora" para ver los primeros resultados.
              </p>
            </div>
          </div>
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

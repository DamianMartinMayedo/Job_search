import { Envelope, ArrowsClockwise, CheckCircle, Warning, Tray, ArrowCounterClockwise } from '@phosphor-icons/react'
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
  const dismissLoadingToast = useAppStore((s) => s.dismissLoadingToast)

  const configured = !!status?.configured
  const hasUnmatched = (log || []).some((row) => row.parser === 'unmatched')

  const handleReprocess = () => {
    addToast({ type: 'loading', message: 'Reprocesando correos...' })
    reprocessUnmatched.mutate(undefined, {
      onSuccess: (data) => {
        dismissLoadingToast()
        if (data.found === 0) { addToast({ type: 'success', message: 'No hay correos sin parser pendientes' }); return }
        addToast({
          type: data.missingInGmail ? 'error' : 'success',
          message: `${data.reopened}/${data.found} correos reabiertos en Gmail · pulsa "Comprobar emails" para reintentar${data.missingInGmail ? ` · ${data.missingInGmail} ya no están en el folder` : ''}`,
        })
      },
      onError: (err) => {
        dismissLoadingToast()
        addToast({ type: 'error', message: `Error: ${err.message}` })
      },
    })
  }

  const handlePoll = () => {
    addToast({ type: 'loading', message: 'Comprobando emails...' })
    pollEmails.mutate(undefined, {
      onSuccess: (data) => {
        dismissLoadingToast()
        if (data.fetched === 0) { addToast({ type: 'success', message: 'No había correos nuevos' }); return }
        const breakdown = Object.entries(data.byParser || {}).map(([p, n]) => `${PARSER_LABELS[p] || p}: ${n}`).join(' · ')
        addToast({
          type: data.errors?.length ? 'error' : 'success',
          message: `${data.fetched} correos · ${data.totalOffers} ofertas nuevas${breakdown ? ' · ' + breakdown : ''}${data.errors?.length ? ` · ${data.errors.length} con error` : ''}`,
        })
      },
      onError: (err) => {
        dismissLoadingToast()
        addToast({ type: 'error', message: `Error: ${err.message}` })
      },
    })
  }

  return (
    <div className="mt-6 rounded-lg border border-[#EAEAEA] bg-white">
      <div className="flex items-center justify-between border-b border-[#EAEAEA] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-[#E1F3FE] p-2 text-[#1F6C9F]">
            <Envelope size={20} weight="regular" />
          </div>
          <h2 className="text-base font-semibold text-[#111111] tracking-[-0.01em]">
            Ingesta por email <span className="text-xs font-normal text-[#ABABAB]">(LinkedIn, InfoJobs…)</span>
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {hasUnmatched && (
            <Button size="sm" variant="secondary" onClick={handleReprocess} disabled={!configured || reprocessUnmatched.isPending}>
              <ArrowCounterClockwise size={14} weight="bold" className={reprocessUnmatched.isPending ? 'animate-spin' : ''} />
              Reintentar sin parser
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={handlePoll} disabled={!configured || pollEmails.isPending}>
            <ArrowsClockwise size={14} weight="bold" className={pollEmails.isPending ? 'animate-spin' : ''} />
            Comprobar emails ahora
          </Button>
        </div>
      </div>

      <div className="space-y-4 p-6">
        {configured ? (
          <div className="flex items-start gap-3 rounded-lg border border-[#C5DCC4] bg-[#EDF3EC] px-4 py-3">
            <CheckCircle size={18} weight="bold" className="mt-0.5 shrink-0 text-[#346538]" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-[#346538]">Configurado · {status.user}</p>
              <p className="mt-0.5 text-xs text-[#346538]/80">
                Polling: {status.host}:{status.port} · carpeta <code className="rounded bg-[#EDF3EC] px-1">{status.folder}</code> · 2 veces al día (≈9:00 y 18:00 hora España).
              </p>
              {status.folder === 'INBOX' && (
                <p className="mt-2 rounded border border-[#F0E0A8] bg-[#FBF3DB] px-2 py-1.5 text-xs text-[#956400]">
                  ⚠ Estás leyendo el INBOX entero. Si esta cuenta también recibe correos personales, configura un label dedicado y setea <code className="rounded bg-[#F0E0A8] px-1">IMAP_FOLDER</code> en Netlify. Mira las instrucciones de abajo.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-lg border border-[#F0E0A8] bg-[#FBF3DB] px-4 py-3">
            <Warning size={18} weight="bold" className="mt-0.5 shrink-0 text-[#956400]" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-[#956400]">No configurado</p>
              <p className="mt-0.5 text-xs text-[#956400]/80">
                Define las variables de entorno <code className="rounded bg-[#F0E0A8] px-1">IMAP_USER</code>,{' '}
                <code className="rounded bg-[#F0E0A8] px-1">IMAP_APP_PASSWORD</code> y{' '}
                <code className="rounded bg-[#F0E0A8] px-1">IMAP_FOLDER</code> en Netlify y redeploya.
              </p>
            </div>
          </div>
        )}

        <details className="rounded-lg border border-[#EAEAEA] bg-[#F7F6F3] px-4 py-3" open={!configured}>
          <summary className="cursor-pointer text-sm font-medium text-[#2F3437]">
            ¿Cómo lo configuro? (10 minutos · usa tu Gmail actual sin tocar el INBOX)
          </summary>
          <div className="mt-3 space-y-4 text-sm text-[#2F3437]">
            <div>
              <p className="font-semibold text-[#111111]">1. Credenciales (si ya tienes SMTP funcionando, salta al paso 2)</p>
              <ul className="mt-1 ml-5 list-disc space-y-1 text-xs">
                <li><strong>Verificación en 2 pasos:</strong> debe estar activa. <a className="text-[#111111] hover:underline" href="https://myaccount.google.com/security" target="_blank" rel="noreferrer">myaccount.google.com/security</a>.</li>
                <li><strong>App password:</strong> <a className="text-[#111111] hover:underline" href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer">myaccount.google.com/apppasswords</a>.</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-[#111111]">2. Crear un label dedicado en Gmail</p>
              <ul className="mt-1 ml-5 list-disc space-y-1 text-xs">
                <li>Gmail → sidebar → <strong>Más → Crear etiqueta nueva</strong>. Nombre: <code className="rounded bg-[#EAEAEA] px-1">Ofertas-CRM</code>.</li>
                <li>Activa IMAP: <a className="text-[#111111] hover:underline" href="https://mail.google.com/mail/u/0/#settings/fwdandpop" target="_blank" rel="noreferrer">Configuración → Reenvío y POP/IMAP → Habilitar IMAP</a>.</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-[#111111]">3. Filtros automáticos en Gmail</p>
              <ul className="mt-1 ml-5 list-disc space-y-1 text-xs">
                <li><strong>LinkedIn:</strong> <code className="rounded bg-[#EAEAEA] px-1">jobs-noreply@linkedin.com OR jobalerts-noreply@linkedin.com</code></li>
                <li><strong>InfoJobs:</strong> <code className="rounded bg-[#EAEAEA] px-1">@infojobs.net</code></li>
                <li><strong>Manfred:</strong> <code className="rounded bg-[#EAEAEA] px-1">@getmanfred.com</code></li>
                <li><strong>Domestika:</strong> <code className="rounded bg-[#EAEAEA] px-1">@domestika.org</code></li>
              </ul>
              <p className="mt-2 text-xs">En cada filtro marca <strong>Aplicar etiqueta: Ofertas-CRM</strong>.</p>
            </div>
            <div>
              <p className="font-semibold text-[#111111]">4. Variables de entorno en Netlify</p>
              <ul className="mt-1 ml-5 list-disc space-y-1 text-xs">
                <li><code className="rounded bg-[#EAEAEA] px-1">IMAP_USER</code> = tu@gmail.com</li>
                <li><code className="rounded bg-[#EAEAEA] px-1">IMAP_APP_PASSWORD</code> = el app password (16 chars)</li>
                <li><code className="rounded bg-[#EAEAEA] px-1">IMAP_FOLDER</code> = <code className="rounded bg-[#EAEAEA] px-1">Ofertas-CRM</code></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-[#111111]">5. Configurar alertas en cada portal</p>
              <p className="mt-1 text-xs">Configura alertas en LinkedIn / InfoJobs / Manfred / Domestika apuntando a tu Gmail.</p>
            </div>
          </div>
        </details>

        <div>
          <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.04em] text-[#787774]">
            <Tray size={14} weight="bold" />
            Últimos correos procesados
          </h3>
          {!log || log.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[#EAEAEA] px-4 py-3 text-xs text-[#ABABAB]">No hay correos procesados todavía.</p>
          ) : (
            <div className="divide-y divide-[#EAEAEA] rounded-lg border border-[#EAEAEA] text-sm">
              {log.map((row) => (
                <div key={row.id} className="flex items-start justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-[#F7F6F3] px-1.5 py-0.5 text-xs text-[#787774]">{PARSER_LABELS[row.parser] || row.parser || '—'}</span>
                      <span className="truncate text-sm text-[#111111]">{row.subject || '(sin asunto)'}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-[#787774]">{row.from_addr} · {new Date(row.processed_at).toLocaleString('es-ES')}</p>
                    {row.error && <p className="mt-0.5 text-xs text-[#9F2F2D]" title={row.error}>⚠ {row.error.length > 100 ? row.error.slice(0, 100) + '…' : row.error}</p>}
                  </div>
                  <div className="shrink-0 text-right text-xs">
                    {row.error ? (
                      <span className="rounded-full bg-[#FDEBEC] px-1.5 py-0.5 text-[#9F2F2D]">error</span>
                    ) : row.parser === 'unmatched' ? (
                      <span className="rounded-full bg-[#FBF3DB] px-1.5 py-0.5 text-[#956400]">sin parser</span>
                    ) : (
                      <span className="rounded-full bg-[#EDF3EC] px-1.5 py-0.5 text-[#346538]">+{row.offers_extracted}</span>
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

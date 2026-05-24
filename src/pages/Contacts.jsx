import { Users, Copy, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import { SkeletonRow } from '../components/ui/Skeleton'
import { useAllContacts } from '../hooks/useContacts'
import { ROLE_TYPES_MAP } from '../utils/constants'
import useAppStore from '../store/useAppStore'

export default function Contacts() {
  const { data: contacts, isLoading } = useAllContacts()
  const addToast = useAppStore((s) => s.addToast)

  const handleCopyEmail = (email) => {
    navigator.clipboard.writeText(email).catch(() => {
      addToast({ type: 'error', message: 'Error al copiar email' })
    })
    addToast({ type: 'success', message: 'Email copiado' })
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonRow key={i} columns={5} />
        ))}
      </div>
    )
  }

  if (!contacts || contacts.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Sin contactos"
        description="Añade contactos desde la página de detalle de cada empresa"
      />
    )
  }

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Contactos</h1>
        <p className="mt-1 text-sm text-slate-500">
          {contacts.length} contactos
        </p>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="hidden grid-cols-12 gap-4 border-b border-slate-200 px-6 py-3 text-xs font-medium uppercase tracking-wider text-slate-500 md:grid">
          <div className="col-span-3">Nombre</div>
          <div className="col-span-2">Empresa</div>
          <div className="col-span-2">Rol</div>
          <div className="col-span-3">Email</div>
          <div className="col-span-2 text-right">Acciones</div>
        </div>

        {contacts.map((c) => (
          <div
            key={c.id}
            className="grid grid-cols-1 gap-2 border-b border-slate-100 px-6 py-4 last:border-b-0 hover:bg-slate-50 md:grid-cols-12 md:items-center md:gap-4"
          >
            <div className="col-span-3">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-slate-900">
                  {c.first_name} {c.last_name}
                </p>
                {c.is_primary && (
                  <Badge className="bg-primary-100 text-primary-700 border-primary-200 text-[10px]">
                    Principal
                  </Badge>
                )}
              </div>
            </div>
            <div className="col-span-2">
              <Link
                to={`/app/companies/${c.company_id}`}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                {c.company_name}
              </Link>
            </div>
            <div className="col-span-2 text-sm text-slate-600">
              {ROLE_TYPES_MAP[c.role_type] || c.role || '—'}
            </div>
            <div className="col-span-3 text-sm text-slate-600">
              {c.email || '—'}
            </div>
            <div className="col-span-2 flex justify-end gap-2">
              {c.email && (
                <button
                  onClick={() => handleCopyEmail(c.email)}
                  className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                  title="Copiar email"
                >
                  <Copy size={14} />
                </button>
              )}
              {c.linkedin_url && (
                <a
                  href={c.linkedin_url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                  title="LinkedIn"
                >
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

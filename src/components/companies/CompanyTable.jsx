import { Link } from 'react-router-dom'
import { Building2, ExternalLink, Trash2 } from 'lucide-react'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import EmptyState from '../ui/EmptyState'
import { SkeletonRow } from '../ui/Skeleton'
import { COMPANY_STATUS_MAP } from '../../utils/constants'
import { useDeleteCompany } from '../../hooks/useCompanies'
import useAppStore from '../../store/useAppStore'

export default function CompanyTable({ companies, isLoading }) {
  const deleteCompany = useDeleteCompany()
  const addToast = useAppStore((s) => s.addToast)

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonRow key={i} columns={5} />
        ))}
      </div>
    )
  }

  if (!companies || companies.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="No hay empresas"
        description="Busca empresas con Google Places o añade una manualmente"
      />
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="hidden grid-cols-12 gap-4 border-b border-slate-200 px-6 py-3 text-xs font-medium uppercase tracking-wider text-slate-500 md:grid">
        <div className="col-span-4">Empresa</div>
        <div className="col-span-2">Sector</div>
        <div className="col-span-2">Ciudad</div>
        <div className="col-span-2">Estado</div>
        <div className="col-span-2 text-right">Acciones</div>
      </div>

      {companies.map((company) => {
        const status = COMPANY_STATUS_MAP[company.status] || COMPANY_STATUS_MAP.new
        return (
          <div
            key={company.id}
            className="grid grid-cols-1 gap-2 border-b border-slate-100 px-6 py-4 last:border-b-0 hover:bg-slate-50 md:grid-cols-12 md:items-center md:gap-4"
          >
            <div className="col-span-4">
              <Link
                to={`/app/companies/${company.id}`}
                className="text-sm font-medium text-slate-900 hover:text-primary-600"
              >
                {company.name}
              </Link>
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-primary-500"
                >
                  <ExternalLink size={12} />
                  {company.domain}
                </a>
              )}
            </div>
            <div className="col-span-2 text-sm text-slate-600">
              {company.sector || '—'}
            </div>
            <div className="col-span-2 text-sm text-slate-600">
              {company.city || '—'}
            </div>
            <div className="col-span-2">
              <Badge className={status.color}>{status.label}</Badge>
            </div>
            <div className="col-span-2 flex justify-end gap-2">
              <Link
                to={`/app/companies/${company.id}`}
                className="text-xs text-slate-400 hover:text-primary-600"
              >
                Ver
              </Link>
              <button
                onClick={() => {
                  if (confirm(`¿Eliminar ${company.name}?`)) {
                    deleteCompany.mutate(company.id, {
                      onSuccess: () =>
                        addToast({
                          type: 'success',
                          message: `${company.name} eliminada`,
                        }),
                    })
                  }
                }}
                className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 cursor-pointer"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

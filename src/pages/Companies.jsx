import { useState, useEffect } from 'react'
import { Plus, Search, X } from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import CompanyTable from '../components/companies/CompanyTable'
import Pagination from '../components/ui/Pagination'
import GoogleSearchModal from '../components/companies/GoogleSearchModal'
import CompanyForm from '../components/companies/CompanyForm'
import {
  useCompanies,
  useCreateCompany,
  useUpdateCompany,
} from '../hooks/useCompanies'
import { useSettings } from '../hooks/useSettings'
import { COMPANY_STATUS, SECTORS } from '../utils/constants'
import useAppStore from '../store/useAppStore'

export default function Companies() {
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState(null)

  const filters = useAppStore((s) => s.companyFilters)
  const setFilter = useAppStore((s) => s.setCompanyFilter)
  const clearFilters = useAppStore((s) => s.clearCompanyFilters)
  const addToast = useAppStore((s) => s.addToast)

  const [sort, setSort] = useState({ field: 'created_at', dir: 'DESC' })
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  useEffect(() => {
    setPage(1)
  }, [filters.status, filters.sector, filters.city, filters.search, limit])

  const queryFilters = {
    ...filters,
    sortBy: sort.field,
    sortDir: sort.dir,
    page,
    limit,
  }

  const { data, isLoading } = useCompanies(queryFilters)
  const companies = data?.companies || []
  const total = data?.total || 0
  const { data: settings } = useSettings()
  const createCompany = useCreateCompany()
  const updateCompany = useUpdateCompany()

  const customSectors = Array.isArray(settings?.custom_sectors) ? settings.custom_sectors : []
  const allSectors = [...SECTORS.filter((s) => s !== 'Otro'), ...customSectors]

  const hasActiveFilters =
    filters.status || filters.sector || filters.city || filters.search

  const handleSort = (field) => {
    setSort((prev) => ({
      field,
      dir: prev.field === field && prev.dir === 'DESC' ? 'ASC' : 'DESC',
    }))
  }

  const handleCreate = async (data) => {
    try {
      await createCompany.mutateAsync(data)
      setFormModalOpen(false)
      addToast({ type: 'success', message: `${data.name} añadida` })
    } catch (err) {
      addToast({ type: 'error', message: err.message })
    }
  }

  const handleUpdate = async (data) => {
    try {
      await updateCompany.mutateAsync({ id: editingCompany.id, data })
      setFormModalOpen(false)
      setEditingCompany(null)
      addToast({ type: 'success', message: `${data.name} actualizada` })
    } catch (err) {
      addToast({ type: 'error', message: err.message })
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Empresas</h1>
          <p className="mt-1 text-sm text-slate-500">
            {total} empresas
            {hasActiveFilters && ' (filtradas)'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setFormModalOpen(true)}>
            <Plus size={18} />
            Añadir
          </Button>
          <Button onClick={() => setSearchModalOpen(true)}>
            <Search size={18} />
            Buscar empresas
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <div className="flex-1 min-w-48">
          <Input
            placeholder="Buscar por nombre o dominio..."
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
          />
        </div>

        <select
          value={filters.status}
          onChange={(e) => setFilter('status', e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-hidden"
        >
          <option value="">Todos los estados</option>
          {COMPANY_STATUS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <select
          value={filters.sector}
          onChange={(e) => setFilter('sector', e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-hidden"
        >
          <option value="">Todos los sectores</option>
          {allSectors.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 cursor-pointer"
          >
            <X size={16} />
            Limpiar
          </button>
        )}
      </div>

      <div className="mt-4">
        <CompanyTable
          companies={companies}
          isLoading={isLoading}
          sort={sort}
          onSort={handleSort}
        />

        {!isLoading && (
          <Pagination
            page={page}
            total={total}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={setLimit}
            label="empresas"
          />
        )}
      </div>

      <GoogleSearchModal
        open={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        customSectors={customSectors}
      />

      <CompanyForm
        open={formModalOpen}
        onClose={() => {
          setFormModalOpen(false)
          setEditingCompany(null)
        }}
        company={editingCompany}
        onSubmit={editingCompany ? handleUpdate : handleCreate}
        isSubmitting={createCompany.isPending || updateCompany.isPending}
        allSectors={allSectors}
      />
    </div>
  )
}

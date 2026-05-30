import { useState, useEffect, useMemo } from 'react'
import { MagnifyingGlass, Buildings, X } from '@phosphor-icons/react'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import { useCompanies } from '../../hooks/useCompanies'
import EmailComposer from './EmailComposer'

export default function GlobalEmailComposer({ open, onClose, onSubmit, isSubmitting }) {
  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [search, setSearch] = useState('')
  const [step, setStep] = useState('select-company')
  const { data: companiesData } = useCompanies({ page: 1, limit: 100 })
  const companies = companiesData?.companies || []

  useEffect(() => {
    if (open) {
      setSelectedCompanyId('')
      setSearch('')
      setStep('select-company')
    }
  }, [open])

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId)

  const filteredCompanies = useMemo(() => {
    if (!search.trim()) return companies.slice(0, 20)
    const q = search.toLowerCase()
    return companies.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.sector?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
    ).slice(0, 20)
  }, [companies, search])

  const handleCompanySelect = (companyId) => {
    setSelectedCompanyId(companyId)
    setStep('compose')
  }

  const handleClose = () => {
    setSelectedCompanyId('')
    setSearch('')
    setStep('select-company')
    onClose()
  }

  if (step === 'select-company') {
    return (
      <Modal open={open} onClose={handleClose} title="Nuevo mensaje" size="md">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <MagnifyingGlass size={16} weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ABABAB]" />
            <input
              type="text"
              placeholder="Buscar empresa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-[#EAEAEA] bg-white pl-9 pr-3 py-2 text-sm text-[#111111] placeholder:text-[#ABABAB] focus:border-[#111111] focus:ring-2 focus:ring-black/5 focus:outline-hidden transition-colors"
              autoFocus
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#ABABAB] hover:text-[#111111] cursor-pointer transition-colors"
              >
                <X size={14} weight="bold" />
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto flex flex-col gap-1">
            {filteredCompanies.length === 0 ? (
              <p className="py-6 text-center text-sm text-[#ABABAB]">
                {search ? 'No se encontraron empresas' : 'No hay empresas disponibles'}
              </p>
            ) : (
              filteredCompanies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => handleCompanySelect(company.id)}
                  className="flex items-center gap-3 rounded-lg border border-[#EAEAEA] bg-white px-3 py-2.5 text-left transition-colors hover:bg-[#F7F6F3] hover:border-[#D0D0D0] cursor-pointer"
                >
                  <Buildings size={18} weight="regular" className="text-[#ABABAB] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#111111] truncate">{company.name}</p>
                    {company.sector && (
                      <p className="text-xs text-[#787774] truncate">{company.sector}</p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <EmailComposer
      open={step === 'compose' && open}
      onClose={handleClose}
      company={selectedCompany}
      contacts={[]}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
    />
  )
}

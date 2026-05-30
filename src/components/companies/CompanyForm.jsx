import { useState, useEffect } from 'react'

import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { SECTORS, SOURCES } from '../../utils/constants'

export default function CompanyForm({
  open,
  onClose,
  company,
  onSubmit,
  isSubmitting,
  allSectors,
}) {
  const [form, setForm] = useState({
    name: '',
    domain: '',
    website: '',
    my_role: '',
    sector: '',
    city: '',
    region: '',
    country: 'España',
    phone: '',
    linkedin_url: '',
    source: 'manual',
    interest_level: 3,
  })

  useEffect(() => {
    if (company) {
      setForm({
        name: company.name || '',
        domain: company.domain || '',
        website: company.website || '',
        my_role: company.my_role || '',
        sector: company.sector || '',
        city: company.city || '',
        region: company.region || '',
        country: company.country || 'España',
        phone: company.phone || '',
        linkedin_url: company.linkedin_url || '',
        source: company.source || 'manual',
        interest_level: company.interest_level || 3,
      })
    } else {
      setForm({
        name: '',
        domain: '',
        website: '',
        my_role: '',
        sector: '',
        city: '',
        region: '',
        country: 'España',
        phone: '',
        linkedin_url: '',
        source: 'manual',
        interest_level: 3,
      })
    }
  }, [company, open])

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    onSubmit(form)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={company ? 'Editar empresa' : 'Añadir empresa manualmente'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nombre *"
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Dominio"
            placeholder="ejemplo.com"
            value={form.domain}
            onChange={(e) => handleChange('domain', e.target.value)}
          />
          <Input
            label="Website"
            type="url"
            placeholder="https://..."
            value={form.website}
            onChange={(e) => handleChange('website', e.target.value)}
          />
        </div>

        <Input
          label="Mi rol en esta empresa (para plantillas)"
          placeholder="diseñador UI/UX y diseño digital"
          value={form.my_role}
          onChange={(e) => handleChange('my_role', e.target.value)}
        />

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#2F3437]">Sector</label>
            <select
              value={form.sector}
              onChange={(e) => handleChange('sector', e.target.value)}
              className="rounded-lg border border-[#EAEAEA] bg-white px-3 py-2 text-sm text-[#111111] focus:border-[#111111] focus:ring-2 focus:ring-black/5 focus:outline-hidden transition-colors"
            >
              <option value="">Seleccionar...</option>
              {(allSectors || SECTORS).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#2F3437]">
              Fuente
            </label>
            <select
              value={form.source}
              onChange={(e) => handleChange('source', e.target.value)}
              className="rounded-lg border border-[#EAEAEA] bg-white px-3 py-2 text-sm text-[#111111] focus:border-[#111111] focus:ring-2 focus:ring-black/5 focus:outline-hidden transition-colors"
            >
              {SOURCES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Ciudad"
            value={form.city}
            onChange={(e) => handleChange('city', e.target.value)}
          />
          <Input
            label="Región"
            value={form.region}
            onChange={(e) => handleChange('region', e.target.value)}
          />
          <Input
            label="País"
            value={form.country}
            onChange={(e) => handleChange('country', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Teléfono"
            value={form.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
          />
          <Input
            label="LinkedIn URL"
            value={form.linkedin_url}
            onChange={(e) => handleChange('linkedin_url', e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#2F3437]">
            Interés: {form.interest_level}/5
          </label>
          <input
            type="range"
            min="1"
            max="5"
            value={form.interest_level}
            onChange={(e) => handleChange('interest_level', +e.target.value)}
            className="w-full accent-[#111111]"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting || !form.name.trim()}>
            {isSubmitting ? 'Guardando...' : company ? 'Actualizar' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

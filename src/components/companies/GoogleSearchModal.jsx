import { useState, useEffect } from 'react'
import { Search, Plus, Loader2, Check } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { searchPlaces } from '../../lib/googlePlaces'
import { useCreateCompany } from '../../hooks/useCompanies'
import { SECTORS } from '../../utils/constants'
import useAppStore from '../../store/useAppStore'

export default function GoogleSearchModal({ open, onClose }) {
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('')
  const [sector, setSector] = useState('')
  const [customSector, setCustomSector] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [adding, setAdding] = useState(false)

  const createCompany = useCreateCompany()
  const addToast = useAppStore((s) => s.addToast)

  const showCustomInput = sector === 'Otro'

  const handleSearch = async () => {
    const searchQuery = showCustomInput ? customSector : sector
    if (!searchQuery || !city) return
    setSearching(true)
    setResults([])
    setSelected(new Set())
    try {
      const places = await searchPlaces(searchQuery, city)
      setResults(places)
      setSelected(new Set(places.map((_, i) => i)))
    } catch (err) {
      addToast({ type: 'error', message: err.message })
    } finally {
      setSearching(false)
    }
  }

  const toggleSelect = (index) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const selectAll = () => {
    if (selected.size === results.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(results.map((_, i) => i)))
    }
  }

  const handleAddSelected = async () => {
    const toAdd = results.filter((_, i) => selected.has(i))
    if (toAdd.length === 0) return

    setAdding(true)
    let added = 0
    let skipped = 0
    const errors = []

    const finalSector = showCustomInput ? customSector : sector

    for (const place of toAdd) {
      const domain = place.website
        ? place.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]
        : ''
      try {
        await createCompany.mutateAsync({
          name: place.name,
          domain,
          website: place.website,
          sector: finalSector,
          city: city,
          phone: place.phone,
          source: 'google_places',
        })
        added++
      } catch (err) {
        if (err.message.includes('dominio')) {
          skipped++
        } else {
          errors.push(place.name)
        }
      }
    }

    if (added > 0) {
      addToast({
        type: 'success',
        message: `${added} empresa${added > 1 ? 's' : ''} añadida${added > 1 ? 's' : ''}`,
      })
    }
    if (skipped > 0) {
      addToast({
        type: 'warning',
        message: `${skipped} ya existía${skipped > 1 ? 'n' : ''} (mismo dominio)`,
      })
    }
    if (errors.length > 0) {
      addToast({
        type: 'error',
        message: `Error al añadir: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}`,
      })
    }

    setAdding(false)
    setResults([])
    setSelected(new Set())
    onClose()
  }

  const handleClose = () => {
    setResults([])
    setSelected(new Set())
    onClose()
  }

  const selectedCount = selected.size

  return (
    <Modal open={open} onClose={handleClose} title="Buscar empresas" size="lg">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Sector</label>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-hidden"
            >
              <option value="">Seleccionar...</option>
              {SECTORS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <Input
              label="Ciudad"
              placeholder="Sevilla, Madrid..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
        </div>

        {showCustomInput && (
          <Input
            label="Escribe el sector"
            placeholder="ej: Agencia de branding"
            value={customSector}
            onChange={(e) => setCustomSector(e.target.value)}
          />
        )}

        <Button
          onClick={handleSearch}
          disabled={searching || !city || (!showCustomInput && !sector) || (showCustomInput && !customSector)}
        >
          {searching ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Buscando...
            </>
          ) : (
            <>
              <Search size={18} />
              Buscar
            </>
          )}
        </Button>

        {results.length === 0 && !searching && (
          <p className="text-center text-sm text-slate-400">
            Selecciona un sector y una ciudad para buscar
          </p>
        )}

        {results.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <button
                onClick={selectAll}
                className="text-sm text-primary-600 hover:text-primary-700 cursor-pointer"
              >
                {selectedCount === results.length
                  ? 'Deseleccionar todas'
                  : 'Seleccionar todas'}
              </button>
              <span className="text-sm text-slate-500">
                {selectedCount} de {results.length} seleccionadas
              </span>
            </div>

            <div className="max-h-80 overflow-y-auto rounded-lg border border-slate-200">
              {results.map((place, i) => {
                const isSelected = selected.has(i)
                return (
                  <label
                    key={i}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer ${
                      i !== 0 ? 'border-t border-slate-100' : ''
                    } ${isSelected ? 'bg-primary-50/50' : 'hover:bg-slate-50'}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(i)}
                      className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {place.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {place.address}
                      </p>
                    </div>
                    {isSelected && (
                      <Check size={16} className="text-primary-500 shrink-0" />
                    )}
                  </label>
                )
              })}
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                onClick={handleAddSelected}
                disabled={adding || selectedCount === 0}
              >
                {adding ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Añadiendo...
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    Añadir {selectedCount} empresa{selectedCount !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

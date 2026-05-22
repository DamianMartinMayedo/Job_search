import { useState } from 'react'
import { Search, Plus, Loader2 } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { searchPlaces } from '../../lib/googlePlaces'
import { useCreateCompany } from '../../hooks/useCompanies'
import useAppStore from '../../store/useAppStore'

export default function GoogleSearchModal({ open, onClose }) {
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [saved, setSaved] = useState(new Set())

  const createCompany = useCreateCompany()
  const addToast = useAppStore((s) => s.addToast)

  const handleSearch = async () => {
    if (!query || !city) return
    setSearching(true)
    setResults([])
    try {
      const places = await searchPlaces(query, city)
      setResults(places)
    } catch (err) {
      addToast({ type: 'error', message: err.message })
    } finally {
      setSearching(false)
    }
  }

  const handleSave = async (place) => {
    if (saved.has(place.name)) return
    try {
      const domain = place.website
        ? place.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]
        : ''
      await createCompany.mutateAsync({
        name: place.name,
        domain,
        website: place.website,
        city: city,
        phone: place.phone,
        source: 'google_places',
      })
      setSaved((s) => new Set(s).add(place.name))
      addToast({ type: 'success', message: `${place.name} añadida` })
    } catch (err) {
      if (err.message.includes('dominio')) {
        addToast({ type: 'warning', message: 'Ya existe esta empresa' })
      } else {
        addToast({ type: 'error', message: err.message })
      }
    }
  }

  const handleClose = () => {
    setResults([])
    setSaved(new Set())
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Buscar empresas" size="lg">
      <div className="flex flex-col gap-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              label="Tipo de empresa"
              placeholder="estudio de diseño, consultora IT..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
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
        <Button onClick={handleSearch} disabled={searching || !query || !city}>
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
            Escribe un tipo de empresa y una ciudad para buscar
          </p>
        )}

        {results.length > 0 && (
          <div className="max-h-80 overflow-y-auto rounded-lg border border-slate-200">
            {results.map((place, i) => {
              const isSaved = saved.has(place.name)
              return (
                <div
                  key={i}
                  className={`flex items-center justify-between gap-4 px-4 py-3 ${
                    i !== 0 ? 'border-t border-slate-100' : ''
                  } ${isSaved ? 'bg-green-50' : ''}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {place.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {place.address}
                    </p>
                  </div>
                  <Button
                    variant={isSaved ? 'ghost' : 'primary'}
                    size="sm"
                    onClick={() => handleSave(place)}
                    disabled={isSaved || createCompany.isPending}
                    className="shrink-0"
                  >
                    {isSaved ? (
                      'Añadida'
                    ) : (
                      <>
                        <Plus size={16} />
                        Añadir
                      </>
                    )}
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Modal>
  )
}

import { api } from '../lib/api'

export async function searchPlaces(query, city) {
  const data = await api.post('/places/search', { query, city })
  return (data.places || []).map((place) => ({
    name: place.displayName?.text || place.displayName || 'Sin nombre',
    website: place.websiteUri || '',
    address: place.formattedAddress || '',
    phone: place.nationalPhoneNumber || '',
  }))
}

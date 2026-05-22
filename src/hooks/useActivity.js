import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useActivity(limit = 20) {
  return useQuery({
    queryKey: ['activity', limit],
    queryFn: () => api.get(`/activity?limit=${limit}`),
  })
}

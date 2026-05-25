import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/dashboard/stats'),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  })
}

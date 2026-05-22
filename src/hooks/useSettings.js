import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings'),
  })
}

export function useSaveSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.post('/settings', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  })
}

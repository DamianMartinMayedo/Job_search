import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useJobOffers(filters = {}) {
  return useQuery({
    queryKey: ['job-offers', filters],
    queryFn: () => {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') params.set(k, v)
      })
      const qs = params.toString()
      return api.get(`/job-offers${qs ? '?' + qs : ''}`)
    },
  })
}

export function useUpdateJobOffer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => api.patch(`/job-offers/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['job-offers'] }),
  })
}

export function useDeleteJobOffer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`/job-offers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['job-offers'] }),
  })
}

export function useJobSources() {
  return useQuery({
    queryKey: ['job-sources'],
    queryFn: () => api.get('/job-sources'),
  })
}

export function useCreateJobSource() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.post('/job-sources', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['job-sources'] }),
  })
}

export function useDeleteJobSource() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`/job-sources/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['job-sources'] })
      qc.invalidateQueries({ queryKey: ['job-offers'] })
    },
  })
}

export function useRunSources() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sourceId) => api.post('/job-sources/run-now', sourceId ? { source_id: sourceId } : {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['job-offers'] })
      qc.invalidateQueries({ queryKey: ['job-sources'] })
    },
  })
}

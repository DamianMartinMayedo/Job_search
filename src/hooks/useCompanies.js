import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useCompanies(filters = {}) {
  return useQuery({
    queryKey: ['companies', filters],
    queryFn: () => {
      const params = new URLSearchParams()
      if (filters.status) params.set('status', filters.status)
      if (filters.sector) params.set('sector', filters.sector)
      if (filters.city) params.set('city', filters.city)
      if (filters.search) params.set('search', filters.search)
      if (filters.sortBy) params.set('sortBy', filters.sortBy)
      if (filters.sortDir) params.set('sortDir', filters.sortDir)
      if (filters.page) params.set('page', filters.page)
      if (filters.limit) params.set('limit', filters.limit)
      const qs = params.toString()
      return api.get(`/companies${qs ? '?' + qs : ''}`)
    },
  })
}

export function useCompany(id) {
  return useQuery({
    queryKey: ['company', id],
    queryFn: () => api.get(`/companies/${id}`),
    enabled: !!id,
  })
}

export function useCreateCompany() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.post('/companies', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
  })
}

export function useUpdateCompany() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => api.patch(`/companies/${id}`, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['companies'] })
      qc.invalidateQueries({ queryKey: ['company', id] })
    },
  })
}

export function useDeleteCompany() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`/companies/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
  })
}

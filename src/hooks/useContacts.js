import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useAllContacts(filters = {}) {
  return useQuery({
    queryKey: ['contacts', 'all', filters],
    queryFn: () => {
      const params = new URLSearchParams()
      if (filters.page) params.set('page', filters.page)
      if (filters.limit) params.set('limit', filters.limit)
      const qs = params.toString()
      return api.get(`/contacts${qs ? '?' + qs : ''}`)
    },
  })
}

export function useCreateContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.post('/contacts', data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['contacts'] })
      qc.invalidateQueries({ queryKey: ['company', vars.company_id] })
    },
  })
}

export function useUpdateContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => api.patch(`/contacts/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
  })
}

export function useDeleteContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`/contacts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
  })
}

export function useBatchContacts() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.post('/contacts/batch', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
  })
}

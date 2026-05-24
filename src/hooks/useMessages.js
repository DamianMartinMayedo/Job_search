import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useMessages(status) {
  return useQuery({
    queryKey: ['messages', status],
    queryFn: () => api.get(`/messages${status ? '?status=' + status : ''}`),
  })
}

export function useCreateMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.post('/messages', data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['messages'] })
      qc.invalidateQueries({ queryKey: ['company', vars.company_id] })
    },
  })
}

export function useUpdateMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => api.patch(`/messages/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages'] })
      qc.invalidateQueries({ queryKey: ['company'] })
    },
  })
}

export function useDeleteMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`/messages/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages'] })
      qc.invalidateQueries({ queryKey: ['company'] })
    },
  })
}

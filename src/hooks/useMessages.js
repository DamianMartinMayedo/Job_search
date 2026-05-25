import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useMessages(status, filters = {}) {
  return useQuery({
    queryKey: ['messages', status, filters],
    queryFn: () => {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      if (filters.page) params.set('page', filters.page)
      if (filters.limit) params.set('limit', filters.limit)
      const qs = params.toString()
      return api.get(`/messages${qs ? '?' + qs : ''}`)
    },
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

export function useSendMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (messageId) => api.post('/send-message', { messageId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages'] })
      qc.invalidateQueries({ queryKey: ['company'] })
    },
  })
}


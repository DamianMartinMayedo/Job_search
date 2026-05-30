import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useMessages(status, filters = {}) {
  return useQuery({
    queryKey: ['messages', status, filters],
    queryFn: () => {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      if (filters.companyId) params.set('company_id', filters.companyId)
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
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['messages'] })
      if (data?.company_id) {
        qc.invalidateQueries({ queryKey: ['company', data.company_id] })
      }
    },
  })
}

export function useDeleteMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`/messages/${id}`),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['messages'] })
      if (data?.company_id) {
        qc.invalidateQueries({ queryKey: ['company', data.company_id] })
      }
    },
  })
}

export function useSendMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ messageId, pair_name }) =>
      api.post('/send-message', { messageId, pair_name: pair_name || null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages'] })
      qc.invalidateQueries({ queryKey: ['company'] })
    },
  })
}

export function useBatchMessages() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.post('/messages/batch', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['messages'] }),
  })
}


import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useDocuments(type) {
  return useQuery({
    queryKey: ['documents', type],
    queryFn: () => api.get(`/documents${type ? '?type=' + type : ''}`),
  })
}

export function useUploadDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.post('/documents', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  })
}

export function useDeleteDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`/documents/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  })
}

export function useDocumentPairs() {
  return useQuery({
    queryKey: ['document_pairs'],
    queryFn: () => api.get('/document_pairs'),
  })
}

export function useCreateDocumentPair() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.post('/document_pairs', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['document_pairs'] }),
  })
}

export function useDeleteDocumentPair() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (pairName) => api.delete(`/document_pairs/${encodeURIComponent(pairName)}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['document_pairs'] }),
  })
}


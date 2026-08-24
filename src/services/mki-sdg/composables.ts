import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { mkiSdgApi } from './api'

export function useGetMkiSdgList(params?: { indicator_name?: string }) {
  return useQuery({
    queryKey: ['mkiSdgApi.index', params],
    queryFn: () => mkiSdgApi.index(params),
  })
}

export function useCreateMkiSdg() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: mkiSdgApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mkiSdgApi.index'] }),
  })
}

export function useUpdateMkiSdg() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: mkiSdgApi.update,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mkiSdgApi.index'] }),
  })
}

export function useRemoveMkiSdg() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: mkiSdgApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mkiSdgApi.index'] }),
  })
}

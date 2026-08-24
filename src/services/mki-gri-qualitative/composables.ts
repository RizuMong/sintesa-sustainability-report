import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { mkiGriQualitativeApi } from './api'

export function useGetMkiGriQualitativeList(params?: { name?: string }) {
  return useQuery({
    queryKey: ['mkiGriQualitativeApi.index', params],
    queryFn: () => mkiGriQualitativeApi.index(params),
  })
}

export function useCreateMkiGriQualitative() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: mkiGriQualitativeApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mkiGriQualitativeApi.index'] }),
  })
}

export function useUpdateMkiGriQualitative() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: mkiGriQualitativeApi.update,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mkiGriQualitativeApi.index'] }),
  })
}

export function useRemoveMkiGriQualitative() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: mkiGriQualitativeApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mkiGriQualitativeApi.index'] }),
  })
}

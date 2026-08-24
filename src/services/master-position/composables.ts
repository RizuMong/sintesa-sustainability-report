import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { masterPositionApi } from './api'

export function useGetMasterPosition() {
  return useQuery({
    queryFn: () => masterPositionApi.getMasterPosition(),
    queryKey: ['masterPositionApi.getMasterPosition'],
  })
}

export function useCreateMasterPosition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: masterPositionApi.createMasterPosition,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['masterPositionApi.getMasterPosition'] }),
  })
}

export function useUpdateMasterPosition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: masterPositionApi.updateMasterPosition,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['masterPositionApi.getMasterPosition'] }),
  })
}

export function useDeactivateMasterPosition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => masterPositionApi.deactivateMasterPosition(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['masterPositionApi.getMasterPosition'] }),
  })
}

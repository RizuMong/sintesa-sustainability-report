import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { masterGriApi } from './api'

const listKey = ['masterGriApi.getMasterGri']

export function useGetMasterGri() {
  return useQuery({
    queryFn: () => masterGriApi.getMasterGri(),
    queryKey: listKey,
  })
}

export function useCreateMasterGri() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: masterGriApi.createMasterGri,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
  })
}

export function useUpdateMasterGri() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: masterGriApi.updateMasterGri,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
  })
}

export function useDeactivateMasterGri() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: masterGriApi.deactivateMasterGri,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
  })
}

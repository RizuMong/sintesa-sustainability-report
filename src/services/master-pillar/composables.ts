import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { masterPillarApi } from './api'

const listKey = ['masterPillarApi.getMasterPillar']

export function useGetMasterPillar() {
  return useQuery({
    queryFn: () => masterPillarApi.getMasterPillar(),
    queryKey: listKey,
  })
}

export function useCreateMasterPillar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: masterPillarApi.createMasterPillar,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
  })
}

export function useUpdateMasterPillar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: masterPillarApi.updateMasterPillar,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
  })
}

export function useDeactivateMasterPillar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: masterPillarApi.deactivateMasterPillar,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
  })
}

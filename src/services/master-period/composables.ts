import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { masterPeriodApi } from './api'

const listKey = ['masterPeriodApi.getMasterPeriod']

export function useGetMasterPeriod() {
  return useQuery({
    queryFn: () => masterPeriodApi.getMasterPeriod(),
    queryKey: listKey,
  })
}

export function useCreateMasterPeriod() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: masterPeriodApi.createMasterPeriod,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
  })
}

export function useUpdateMasterPeriod() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: masterPeriodApi.updateMasterPeriod,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
  })
}

export function useDeactivateMasterPeriod() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: masterPeriodApi.deactivateMasterPeriod,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
  })
}

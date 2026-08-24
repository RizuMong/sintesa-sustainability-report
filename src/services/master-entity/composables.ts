import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { masterEntityApi } from './api'

const listKey = ['masterEntityApi.getMasterEntity']

export function useGetMasterEntity() {
  return useQuery({
    queryFn: () => masterEntityApi.getMasterEntity(),
    queryKey: listKey,
  })
}

// no dedicated get-by-id contract yet (api/Master Entity/ only has Index) — find within the list query
// result, same approach as other new-shape modules would use a real fetch-by-id.
export function useMasterEntityDetail(id: MaybeRefOrGetter<string | undefined>) {
  const list = useGetMasterEntity()
  const data = computed(() => list.data.value?.find((e) => e.id === toValue(id)))
  return { ...list, data }
}

export function useCreateMasterEntity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: masterEntityApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
  })
}

export function useUpdateMasterEntity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: masterEntityApi.update,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
  })
}

// AC-09: deactivate, never hard delete — see masterEntityApi.remove.
export function useDeactivateMasterEntity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: masterEntityApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
  })
}

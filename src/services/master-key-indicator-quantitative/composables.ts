import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { masterKeyIndicatorQuantitativeApi } from './api'

const listKey = ['masterKeyIndicatorQuantitativeApi.getList']

export function useGetMkiGriQuantitativeList() {
  return useQuery({
    queryFn: () => masterKeyIndicatorQuantitativeApi.getList(),
    queryKey: listKey,
  })
}

// no fetch-by-id contract (Index answers the full record per row) — pick it out of the list query,
// same approach as master-entity's useMasterEntityDetail.
export function useMkiGriQuantitativeDetail(id: MaybeRefOrGetter<string | undefined>) {
  const list = useGetMkiGriQuantitativeList()
  const data = computed(() => list.data.value?.find((item) => item.id === toValue(id)))
  return { ...list, data }
}

export function useCreateMkiGriQuantitative() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: masterKeyIndicatorQuantitativeApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
  })
}

export function useUpdateMkiGriQuantitative() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: masterKeyIndicatorQuantitativeApi.update,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
  })
}

export function useDeleteMkiGriQuantitative() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: masterKeyIndicatorQuantitativeApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
  })
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { actionPlanChangeRequestApi } from './api'

const listKeyRoot = 'actionPlanChangeRequestApi.getIndex'

export function useGetActionPlanChangeRequests(filters: MaybeRefOrGetter<{ status?: string }> = {}) {
  return useQuery({
    queryKey: computed(() => [listKeyRoot, toValue(filters)]),
    queryFn: () => actionPlanChangeRequestApi.getIndex(toValue(filters)),
  })
}

export function useApproveActionPlanChangeRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { id: string; reviewer_notes?: string }) =>
      actionPlanChangeRequestApi.approve(payload.id, payload.reviewer_notes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [listKeyRoot] }),
  })
}

export function useRejectActionPlanChangeRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { id: string; reviewer_notes: string }) =>
      actionPlanChangeRequestApi.reject(payload.id, payload.reviewer_notes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [listKeyRoot] }),
  })
}

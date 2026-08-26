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

export function useGetActionPlanChangeRequest(id: MaybeRefOrGetter<string | undefined>) {
  return useQuery({
    queryKey: computed(() => ['actionPlanChangeRequestApi.getDetail', toValue(id)]),
    queryFn: () => actionPlanChangeRequestApi.getDetail(toValue(id) as string),
    enabled: computed(() => Boolean(toValue(id))),
  })
}

// AC-108 — history view: every request filed against one action plan, newest first.
export function useGetActionPlanChangeRequestHistory(actionPlanId: MaybeRefOrGetter<string | undefined>) {
  const list = useGetActionPlanChangeRequests()
  const data = computed(() =>
    (list.data.value ?? [])
      .filter((item) => item.action_plan_id === toValue(actionPlanId))
      .sort((a, b) => b.request_date.localeCompare(a.request_date)),
  )
  return { ...list, data }
}

export function useCreateActionPlanChangeRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: actionPlanChangeRequestApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [listKeyRoot] }),
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

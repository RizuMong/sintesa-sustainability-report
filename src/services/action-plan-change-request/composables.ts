import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { actionPlanChangeRequestApi } from './api'

const listKey = ['actionPlanChangeRequestApi.getChangeRequests']

export function useGetChangeRequests() {
  return useQuery({
    queryFn: () => actionPlanChangeRequestApi.getChangeRequests(),
    queryKey: listKey,
  })
}

export function useGetChangeRequest(id: MaybeRefOrGetter<string | undefined>) {
  const list = useGetChangeRequests()
  const data = computed(() => list.data.value?.find((item) => item.id === toValue(id)))
  return { ...list, data }
}

// AC-108 — history view: every request filed against one action plan, newest first.
export function useGetChangeRequestHistory(actionPlanId: MaybeRefOrGetter<string | undefined>) {
  const list = useGetChangeRequests()
  const data = computed(() =>
    (list.data.value ?? [])
      .filter((item) => item.action_plan_id === toValue(actionPlanId))
      .sort((a, b) => b.request_date.localeCompare(a.request_date)),
  )
  return { ...list, data }
}

export function useCreateChangeRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: actionPlanChangeRequestApi.createChangeRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
  })
}

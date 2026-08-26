import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { actionPlanSubmissionApi } from './api'

const listKey = ['actionPlanSubmissionApi.getActionPlanSubmission']

export function useGetActionPlanSubmission() {
  return useQuery({
    queryFn: () => actionPlanSubmissionApi.getActionPlanSubmission(),
    queryKey: listKey,
  })
}

export function useActionPlanSubmissionDetail(id: MaybeRefOrGetter<string | undefined>) {
  return useQuery({
    queryFn: () => actionPlanSubmissionApi.getActionPlanSubmissionDetail(toValue(id)!),
    queryKey: ['actionPlanSubmissionApi.getActionPlanSubmissionDetail', id],
    enabled: computed(() => Boolean(toValue(id))),
  })
}

export function useSubmitActionPlanDecision() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: actionPlanSubmissionApi.submitActionPlanDecision,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
  })
}

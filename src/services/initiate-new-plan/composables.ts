import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { initiateNewPlanApi } from './api'

const listKey = ['initiateNewPlanApi.getInitiatedPlans']

export function useGetInitiatedPlans() {
  return useQuery({
    queryFn: () => initiateNewPlanApi.getInitiatedPlans(),
    queryKey: listKey,
  })
}

export function useGetInitiatedPlan(id: MaybeRefOrGetter<string | undefined>) {
  const list = useGetInitiatedPlans()
  const data = computed(() => list.data.value?.find((plan) => plan.id === toValue(id)))
  return { ...list, data }
}

export function useCreateInitiatedPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: initiateNewPlanApi.createInitiatedPlan,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
  })
}

export function useUpdateInitiatedPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: initiateNewPlanApi.updateInitiatedPlan,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
  })
}

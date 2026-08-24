import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { generateActionPlanLogApi } from './api'

const indexKey = ['generateActionPlanLogApi.index']

export function useGetGenerateActionPlanLog() {
  return useQuery({
    queryFn: () => generateActionPlanLogApi.index(),
    queryKey: indexKey,
  })
}

export function useRetriggerGenerateActionPlanLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => generateActionPlanLogApi.retrigger(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: indexKey }),
  })
}

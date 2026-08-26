import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { reportPlanRealizationApi } from './api'

const listKey = ['reportPlanRealizationApi.getReportPlanRealization']

export function useGetReportPlanRealization() {
  return useQuery({
    queryFn: () => reportPlanRealizationApi.getReportPlanRealization(),
    queryKey: listKey,
  })
}

export function useReportPlanRealizationDetail(id: MaybeRefOrGetter<string | undefined>) {
  return useQuery({
    queryFn: () => reportPlanRealizationApi.getReportPlanRealizationDetail(toValue(id)!),
    queryKey: ['reportPlanRealizationApi.getReportPlanRealizationDetail', id],
    enabled: computed(() => Boolean(toValue(id))),
  })
}

export function useUpdateReportPlanRealization() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: reportPlanRealizationApi.updateReportPlanRealization,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
  })
}

export function useSubmitReportPlanRealization() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: reportPlanRealizationApi.submitReportPlanRealization,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
  })
}

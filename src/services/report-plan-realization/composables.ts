import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { reportPlanRealizationApi } from './api'

type ApprovalFilters = { entity_id?: string; period?: string }

const approvalListKeyRoot = 'reportPlanRealizationApi.getApprovalList'

export function useGetApprovalList(filters: MaybeRefOrGetter<ApprovalFilters> = {}) {
  return useQuery({
    queryKey: computed(() => [approvalListKeyRoot, toValue(filters)]),
    queryFn: () => reportPlanRealizationApi.getApprovalList(toValue(filters)),
  })
}

export function useApproveReportPlanRealization() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { id: string; remarks?: string }) =>
      reportPlanRealizationApi.approve(payload.id, payload.remarks),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [approvalListKeyRoot] }),
  })
}

export function useRejectReportPlanRealization() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { id: string; remarks: string }) =>
      reportPlanRealizationApi.reject(payload.id, payload.remarks),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [approvalListKeyRoot] }),
  })
}

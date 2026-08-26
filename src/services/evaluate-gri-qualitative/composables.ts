import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { evaluateGriQualitativeApi } from './api'

type ApprovalFilters = { entity_id?: string; period?: string; template_id?: string }

const approvalListKeyRoot = 'evaluateGriQualitativeApi.getApprovalList'

export function useGetApprovalList(filters: MaybeRefOrGetter<ApprovalFilters> = {}) {
  return useQuery({
    queryKey: computed(() => [approvalListKeyRoot, toValue(filters)]),
    queryFn: () => evaluateGriQualitativeApi.getApprovalList(toValue(filters)),
  })
}

export function useApproveEvaluateGriQualitative() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { id: string; remarks?: string }) =>
      evaluateGriQualitativeApi.approve(payload.id, payload.remarks),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [approvalListKeyRoot] }),
  })
}

export function useRejectEvaluateGriQualitative() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { id: string; remarks: string }) =>
      evaluateGriQualitativeApi.reject(payload.id, payload.remarks),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [approvalListKeyRoot] }),
  })
}

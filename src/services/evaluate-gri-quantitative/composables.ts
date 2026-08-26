import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { http, unwrap } from '@/lib/http'
import { evaluateGriQuantitativeApi } from './api'

type RequestorFilters = { entity_id?: string; period?: string; template_id?: string }

const requestorListKeyRoot = 'evaluateGriQuantitativeApi.getRequestorList'
const approvalListKeyRoot = 'evaluateGriQuantitativeApi.getApprovalList'

export function useGetRequestorList(filters: MaybeRefOrGetter<RequestorFilters> = {}) {
  return useQuery({
    queryKey: computed(() => [requestorListKeyRoot, toValue(filters)]),
    queryFn: () => evaluateGriQuantitativeApi.getRequestorList(toValue(filters)),
  })
}

export function useGetApprovalList(filters: MaybeRefOrGetter<RequestorFilters> = {}) {
  return useQuery({
    queryKey: computed(() => [approvalListKeyRoot, toValue(filters)]),
    queryFn: () => evaluateGriQuantitativeApi.getApprovalList(toValue(filters)),
  })
}

export function useGetEvaluateGriQuantitativeDetail(id: MaybeRefOrGetter<string | undefined>) {
  return useQuery({
    queryKey: computed(() => ['evaluateGriQuantitativeApi.getDetail', toValue(id)]),
    queryFn: () => evaluateGriQuantitativeApi.getDetail(toValue(id) as string),
    enabled: computed(() => Boolean(toValue(id))),
  })
}

function invalidateLists(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: [requestorListKeyRoot] })
  queryClient.invalidateQueries({ queryKey: [approvalListKeyRoot] })
}

export function useCreateEvaluateGriQuantitative() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: evaluateGriQuantitativeApi.create,
    onSuccess: () => invalidateLists(queryClient),
  })
}

export function useUpdateEvaluateGriQuantitative() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: evaluateGriQuantitativeApi.update,
    onSuccess: () => invalidateLists(queryClient),
  })
}

export function useSubmitEvaluateGriQuantitative() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: evaluateGriQuantitativeApi.submit,
    onSuccess: () => invalidateLists(queryClient),
  })
}

export function useCancelEvaluateGriQuantitative() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: evaluateGriQuantitativeApi.cancel,
    onSuccess: () => invalidateLists(queryClient),
  })
}

export function useDeleteEvaluateGriQuantitative() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: evaluateGriQuantitativeApi.remove,
    onSuccess: () => invalidateLists(queryClient),
  })
}

// Stream E's Review & Approval screen also acts on this module (§2.4 table) — shipped here so it
// doesn't need to touch this file at merge.
export function useApproveEvaluateGriQuantitative() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { id: string; remarks?: string }) =>
      evaluateGriQuantitativeApi.approve(payload.id, payload.remarks),
    onSuccess: () => invalidateLists(queryClient),
  })
}

export function useRejectEvaluateGriQuantitative() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { id: string; remarks: string }) =>
      evaluateGriQuantitativeApi.reject(payload.id, payload.remarks),
    onSuccess: () => invalidateLists(queryClient),
  })
}

// ponytail: Stream A owns src/services/master-template-quantitative/ but hasn't merged yet — this
// is a minimal duplicate of its confirmed Index endpoint (api/Master Template - Quantitative/Index.yml)
// just to unblock the template picker on the requestor create form. Swap to the real module's
// useGetMasterTemplateQuantitative() at merge and delete this one.
export interface MasterTemplateQuantitativeOption {
  id: string
  period_id: Ref2
  status: 'Published' | 'Draft'
  template_name: string
}

export function useGetMasterTemplateQuantitativeOptions() {
  return useQuery({
    queryKey: ['masterTemplateQuantitativeApi.getMasterTemplateQuantitative'],
    queryFn: () =>
      unwrap<MasterTemplateQuantitativeOption[]>(http.get('/v1/master-template-quantitative/index')),
  })
}

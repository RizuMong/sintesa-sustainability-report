import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { toValue, type MaybeRefOrGetter } from 'vue'
import { evaluateGriQualitativeApi } from './api'

const listKey = ['evaluateGriQualitativeApi.index']
const approvalListKey = ['evaluateGriQualitativeApi.approvalIndex']

export function useGetGriQualSubmissions(params?: { entity_id?: string; period?: string; template_id?: string }) {
  return useQuery({
    queryKey: [...listKey, params],
    queryFn: () => evaluateGriQualitativeApi.index(params),
  })
}

// consumed by Stream E's approval tab
export function useGetGriQualApprovalQueue(params?: { entity_id?: string; period?: string; template_id?: string }) {
  return useQuery({
    queryKey: [...approvalListKey, params],
    queryFn: () => evaluateGriQualitativeApi.approvalIndex(params),
  })
}

// new-shape modules fetch by id directly (no useHistoryRecord) — see CLAUDE.md services module shape
export function useGetGriQualSubmission(id: MaybeRefOrGetter<string | undefined>) {
  return useQuery({
    queryKey: ['evaluateGriQualitativeApi.detail', toValue(id)],
    queryFn: () => evaluateGriQualitativeApi.detail(toValue(id) as string),
    enabled: () => Boolean(toValue(id)),
  })
}

export function useCreateGriQualSubmission() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: evaluateGriQualitativeApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
  })
}

export function useUpdateGriQualSubmission() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: evaluateGriQualitativeApi.update,
    onSuccess: (data) => queryClient.invalidateQueries({ queryKey: ['evaluateGriQualitativeApi.detail', data.id] }),
  })
}

export function useSubmitGriQualSubmission() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: evaluateGriQualitativeApi.submit,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: listKey })
      queryClient.invalidateQueries({ queryKey: ['evaluateGriQualitativeApi.detail', data.id] })
    },
  })
}

// consumed by Stream E's approval tab
export function useApproveGriQualSubmission() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: evaluateGriQualitativeApi.approve,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: approvalListKey })
      queryClient.invalidateQueries({ queryKey: listKey })
    },
  })
}

// consumed by Stream E's approval tab
export function useRejectGriQualSubmission() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: evaluateGriQualitativeApi.reject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: approvalListKey })
      queryClient.invalidateQueries({ queryKey: listKey })
    },
  })
}

export function useCancelGriQualSubmission() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: evaluateGriQualitativeApi.cancel,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
  })
}

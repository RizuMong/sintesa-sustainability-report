import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { griReleaseApi, type GriReleasePayload } from './api'

const listKey = ['griReleaseApi.getGriReleases']
const detailKey = (id: string) => ['griReleaseApi.getGriReleaseDetail', id]

export function useGetGriReleases() {
  return useQuery({
    queryFn: () => griReleaseApi.getGriReleases(),
    queryKey: listKey,
  })
}

// list endpoint returns GriReleaseSummary only (no disclosures) — the detail page needs a real
// fetch-by-id call, unlike the sibling modules that can list+find locally.
export function useGetGriReleaseDetail(id: MaybeRefOrGetter<string | undefined>) {
  return useQuery({
    queryFn: () => griReleaseApi.getGriReleaseDetail(toValue(id)!),
    queryKey: computed(() => detailKey(toValue(id) ?? '')),
    enabled: computed(() => Boolean(toValue(id))),
  })
}

export function useCreateGriRelease() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: GriReleasePayload) => griReleaseApi.createGriRelease(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
  })
}

export function useUpdateGriRelease() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: GriReleasePayload & { id: string }) => griReleaseApi.updateGriRelease(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: listKey })
      queryClient.invalidateQueries({ queryKey: detailKey(data.id) })
    },
  })
}

export function usePublishGriRelease() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string }) => griReleaseApi.publishGriRelease({ id }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: listKey })
      queryClient.invalidateQueries({ queryKey: detailKey(data.id) })
    },
  })
}

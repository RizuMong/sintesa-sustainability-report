import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { performanceTrackingApi } from './api'

function listKey(period?: string, entity?: string) {
  return ['performanceTrackingApi.getTrackingRows', period, entity]
}

// AC-67 "real-time": poll every 30s — ponytail: polling instead of websockets; swap when a push channel exists
export function useGetTrackingRows(
  period?: MaybeRefOrGetter<string | undefined>,
  entity?: MaybeRefOrGetter<string | undefined>,
) {
  return useQuery({
    queryFn: () => performanceTrackingApi.getTrackingRows({ period: toValue(period), entity: toValue(entity) }),
    queryKey: computed(() => listKey(toValue(period), toValue(entity))),
    refetchInterval: 30_000,
  })
}

export function useNudge() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: performanceTrackingApi.nudge,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['performanceTrackingApi.getTrackingRows'] }),
  })
}

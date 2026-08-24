import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { periodicNotificationApi } from './api'

const indexKey = ['periodicNotificationApi.index']

export function useGetPeriodicNotification() {
  return useQuery({
    queryFn: () => periodicNotificationApi.index(),
    queryKey: indexKey,
  })
}

export function useCreatePeriodicNotification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: periodicNotificationApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: indexKey }),
  })
}

export function useUpdatePeriodicNotification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: periodicNotificationApi.update,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: indexKey }),
  })
}

export function useDeactivatePeriodicNotification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => periodicNotificationApi.deactivate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: indexKey }),
  })
}

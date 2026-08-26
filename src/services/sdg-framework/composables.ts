import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { toValue, type MaybeRefOrGetter } from 'vue'
import { sdgFrameworkApi } from './api'

const listKey = ['sdgFrameworkApi.getSdgFrameworks']

export function useGetSdgFrameworks() {
  return useQuery({
    queryFn: () => sdgFrameworkApi.getSdgFrameworks(),
    queryKey: listKey,
  })
}

export function useGetSdgFramework(id: MaybeRefOrGetter<string | undefined>) {
  return useQuery({
    queryFn: () => sdgFrameworkApi.getSdgFramework(toValue(id)!),
    queryKey: ['sdgFrameworkApi.getSdgFramework', id],
    enabled: () => Boolean(toValue(id)),
  })
}

export function useCreateSdgFramework() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: sdgFrameworkApi.createSdgFramework,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
  })
}

export function useUpdateSdgFramework() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: sdgFrameworkApi.updateSdgFramework,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
  })
}

export function useDeleteSdgFramework() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: sdgFrameworkApi.deleteSdgFramework,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
  })
}

export function usePublishSdgFramework() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: sdgFrameworkApi.publishSdgFramework,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
  })
}

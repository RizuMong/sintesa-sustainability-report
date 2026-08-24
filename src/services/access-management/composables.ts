import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { accessManagementApi } from './api'

export function useGetAccessGrants() {
  return useQuery({
    queryFn: () => accessManagementApi.getAccessGrants(),
    queryKey: ['accessManagementApi.getAccessGrants'],
  })
}

export function useSaveAccessGrants() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: accessManagementApi.saveAccessGrants,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accessManagementApi.getAccessGrants'] }),
  })
}

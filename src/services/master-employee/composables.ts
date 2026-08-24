import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { masterEmployeeApi } from './api'

export function useGetMasterEmployee() {
  return useQuery({
    queryFn: () => masterEmployeeApi.getMasterEmployee(),
    queryKey: ['masterEmployeeApi.getMasterEmployee'],
  })
}

export function useCreateMasterEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: masterEmployeeApi.createMasterEmployee,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['masterEmployeeApi.getMasterEmployee'] }),
  })
}

export function useUpdateMasterEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: masterEmployeeApi.updateMasterEmployee,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['masterEmployeeApi.getMasterEmployee'] }),
  })
}

export function useDeactivateMasterEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => masterEmployeeApi.deactivateMasterEmployee(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['masterEmployeeApi.getMasterEmployee'] }),
  })
}

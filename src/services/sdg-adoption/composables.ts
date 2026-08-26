import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { sdgAdoptionApi } from './api'

const listKey = ['sdgAdoptionApi.getSdgAdoption']

export function useGetSdgAdoption() {
  return useQuery({
    queryFn: () => sdgAdoptionApi.getSdgAdoption(),
    queryKey: listKey,
  })
}

export function useUpdateSdgAdoption() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: sdgAdoptionApi.updateSdgAdoption,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
  })
}

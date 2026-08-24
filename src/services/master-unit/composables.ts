import { useQuery } from '@tanstack/vue-query'
import { masterUnitApi } from './api'

export function useGetMasterUnit() {
  return useQuery({
    queryFn: () => masterUnitApi.getMasterUnit(),
    queryKey: ['masterUnitApi.getMasterUnit'],
  })
}

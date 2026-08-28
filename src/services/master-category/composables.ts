import { useQuery } from '@tanstack/vue-query'
import { masterCategoryApi } from './api'

export function useGetMasterCategory() {
  return useQuery({
    queryFn: () => masterCategoryApi.getMasterCategory(),
    queryKey: ['masterCategoryApi.getMasterCategory'],
  })
}

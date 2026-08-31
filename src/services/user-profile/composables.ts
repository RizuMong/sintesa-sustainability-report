import { useQuery } from '@tanstack/vue-query'
import { userProfileApi } from './api'

export function useGetUserProfile() {
  return useQuery({
    queryFn: () => userProfileApi.getUserProfile(),
    queryKey: ['userProfileApi.getUserProfile'],
  })
}

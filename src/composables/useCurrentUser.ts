import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { http, unwrap } from '@/lib/http'
import { useOfficelessAuth } from './useOfficelessAuth'

// POST /v1/tools/auth with method 'decrypt' answers the signed-in user's email (api/Auth/Auth
// Low-code.yml) — the only identity the embed token yields, so it is what "…by me" filters match on.
export function useCurrentUserEmail() {
  const { config } = useOfficelessAuth()
  return useQuery({
    queryKey: ['authApi.decryptToken'],
    queryFn: () => unwrap<string>(http.post('/v1/tools/auth', { token: config.value.token, method: 'decrypt' })),
    enabled: computed(() => Boolean(config.value.token)),
    staleTime: Infinity,
  })
}

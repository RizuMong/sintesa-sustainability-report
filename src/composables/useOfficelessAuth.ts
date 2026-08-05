import { readonly, ref } from 'vue'

// Officeless embed auth — token comes from the iframe URL query built by the
// `auth_lowcode` workflow function. See docs/lowcode-embed-officeless.md.
export type AuthStatus = 'ok' | 'unauthorized' | 'expired'

export interface EmbedConfig {
  token: string | null
  env: string | null
  companyId: string | null
}

export function parseEmbedConfig(search: string): EmbedConfig {
  const q = new URLSearchParams(search)
  return { token: q.get('token'), env: q.get('env'), companyId: q.get('company_id') }
}

export function workflowApiBaseUrl(env: string | null): string {
  return `https://api-officeless${env === 'development' ? '-dev' : ''}.mekari.com`
}

// workflow APIs answer 200 with { error, message } — map both that and plain HTTP 401
export function statusFromResponse(
  body: { error?: boolean; message?: string } | null,
  httpStatus: number,
): AuthStatus {
  if (body?.error && body.message === 'ERR_TOKEN_EXPIRED') return 'expired'
  if (body?.error && body.message === 'ERR_UNAUTHORIZED') return 'unauthorized'
  if (httpStatus === 401) return 'unauthorized'
  return 'ok'
}

const config = ref<EmbedConfig>({ token: null, env: null, companyId: null })
const status = ref<AuthStatus>('unauthorized')

// called once from App.vue setup — the token only exists on the URL the iframe
// was first loaded with, so it is captured before any client-side navigation
export function initOfficelessAuth() {
  config.value = parseEmbedConfig(window.location.search)
  const authenticated = Boolean(config.value.token && config.value.env)
  status.value = authenticated || import.meta.env.DEV ? 'ok' : 'unauthorized'
}

// ponytail: no upfront verify call — the token is only proven valid when a
// workflow API decrypts it. Add a dedicated ping here if pages ever render
// without hitting any API and a stale token must be caught earlier.
export async function authFetch(path: string, init: RequestInit = {}) {
  const response = await fetch(`${workflowApiBaseUrl(config.value.env)}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: config.value.token ?? '',
      ...init.headers,
    },
  })

  const body = await response.json().catch(() => null)
  const next = statusFromResponse(body, response.status)
  status.value = next
  if (next !== 'ok') throw new Error(body?.message ?? 'ERR_UNAUTHORIZED')
  if (!response.ok) throw new Error(`API Error: ${response.status}`)

  return body
}

export function useOfficelessAuth() {
  return { config: readonly(config), status: readonly(status), authFetch }
}

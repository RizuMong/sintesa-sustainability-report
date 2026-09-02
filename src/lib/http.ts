import axios from 'axios'
import { toast } from '@mekari/pixel3'
// relative import (not the '@/' alias) so http.check.ts can load this module under plain Node
import { markAuthStatus, statusFromResponse, useOfficelessAuth, workflowApiBaseUrl } from '../composables/useOfficelessAuth.ts'

declare module 'axios' {
  interface AxiosRequestConfig {
    // set true to suppress the response-interceptor's auto toast (e.g. bulk loops emitting one summary toast instead)
    meta?: { silentToast?: boolean }
  }
}

// Workflow API response envelope — every endpoint answers this shape, see docs/lowcode-embed-officeless.md
export interface ApiEnvelope<T> {
  code: number
  data: T
  error: boolean
  message: string
}

export const http = axios.create()

http.interceptors.request.use((config) => {
  const { config: auth } = useOfficelessAuth()
  config.baseURL = workflowApiBaseUrl(auth.value.env)
  config.headers.set('Content-Type', 'application/json')
  config.headers.set('Authorization', auth.value.token ?? '')
  return config
})

// returns the envelope's message when `error: true`, otherwise null — pure so it's testable without axios
export function envelopeError(body: { error?: boolean; message?: string } | null | undefined): string | null {
  if (!body?.error) return null
  return body.message ?? 'Request failed'
}

// mirrors authFetch's status mapping (src/composables/useOfficelessAuth.ts) so axios and fetch callers agree on auth state
// ponytail: envelope `message` shown verbatim, no i18n/mapping — add one if a non-English/localized message ever ships, error path included
http.interceptors.response.use(
  (response) => {
    const next = statusFromResponse(response.data, response.status)
    markAuthStatus(next)
    if (next !== 'ok') return Promise.reject(new Error(response.data?.message ?? 'ERR_UNAUTHORIZED'))
    const message = envelopeError(response.data)
    if (message !== null) {
      if (!response.config.meta?.silentToast) {
        toast.notify({ id: `${response.config.method}-${response.config.url}`, variant: 'error', title: message })
      }
      return Promise.reject(new Error(message))
    }
    const method = response.config.method?.toLowerCase()
    if (method && method !== 'get' && method !== 'head' && response.data?.message && !response.config.meta?.silentToast) {
      toast.notify({ id: `${method}-${response.config.url}`, variant: 'success', title: response.data.message })
    }
    return response
  },
  (error) => {
    const next = statusFromResponse(error.response?.data ?? null, error.response?.status ?? 0)
    markAuthStatus(next)
    if (next === 'ok' && !error.config?.meta?.silentToast) {
      toast.notify({ variant: 'error', title: error.response?.data?.message ?? error.message })
    }
    return Promise.reject(error)
  },
)

// unwraps the {code, data, error, message} envelope down to just `data`
export async function unwrap<T>(request: Promise<{ data: ApiEnvelope<T> }>): Promise<T> {
  const response = await request
  return response.data.data
}

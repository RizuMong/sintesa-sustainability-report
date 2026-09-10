// Fetch-based transport for the verification harness — plain node script, so this does NOT
// import src/lib/http.ts (that pulls in axios + @mekari/pixel3 + Vue, which a node CLI has no
// business loading). The envelope shape and auth-status mapping are re-derived here to match
// src/composables/useOfficelessAuth.ts's statusFromResponse semantics.

// Workflow API response envelope — mirrors src/lib/http.ts's ApiEnvelope, kept local so this
// file has zero app-source imports.
export interface ApiEnvelope<T> {
  code: number
  data: T
  error: boolean
  message: string
}

export type AuthStatus = 'ok' | 'expired' | 'unauthorized'

export interface Probe<T> {
  ok: boolean
  url: string
  status: number
  durationMs: number
  envelope: ApiEnvelope<T> | null
  data: T | null
  authStatus: AuthStatus
  error?: string
  rawText?: string
}

export interface ApiClient {
  get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<Probe<T>>
}

// ---- secret redaction -----------------------------------------------------------------------
// This harness's output gets pasted into tickets, so nothing sensitive may ever be printed or
// written to disk. `signIn` registers the bootstrap token and the resolved session token here;
// redact()/redactDeep() also catch any other long hex/base64-ish token and email addresses as a
// second line of defense (e.g. a token embedded in an error body we didn't explicitly register).
const knownSecrets = new Set<string>()

function registerSecret(secret: string | undefined | null) {
  if (secret && secret.length > 0) knownSecrets.add(secret)
}

// >=40 chars of hex/base64url-ish content — long enough to not false-positive on ordinary words,
// loose enough to catch tokens we didn't explicitly register.
const GENERIC_TOKEN_RE = /[A-Za-z0-9_-]{40,}/g
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g

export function redact(s: string): string {
  let out = s
  for (const secret of knownSecrets) {
    if (secret.length === 0) continue
    out = out.split(secret).join('<redacted>')
  }
  out = out.replace(EMAIL_RE, '<redacted-email>')
  out = out.replace(GENERIC_TOKEN_RE, (match) => (knownSecrets.has(match) ? match : '<redacted>'))
  return out
}

export function redactDeep<T>(v: T): T {
  if (typeof v === 'string') return redact(v) as unknown as T
  if (Array.isArray(v)) return v.map((item) => redactDeep(item)) as unknown as T
  if (v && typeof v === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(v as Record<string, unknown>)) {
      out[key] = redactDeep(value)
    }
    return out as unknown as T
  }
  return v
}

function redactUrl(url: string): string {
  return redact(url)
}

// ---- auth status mapping ----------------------------------------------------------------------
// Must agree with src/composables/useOfficelessAuth.ts's statusFromResponse: a 200 with
// error:true and a known message code is an auth failure, not a transport success.
function authStatusOf(body: { error?: boolean; message?: string } | null, httpStatus: number): AuthStatus {
  if (body?.error && body.message === 'ERR_TOKEN_EXPIRED') return 'expired'
  if (body?.error && body.message === 'ERR_UNAUTHORIZED') return 'unauthorized'
  if (httpStatus === 401) return 'unauthorized'
  return 'ok'
}

// ---- sign-in ------------------------------------------------------------------------------
export async function signIn(opts: {
  baseUrl: string
  bootstrapToken: string
  email: string
  timeoutMs?: number
}): Promise<{ token: string }> {
  registerSecret(opts.bootstrapToken)
  const url = `${opts.baseUrl}/v1/tools/auth`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: opts.bootstrapToken,
    },
    body: JSON.stringify({ email: opts.email, method: 'encrypt' }),
    signal: AbortSignal.timeout(opts.timeoutMs ?? 30_000),
  })

  const rawText = await response.text()
  let envelope: ApiEnvelope<string> | null = null
  try {
    envelope = JSON.parse(rawText) as ApiEnvelope<string>
  } catch {
    // fall through to the error below with rawText for diagnostics
  }

  if (!response.ok || !envelope || envelope.error || typeof envelope.data !== 'string') {
    throw new Error(
      `signIn failed (${redactUrl(url)}, status ${response.status}): ${redact(
        envelope ? JSON.stringify(envelope) : rawText,
      )}`,
    )
  }

  registerSecret(envelope.data)
  return { token: envelope.data }
}

// ---- probe (verify) helper ----------------------------------------------------------------
export async function verifySignIn(opts: { baseUrl: string; token: string; timeoutMs?: number }): Promise<Probe<unknown>> {
  const client = createClient({ baseUrl: opts.baseUrl, token: opts.token })
  return client.get('/v1/user/profile', undefined)
}

// ---- client ---------------------------------------------------------------------------------
export function createClient(opts: { baseUrl: string; token: string; timeoutMs?: number }): ApiClient {
  registerSecret(opts.token)

  return {
    async get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<Probe<T>> {
      const url = new URL(`${opts.baseUrl}${path}`)
      for (const [key, value] of Object.entries(params ?? {})) {
        if (value === undefined) continue
        url.searchParams.set(key, String(value))
      }
      const redactedUrl = redactUrl(url.toString())
      const start = performance.now()

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: opts.token,
          },
          signal: AbortSignal.timeout(opts.timeoutMs ?? 30_000),
        })
        const durationMs = Math.round(performance.now() - start)
        const rawText = await response.text()

        let envelope: ApiEnvelope<T> | null = null
        try {
          envelope = JSON.parse(rawText) as ApiEnvelope<T>
        } catch {
          // non-JSON body — envelope stays null, reported via rawText
        }

        const authStatus = authStatusOf(envelope, response.status)
        const envelopeError = Boolean(envelope?.error)
        const ok = response.ok && authStatus === 'ok' && !envelopeError

        return {
          ok,
          url: redactedUrl,
          status: response.status,
          durationMs,
          envelope: envelope ? (redactDeep(envelope) as ApiEnvelope<T>) : null,
          data: ok && envelope ? envelope.data : null,
          authStatus,
          error: ok ? undefined : redact(envelope ? envelope.message : rawText || `HTTP ${response.status}`),
          rawText: envelope ? undefined : redact(rawText),
        }
      } catch (err) {
        // Network/timeout failure — still report rather than throw, per spec: the whole point of
        // this client is telling the caller what actually happened.
        // A network/timeout failure says nothing about auth. Reporting 'unauthorized' here would
        // send whoever reads the output chasing a token problem that isn't there.
        const durationMs = Math.round(performance.now() - start)
        return {
          ok: false,
          url: redactedUrl,
          status: 0,
          durationMs,
          envelope: null,
          data: null,
          authStatus: 'ok',
          error: redact(err instanceof Error ? err.message : String(err)),
        }
      }
    },
  }
}

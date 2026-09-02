# Phase 1 — Reject `error: true` envelopes in the shared axios interceptor

**Goal.** A 200-with-`error: true` response must produce an error toast and a rejected promise, not a success toast.

**Files owned**
- `src/lib/http.ts`
- `src/lib/http.check.ts` (new)

**Depends on:** none

## Context

Ticket:
> BE returns a validation error response (e.g. invalid/missing field, business rule violation). FE does not
> catch/handle this error response. User is not informed that their action failed or why.
> Expected: FE catches it and displays a toast notification containing the validation message(s) returned by BE.

Current success branch, `src/lib/http.ts:37-49` — note it toasts `variant: 'success'` with
`response.data.message`, which is exactly the validation text on a failed write:

```ts
const next = statusFromResponse(response.data, response.status)
markAuthStatus(next)
if (next !== 'ok') return Promise.reject(new Error(response.data?.message ?? 'ERR_UNAUTHORIZED'))
const method = response.config.method?.toLowerCase()
if (method && method !== 'get' && method !== 'head' && response.data?.message && !response.config.meta?.silentToast) {
  toast.notify({ id: `${method}-${response.config.url}`, variant: 'success', title: response.data.message })
}
```

The error branch below it (`src/lib/http.ts:50-58`) already does the right thing for real HTTP errors —
mirror its `toast.notify({ variant: 'error', ... })` + `meta.silentToast` respect, don't invent a second style.

`statusFromResponse` lives at `src/composables/useOfficelessAuth.ts:27` and returns `'ok'` for any
`error: true` body whose message isn't one of the two auth sentinels — that is why validation errors slip through.

## Steps

1. In the success branch of `http.interceptors.response.use`, immediately after the existing
   `if (next !== 'ok') return Promise.reject(...)` line, add the envelope-error guard: when
   `response.data?.error === true`, `toast.notify({ variant: 'error', title: response.data.message ?? 'Request failed' })`
   unless `response.config.meta?.silentToast`, then `return Promise.reject(new Error(response.data?.message ?? 'Request failed'))`.
   Guard must run for **all** methods including GET — a failed GET currently resolves to `undefined` data too.
2. Leave the existing success toast block untouched below the guard; it is now only reachable for `error: false`.
3. Extract the decision out of the interceptor into one exported pure function so it is testable without axios,
   e.g. `export function envelopeError(body: {error?: boolean; message?: string} | null | undefined): string | null`
   returning the message when the envelope is an error and `null` otherwise. Call it from the interceptor.
   Keep it in `http.ts` — no new file, no new abstraction beyond this one function.
4. Add `src/lib/http.check.ts` following `src/lib/review-approval-validation.check.ts` (header comment with the
   exact run command, `node:assert/strict`, plain top-level asserts). Cover: `error: true` returns the message;
   `error: false` returns `null`; a missing/undefined body returns `null`.
5. Update the `ponytail:` comment above the interceptor if the "message shown verbatim, no i18n" note now also
   covers the error path.

## Acceptance

```
node --experimental-strip-types src/lib/http.check.ts   # passes
pnpm build                                              # typecheck + build clean
```

Manually: trigger a write that the BE rejects (Evaluate GRI Quant Submit with a missing required value) and
confirm a **red** toast with the BE message appears and no success toast fires.

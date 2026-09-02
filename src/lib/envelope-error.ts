// Workflow APIs answer HTTP 200 even when the action failed — `error: true` in the {code, data,
// error, message} envelope is the only signal, so validation/business-rule messages have to be read
// out of a 2xx body (src/lib/http.ts's response interceptor does the reading).
// ponytail: field errors are collected as strings off `data` (any nesting) — tighten to the real
// shape once a validation response is captured in api/.
export function envelopeErrorMessage(body: { message?: string; data?: unknown } | null): string {
  const fieldMessages = collectStrings(body?.data)
  if (fieldMessages.length) return fieldMessages.join(' ')
  return body?.message?.trim() || 'Request failed. Please try again.'
}

function collectStrings(value: unknown): string[] {
  if (typeof value === 'string') return value.trim() ? [value.trim()] : []
  if (Array.isArray(value)) return value.flatMap(collectStrings)
  if (value && typeof value === 'object') return Object.values(value).flatMap(collectStrings)
  return []
}

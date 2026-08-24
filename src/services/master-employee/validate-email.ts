// no `@/lib/http` import here on purpose — kept import-alias-free so `api.check.ts` can run under
// plain `node --experimental-strip-types` without a bundler resolving the `@` path alias.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmailFormat(email: string) {
  return EMAIL_RE.test(email)
}

// AC-12: email must be unique across employees (excluding the record being edited)
export function isEmailUnique(employees: Pick<MasterEmployee, 'id' | 'email'>[], email: string, excludeId?: string) {
  const needle = email.trim().toLowerCase()
  return !employees.some((e) => e.id !== excludeId && e.email.trim().toLowerCase() === needle)
}

// soft-delete only (FSD 1.5) — "deactivate" never removes the row, always flips status
export function buildDeactivatePayload(id: string) {
  return { id, status: 'Inactive' as const }
}

// no `@/lib/http` import here on purpose — kept import-alias-free so `api.check.ts` can run under
// plain `node --experimental-strip-types` without a bundler resolving the `@` path alias.

// computed label per FSD 1.5, e.g. "PIC Ekonomi - MPP" (role + domain [+ entity name])
export function computePositionName(role: string, domain: string, entityName?: string | null) {
  const base = [role, domain].filter(Boolean).join(' ')
  return entityName ? `${base} - ${entityName}` : base
}

// soft-delete only (FSD 1.5) — "deactivate" never removes the row, always flips status
export function buildDeactivatePayload(id: string) {
  return { id, status: 'Inactive' as const }
}

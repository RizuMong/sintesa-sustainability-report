// Pure business-rule helpers, kept import-alias-free so api.check.ts can run under plain node.

// AC-35/37: deadline day/month must be a real calendar bound — enforced client-side before save.
export function isValidDeadline(month: number, day: number): boolean {
  return Number.isInteger(month) && month >= 1 && month <= 12 && Number.isInteger(day) && day >= 1 && day <= 31
}

// soft-delete rule: deactivate always flips status, never hits a hard-delete endpoint.
export function buildDeactivatePayload(id: string): { id: string; status: 'Inactive' } {
  return { id, status: 'Inactive' }
}

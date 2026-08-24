// pure, dependency-free — kept separate from api.ts so api.check.ts can import
// it via a relative path without Node having to resolve the '@/' tsconfig alias.

export function isDuplicateGriCode(items: MasterGri[], griCode: string, excludeId?: string): boolean {
  const needle = griCode.trim().toLowerCase()
  return items.some((item) => item.id !== excludeId && item.gri_code.trim().toLowerCase() === needle)
}

// soft-delete only (AC-9) — flips status, never a hard delete
export function toDeactivatedGri(item: MasterGri): MasterGri {
  return { ...item, status: 'Inactive' }
}

// pure, dependency-free — kept separate from api.ts so api.check.ts can import
// it via a relative path without Node having to resolve the '@/' tsconfig alias.

export function isDuplicatePillarCode(items: MasterPillar[], code: string, excludeId?: string): boolean {
  const needle = code.trim().toLowerCase()
  return items.some((item) => item.id !== excludeId && item.code.trim().toLowerCase() === needle)
}

// soft-delete only (FSD 1.2 AC-05) — flips status, never a hard delete
export function toDeactivatedPillar(item: MasterPillar): MasterPillar {
  return { ...item, status: 'Inactive' }
}

// pure, dependency-free — kept separate from api.ts so api.check.ts can import
// it via a relative path without Node having to resolve the '@/' tsconfig alias.

export function isDuplicatePeriodYear(items: MasterPeriod[], year: number, excludeId?: string): boolean {
  return items.some((item) => item.id !== excludeId && item.year === year)
}

// soft-delete only (FSD 1.2 — Period tidak dapat dihapus permanen, hanya dinonaktifkan)
export function toDeactivatedPeriod(item: MasterPeriod): MasterPeriod {
  return { ...item, status: 'Inactive' }
}

// pure, dependency-free — kept out of api.ts so rows.check.ts can import it by relative path
// without Node resolving the '@/' tsconfig alias.

export function isSection(row: Pick<MkiQuantRow, 'type'>): boolean {
  return row.type === 'SECTION'
}

export function dataRows<T extends Pick<MkiQuantRow, 'type'>>(rows: T[]): T[] {
  return rows.filter((row) => !isSection(row))
}

// Precedence: per-row unit, then the table-wide uniform unit, then the legacy metric-level unit.
// The last term is what makes every pre-ticket indicator keep rendering its unit unchanged — an
// old record has no unit_mode, so it lands there.
export function resolveUnit(
  row: Pick<MkiQuantRow, 'unit'> | undefined,
  metric: Pick<MkiQuantMetric, 'unit'> | undefined,
  mode: MkiQuantUnitMode | undefined,
  uniform: Ref2 | null | undefined,
): Ref2 | null {
  if (mode === 'NONE') return null
  if (mode === 'PER_ROW') return row?.unit ?? null
  if (mode === 'UNIFORM') return uniform ?? null
  return metric?.unit ?? null
}

// ponytail: `sequence` doubles as the evaluate cell identity (row_key = `row_${sequence}` in
// evaluate-gri-quantitative/validation.ts), so it must never be reassigned to an existing row —
// that would repoint every already-submitted value. Display order is array order; sequence is
// identity only. Replace with a real server-issued row id when the backend grows one.
export function nextSequence(rows: Pick<MkiQuantRow, 'sequence'>[]): number {
  return rows.reduce((max, row) => Math.max(max, row.sequence ?? 0), 0) + 1
}

export function stampSequences<T extends { sequence?: number }>(rows: T[]): (T & { sequence: number })[] {
  let max = rows.reduce((m, r) => Math.max(m, r.sequence ?? 0), 0)
  return rows.map((row) => ({ ...row, sequence: row.sequence || ++max }))
}

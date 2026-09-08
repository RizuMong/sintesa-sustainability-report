// GROU-651: dependency-free (no vue, no imports) so sections.check.ts can run it directly with
// `node --experimental-strip-types`. Every renderer (builder Live Preview, Evaluate matrix) goes
// through toDisplayRows so grouping/unit-resolution logic never drifts between the two pages.
//
// Contract, verbatim from plans/GROU-651/plan.md §"Shared contract":
// sections first in their own order, each followed by its child rows; orphan rows (no
// parent_sequence, or pointing at a missing section) render at the end at depth 0. unit resolves
// to the row's own unit under PER_ROW, the table unit under UNIFORM, null under NONE/absent. A
// flat legacy rows array must come back out in the identical order, depth 0, unit null — that
// property guarantees AC-5.

export type QuantDisplayRow =
  | { kind: 'section'; sequence: number; title: string; depth: 0 }
  | { kind: 'row'; sequence: number; labels: Record<string, string>; unit: Ref2 | null; depth: 0 | 1 }

interface AnyQuantRow {
  sequence: number
  labels?: Record<string, string>
  row_type?: 'SECTION' | 'ROW'
  title?: string
  parent_sequence?: number | null
  unit?: Ref2 | null
  display_order?: number
}

export function toDisplayRows(
  rows: AnyQuantRow[],
  opts: { unit_mode?: MkiQuantUnitMode; unit?: Ref2 | null } = {},
): QuantDisplayRow[] {
  const unitMode = opts.unit_mode ?? 'NONE'
  const tableUnit = opts.unit ?? null

  const resolveUnit = (row: AnyQuantRow): Ref2 | null => {
    if (unitMode === 'PER_ROW') return row.unit ?? null
    if (unitMode === 'UNIFORM') return tableUnit
    return null
  }

  // Order by display_order when present, falling back to array order — never sort by sequence,
  // which no longer tracks visual order once reordering exists (plan.md §Sequence handling).
  const ordered = rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      const ao = a.row.display_order
      const bo = b.row.display_order
      if (ao !== undefined && bo !== undefined) return ao - bo
      if (ao !== undefined) return -1
      if (bo !== undefined) return 1
      return a.index - b.index
    })
    .map(({ row }) => row)

  const sections = ordered.filter((r) => r.row_type === 'SECTION')
  const sectionSequences = new Set(sections.map((s) => s.sequence))
  const dataRows = ordered.filter((r) => r.row_type !== 'SECTION')

  const out: QuantDisplayRow[] = []
  const consumed = new Set<number>()

  for (const section of sections) {
    out.push({ kind: 'section', sequence: section.sequence, title: section.title ?? '', depth: 0 })
    for (const row of dataRows) {
      if (row.parent_sequence === section.sequence) {
        out.push({
          kind: 'row',
          sequence: row.sequence,
          labels: row.labels ?? {},
          unit: resolveUnit(row),
          depth: 1,
        })
        consumed.add(row.sequence)
      }
    }
  }

  // Orphans: no parent_sequence, or parent_sequence points at a missing/nonexistent section.
  for (const row of dataRows) {
    if (consumed.has(row.sequence)) continue
    const parent = row.parent_sequence
    if (parent == null || !sectionSequences.has(parent)) {
      out.push({
        kind: 'row',
        sequence: row.sequence,
        labels: row.labels ?? {},
        unit: resolveUnit(row),
        depth: 0,
      })
    }
  }

  return out
}

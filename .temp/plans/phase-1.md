# Phase 1 — pure row helpers + check

**Depends on:** phase 0 (types)

## Goal

One module both pages read: what is a section, which rows carry values, which unit a cell shows, and
how a sequence is assigned so it never moves under already-submitted data.

## Files owned

- `src/services/master-key-indicator-quantitative/rows.ts` (new)
- `src/services/master-key-indicator-quantitative/rows.check.ts` (new)
- `src/services/master-key-indicator-quantitative/index.ts` (add `export * from './rows'`)

## Context

Patterns to imitate:
- pure helper module + `ponytail:` comment: `src/services/evaluate-gri-quantitative/validation.ts:1-2`
- check-file run-command header + `node:assert/strict`: `src/services/master-unit/api.check.ts:1-11`
- unit lookup the builder does today: `src/pages/master-key-indicator-quantitative/DetailPage.vue:1024`

`rows.ts` must stay import-free so `rows.check.ts` can `import ... from './rows.ts'` without the
`@/` alias. Types are ambient globals, so no type import is needed either.

## Steps

1. `rows.ts`:

   ```ts
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
   ```

2. `rows.check.ts` — header comment with the exact run command, then assert:
   - `isSection` true only for `type: 'SECTION'`; a legacy row (no `type`) is not a section.
   - `dataRows` drops sections and keeps legacy rows.
   - `resolveUnit` with `mode === undefined` returns the metric unit (the AC 5 path).
   - `resolveUnit('PER_ROW')` returns the row unit and ignores the metric unit; returns `null` when
     the row has none.
   - `resolveUnit('UNIFORM')` returns the uniform unit and ignores both row and metric.
   - `resolveUnit('NONE')` returns `null` even when a metric unit exists.
   - `nextSequence` on `[{sequence:1},{sequence:7}]` is `8` — not `3` — so a deleted-then-readded
     row never reuses a dead identity.
   - `stampSequences` leaves existing sequences untouched after a reorder
     (`stampSequences([{sequence:3},{sequence:1}]).map(r => r.sequence)` is `[3, 1]`) and fills only
     rows that arrive without one.

3. `index.ts` — append `export * from './rows'` next to the existing api/composables re-exports.

## Acceptance

```
node --experimental-strip-types src/services/master-key-indicator-quantitative/rows.check.ts
pnpm build
```

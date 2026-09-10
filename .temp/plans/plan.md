# MKI Quantitative — Section grouping + configurable Unit + Evaluate compatibility

Builder (`master-key-indicator-quantitative`) supports only a flat row list and a metric-level unit.
Ticket asks for Section grouping, a 3-mode unit setting (Tidak ada / Seragam / Per baris), and an
Evaluate GRI Quantitative page that renders the new structure without breaking already-submitted
values built on the old flat structure.

## Current state — read, not assumed

- `MkiQuantRow = { sequence, labels }` (`src/services/master-key-indicator-quantitative/types.d.ts:24-27`) — flat.
- Builder form row is `type FormRow = { labels: Record<string,string> }`
  (`src/pages/master-key-indicator-quantitative/DetailPage.vue:942`); rows edited at `:492-535`,
  live preview at `:680-710`, drag via `onDragStart/onDrop('rows', i)` (`:1085-1100`).
- Unit lives on the metric only: `MkiQuantMetric.unit: Ref2 | null`, picked from `useGetMasterUnit()`
  (`DetailPage.vue:906-907`, select at `:410-425`, resolved by `unitName()` at `:1024`).
- `buildPayload()` (`DetailPage.vue:1126-1152`) restamps `rows[].sequence = i + 1` from array order.
- Evaluate cell identity is that sequence: `rowKey(seq) = 'row_' + seq`, `cellKey(seq, metricKey)`
  (`src/services/evaluate-gri-quantitative/validation.ts:~105-112`), consumed by
  `fromSubmissionValues()` keyed `${row_key}:${metric_key}`.
- Evaluate matrix renders `v-for="row in item.rows"` in array order and passes `:unit="metric.unit?.name"`
  (`src/pages/evaluate-gri-quantitative/DetailPage.vue:160-181`); save builds
  `item.rows.flatMap(row => item.metrics.map(...))` (`:766-767`).
- API: app calls `/v1/mki/gri-quantitative/*` (`services/master-key-indicator-quantitative/api.ts`).
  Bruno has both `api/Master Key Indicator/GRI - Quantitative/V1/` and `V2/`; V2 differs only by the
  `/v2/` url — no examples block. Which version carries this change is a BE question (below).

## Landmine — fix inside this ticket, not after

`buildPayload` restamps `sequence` from array order, and `sequence` IS the evaluate cell identity.
So **reordering rows today already orphans previously submitted values**. Inserting a Section row
would shift every following sequence and silently blank filled cells — a direct AC 5 failure.

Fix: sequence becomes a stable identity, not an order. Rows keep the sequence they loaded with; a
newly added row/section takes `max + 1`. Display order is array order, which both the builder
preview and the evaluate matrix already use.

## Shape — flat list with marker rows, not nesting

```ts
interface MkiQuantRow {
  sequence: number
  labels: Record<string, string>
  type?: 'SECTION'      // absent = data row, so every existing record parses unchanged
  name?: string         // section title
  unit?: Ref2 | null    // per-baris unit
}

interface MkiGriQuantitative {
  unit_mode?: 'NONE' | 'UNIFORM' | 'PER_ROW'  // absent = legacy: metric-level unit
  unit?: Ref2 | null                          // UNIFORM only
}
```

Flat over nested `children[]`: one array keeps the existing drag/drop, sequence stamping and both
`v-for` render paths working. Nesting needs recursive drag, two-level sequences and a rewrite of
both tables. Backend takes any array of object either way (per ticket note), so nesting buys nothing.

Unit precedence, one function, used by builder preview and evaluate alike:
`row.unit` -> top-level uniform `unit` -> `metric.unit` (legacy) -> none.

Legacy records have no `type` and no `unit_mode`, so they fall through to `metric.unit` and render
exactly as today — that is the whole of AC 5, and it costs one `??` chain.

## Phases

| # | Goal | Files | Depends on |
|---|------|-------|------------|
| 0 | Contract: types + Bruno collection | `mki/types.d.ts`, `evaluate/types.d.ts`, `api/.../V2/{Create,Update}.yml`, `api/.../Index.yml` | none |
| 1 | Pure row helpers + check | `mki/rows.ts`, `mki/rows.check.ts` | 0 |
| 2 | Builder: sections, unit modes, preview | `pages/master-key-indicator-quantitative/DetailPage.vue` | 1 |
| 3 | Evaluate: render + save | `pages/evaluate-gri-quantitative/DetailPage.vue`, `evaluate/validation.ts`, `evaluate/api.check.ts` | 1 |
| 4 | As-Built docs | `docs/mki-quantitative.md`, `docs/evaluate-quantitative.md` | 2, 3 |

Phases 2 and 3 are parallel — different page files, one shared helper module they both only read.

## Shared contract (phase 1 owns it)

```ts
// src/services/master-key-indicator-quantitative/rows.ts — pure, no imports
export function isSection(row: MkiQuantRow): boolean
export function dataRows(rows: MkiQuantRow[]): MkiQuantRow[]
export function resolveUnit(
  row: Pick<MkiQuantRow, 'unit'>,
  metric: Pick<MkiQuantMetric, 'unit'>,
  mode: MkiQuantUnitMode | undefined,
  uniform: Ref2 | null | undefined,
): Ref2 | null
export function nextSequence(rows: Pick<MkiQuantRow, 'sequence'>[]): number
export function stampSequences<T extends { sequence?: number }>(rows: T[]): (T & { sequence: number })[]
```

Kept out of `api.ts` so `rows.check.ts` imports it by relative path with no `@/` alias resolution,
same reason as `evaluate-gri-quantitative/validation.ts:1-2`.

## Verification

```
pnpm build
node --experimental-strip-types src/services/master-key-indicator-quantitative/rows.check.ts
node --experimental-strip-types src/services/evaluate-gri-quantitative/api.check.ts
```

Manual, the AC 5 regression that matters:
1. Open an existing filled submission on a legacy indicator (no `unit_mode`, no section rows) —
   values sit in the right cells, metric-level unit still shows.
2. Edit that indicator, add a Section above existing rows, reorder, save.
3. Reopen the same submission — values still in the same cells, nothing blanked.

## Open questions for BE (ticket AC 6)

1. Does `rows[]` round-trip unknown keys (`type`, `name`, `unit`) on index **and** on the evaluate
   detail echo (`items[].rows`), not just on MKI index?
2. Are new **top-level** `unit_mode` / `unit` persisted, or does the schema drop unknown top-level
   fields? If dropped, unit config moves inside `rows[]` and phase 3 needs a mode-inference fallback.
3. Does `evaluate-gri-quantitative/detail` copy the MKI rows verbatim, sections included?
4. v1 vs v2 MKI endpoints — the app is on `/v1`, Bruno's V2 is a bodyless url stub. Which carries this?

Questions 1 and 3 do not block phases 0-2. Only phase 3's unit source depends on question 2, and it
ships behind `resolveUnit()` so a different answer changes one function, not two pages.

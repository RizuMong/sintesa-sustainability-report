# Phase 3 — Evaluate GRI Quantitative: render sections, resolve units, keep old values

**Depends on:** phase 1

**Parallel with:** phase 2

## Goal

Ticket AC 4 and AC 5: the data-entry matrix renders Section rows and the configured unit, and every
already-submitted value on a legacy indicator still lands in the cell it was saved from.

## Files owned

- `src/pages/evaluate-gri-quantitative/DetailPage.vue`
- `src/services/evaluate-gri-quantitative/validation.ts`
- `src/services/evaluate-gri-quantitative/api.check.ts`

## Context — the exact spots

- matrix head/body: `DetailPage.vue:140-200`; the unit prop today is `:unit="metric.unit?.name"` (`:181`)
- cell id: `cellId(itemId, rowSequence, metricKey)` at `:704`, over `cellKey` from `validation.ts`
- seeding from saved values: `fromSubmissionValues(item.values)` at `:712`
- save: `values: item.rows.flatMap((row) => item.metrics.map(...))` at `:766-767`
- `toSubmissionValue` / `fromSubmissionValues` / `rowKey` / `cellKey`: `validation.ts:~100-135`

## Why the old data survives

`fromSubmissionValues` keys cells `${row_key}:${metric_key}` and `row_key` is `row_${sequence}`.
Phase 2 stops sequences from moving, so a legacy submission's keys keep matching their rows even
after the indicator gains sections. Nothing in this phase may reintroduce an index-derived key.

## Steps

1. `validation.ts` — `toSubmissionValue` takes the resolved unit instead of reading `metric.unit`:

   ```ts
   export function toSubmissionValue(
     metric: { key: string; name: string; input_type: MkiQuantInputType; unit: Ref2 | null },
     rowSequence: number,
     raw: string | number | boolean | null | undefined,
     unit: Ref2 | null = metric.unit,   // default keeps every existing call site correct
   ): EvaluateGriQuantitativeValue
   ```
   The body's last line becomes `unit: unit ? { id: unit.id, name: unit.name } : {}` — still `{}`
   and not `null` for "no unit", which is what the Update contract shows.

   `rowKey` / `cellKey` / `fromSubmissionValues` are untouched. Do not add a section branch to
   them — sections never produce a value, so they never produce a key.

2. `DetailPage.vue` matrix body (`:159-200`) — one `v-if` split on `isSection(row)`:
   - section: `<MpTableRow>` with a single `<MpTableCell as="td" :colspan="item.columns.length + item.metrics.length">`,
     the name in `weight="semiBold"`, no `DynamicFieldInput`. Verify the colspan/cell props with the
     `pixel` skill's `get-component` before writing them.
   - data row: unchanged except `:unit="resolveUnit(row, metric, item.unit_mode, item.unit)?.name"`
     in place of `:unit="metric.unit?.name"` (`:181`).

   Import `isSection` / `resolveUnit` from `@/services/master-key-indicator-quantitative` — the MKI
   module owns the row shape; evaluate only reads it.

3. Save (`:766-767`) — skip sections and pass the resolved unit:

   ```ts
   values: dataRows(item.rows).flatMap((row) =>
     item.metrics.map((metric) =>
       toSubmissionValue(metric, row.sequence, cells[cellId(item.id, row.sequence, metric.key)],
         resolveUnit(row, metric, item.unit_mode, item.unit)),
     ),
   ),
   ```
   Sections carry no `labels` and no cell, so emitting a value for one would send a row_key the
   builder never rendered.

4. Read-only / approver view uses the same template branch — there is one matrix, not two, so no
   second edit needed. Confirm by grepping the file for a second `item.rows` loop; at time of
   writing there is only the one at `:160`.

5. `api.check.ts` — add assertions:
   - `toSubmissionValue(metric, 3, 5)` with no 4th argument still emits the metric's unit
     (the legacy call path) and `row_key: 'row_3'`.
   - passing an explicit unit overrides the metric's; passing `null` emits `{}`.
   - a round trip `fromSubmissionValues(values)` recovers the cell keyed `row_3:<metric_key>` after
     a section row was inserted ahead of it in the array — i.e. build a `rows` array
     `[{sequence:9,type:'SECTION'}, {sequence:3,...}]`, and assert the key is still `row_3`.

## Acceptance

```
node --experimental-strip-types src/services/evaluate-gri-quantitative/api.check.ts
pnpm build
```

Manual, in this order, because step 3 is the actual AC 5 proof:
1. Open a filled submission on a legacy indicator — values in their cells, metric unit still shown.
2. Fill and save a submission on a new sectioned indicator in each unit mode — sections render as
   headers with no inputs, units show per row / uniformly / not at all.
3. Add a section to the legacy indicator from the builder, save it, reopen the submission from
   step 1 — same values, same cells, nothing blanked.

# GROU-651 · Phase 4 — Evaluate GRI Quantitative renders sections + units, old data untouched

## Goal

The data-entry/evaluation screen renders indicators built with the new Section grouping and unit
modes, and every previously submitted value on an old flat-row indicator keeps displaying and
saving exactly as it does today.

## Files owned

- `src/pages/evaluate-gri-quantitative/DetailPage.vue`
- `src/services/evaluate-gri-quantitative/validation.ts`
- `src/services/evaluate-gri-quantitative/api.check.ts`
- `docs/evaluate-quantitative.md` (append the As Built note)

Do **not** touch `services/evaluate-gri-quantitative/types.d.ts` — phase 1 owns it.

## Depends on

Phase 1 (types + `toDisplayRows`), Phase 2 (`QuantSchemaTable.vue`).

## Context

Ticket AC-4 and AC-5. AC-5 is the one that matters: *"Existing indicators and their previously
submitted values (old flat-row structure) remain unaffected and display correctly."*

Current wiring in `DetailPage.vue`:
- matrix markup `:139-190`, one `MpTableRow` per `item.rows`, `DynamicFieldInput` per metric,
  `:unit="metric.unit?.name"` at `:181`.
- cell read: `cells[cellId(item.id, row.sequence, metric.key)]`.
- save at `:766`: `item.rows.flatMap(row => item.metrics.map(m => toSubmissionValue(m, row.sequence, cells[...])))`.
- `toSubmissionValue` / `fromSubmissionValues` / `rowKey` in `validation.ts:93-140`; `row_key` is
  `row_<sequence>`.

Two invariants to preserve, and they are the whole phase:
1. **Section rows are not data.** They must never enter `values[]` on save, or the BE gets cells
   with a `row_key` that has no metrics behind it.
2. **`row.sequence` is the cell identity.** Keep passing the row's original sequence to
   `toSubmissionValue`/`cellId`. Grouping changes render order only.

`api.check.ts` already has a `row_key: 'row_1'` fixture at `:131` — extend that file, don't start a
new one.

Unit resolution precedence for the input's `:unit`: the row's resolved unit from `toDisplayRows`
when `unit_mode` is `UNIFORM`/`PER_ROW`, otherwise fall back to today's `metric.unit?.name`. That
fallback is what keeps old indicators looking unchanged.

## Steps

1. Replace the matrix table body with `<QuantSchemaTable>`, passing `item.rows`, `item.unit_mode`,
   `item.unit`, and rendering `DynamicFieldInput` in the `#metric-cell` slot with the same
   `readOnly`/`cells` bindings as today.
2. Resolve the input's unit per the precedence above.
3. In `save()`, filter section rows out before building `values[]` — drive it off the same
   `toDisplayRows` output (`kind === 'row'`) so render and save cannot disagree.
4. Add assertions to `api.check.ts`:
   - a legacy item (flat rows, no `unit_mode`) produces the **exact** `values[]` array it produces
     on `main` — same length, same `row_key`s.
   - an item with two sections produces `values[]` containing **no** section `row_key`s, and the
     data rows keep their original sequences.
   - `fromSubmissionValues` still rehydrates a legacy saved payload into the right cells after
     grouping is applied.
5. Append the As Built note to `docs/evaluate-quantitative.md`.

## Acceptance

```
pnpm build
node --experimental-strip-types src/services/evaluate-gri-quantitative/api.check.ts
```

Manual: open an existing **filled** submission — every previously entered value is still in its
cell and the table looks as it did before (AC-5). Then open a submission for a new sectioned
indicator: group headers render, per-row units show, saving round-trips.

# Phase 0 — contract: types + Bruno collection

**Depends on:** none

## Goal

Land the new field names in both `types.d.ts` files and in the Bruno collection, so phases 1-3 code
against one written shape instead of three guesses.

## Files owned

- `src/services/master-key-indicator-quantitative/types.d.ts`
- `src/services/evaluate-gri-quantitative/types.d.ts`
- `api/Master Key Indicator/GRI - Quantitative/V2/Create.yml`
- `api/Master Key Indicator/GRI - Quantitative/V2/Update.yml`
- `api/Master Key Indicator/GRI - Quantitative/Index.yml`

## Steps

1. `master-key-indicator-quantitative/types.d.ts` — extend `MkiQuantRow` (`:24-27`) and add the
   unit-mode union. Every new field optional: absent = legacy record.

   ```ts
   type MkiQuantUnitMode = 'NONE' | 'UNIFORM' | 'PER_ROW'

   interface MkiQuantRow {
     sequence: number
     labels: Record<string, string>
     // section grouping — a marker row, not a container. Rows that follow it belong to it visually
     // until the next section. Flat so drag-reorder and `sequence` identity stay one-dimensional.
     type?: 'SECTION'
     name?: string
     // per-row unit, only when the indicator's unit_mode is 'PER_ROW'
     unit?: Ref2 | null
   }
   ```

   Add to both `MkiGriQuantitative` and `MkiGriQuantitativePayload`:

   ```ts
   // ponytail: unit_mode/unit are optional because a record saved before this ticket has neither —
   // undefined means "legacy", and resolveUnit() falls back to the metric-level unit. Make them
   // required only after a backfill.
   unit_mode?: MkiQuantUnitMode
   unit?: Ref2 | null
   ```

2. `evaluate-gri-quantitative/types.d.ts` — mirror on the consuming side.
   `EvaluateGriQuantitativeRow` (`:44-47`) gets the same three optional fields;
   `EvaluateGriQuantitativeItem` gets `unit_mode?` / `unit?`. Do **not** re-declare
   `MkiQuantUnitMode` here — it is already global from the MKI module (same `declare global` trick
   the file already relies on for `MkiQuantMetric`).

3. Bruno `V2/Create.yml` + `V2/Update.yml` — add the fields to the request body doc and to the
   `examples:` block. V2/Create currently has no `examples:` (only V1 does — `diff V1/Create.yml
   V2/Create.yml` is url + the whole examples block); copy V1's example over, bump the url to
   `/v2/`, then edit. The example should show all three unit modes' data being possible, but pick
   one per example: use `PER_ROW` in Create and `UNIFORM` in Update so both are documented.

   ```jsonc
   "unit_mode": "PER_ROW",   // NONE | UNIFORM | PER_ROW; absent = legacy metric-level unit
   "unit": null,             // Ref2, only meaningful when unit_mode = UNIFORM
   "rows": [
     { "sequence": 1, "type": "SECTION", "name": "Limbah Non B3", "labels": {} },
     { "sequence": 2, "labels": { "kategori": "Digunakan Kembali" }, "unit": { "id": "uuid", "name": "ton" } },
     { "sequence": 3, "labels": { "kategori": "Didaur Ulang" }, "unit": { "id": "uuid", "name": "ton" } },
     { "sequence": 4, "type": "SECTION", "name": "Limbah B3", "labels": {} }
   ]
   ```

4. `Index.yml` — the response example (`rows` at `:120`) gets the same two extra row entries, so the
   read path is documented as returning what the write path sent.

5. Leave `api.ts` on `/v1` for now — the v1/v2 switch is BE question 4 in `plan.md`, and this ticket
   does not need it to be answered.

## Acceptance

`pnpm build` passes (types only, no call sites changed yet). The Bruno files stay valid
opencollection YAML — `grep -c 'unit_mode'` on the three yml files returns non-zero for each.

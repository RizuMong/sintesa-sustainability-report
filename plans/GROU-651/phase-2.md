# GROU-651 · Phase 2 — Shared grouped table renderer

## Goal

One `QuantSchemaTable.vue` that renders a columns/metrics/rows matrix with Section header rows,
indented child rows and an optional Unit column, used by both the builder's Live Preview and the
Evaluate screen so the two cannot drift.

## Files owned

- `src/components/QuantSchemaTable.vue` (new)

Nothing else. Phases 3 and 4 do the wiring on their own pages.

## Depends on

Phase 1 for the `QuantDisplayRow` type and `toDisplayRows`. You may start immediately by coding to
the signature in `plan.md` §"Shared contract"; import it once phase 1 lands.

## Context

The two call sites this component replaces, copy their markup and Pixel 3 component usage:
- builder preview: `src/pages/master-key-indicator-quantitative/DetailPage.vue:222-249`
- evaluate matrix: `src/pages/evaluate-gri-quantitative/DetailPage.vue:139-190`

They differ only in what goes in a metric cell: the builder shows an input-type icon, Evaluate
shows a live `DynamicFieldInput`. So the metric cell **must** be a scoped slot, not a prop:

```vue
<QuantSchemaTable :columns="columns" :metrics="metrics" :rows="rows"
                  :unit-mode="unitMode" :unit="unit">
  <template #metric-cell="{ row, metric, unit }"> ... </template>
</QuantSchemaTable>
```

`row` in that slot payload is a `QuantDisplayRow` of `kind: 'row'` — its `sequence` is the value
callers pass to `toSubmissionValue`/`cellId`, so it must be the **original** row sequence,
untouched by grouping. Section rows never invoke the slot.

Pixel 3 only: `MpTable*`, `MpText`, `MpIcon`, `css()`. Icons come from `@mekari/pixel3`'s
`IconName`; there is no percent glyph (see the `inputTypeOptions` comment at
`master-key-indicator-quantitative/DetailPage.vue:302`) — that stays the caller's problem, in the
slot.

## Steps

1. Props: `columns: {key,name}[]`, `metrics: MkiQuantMetric[]`, `rows` (raw row array),
   `unitMode?: MkiQuantUnitMode`, `unit?: Ref2 | null`. Compute display rows with `toDisplayRows`.
2. Header: one cell per column, then one per metric, then a trailing **"Satuan"** cell rendered
   only when `unitMode` is `UNIFORM` or `PER_ROW`.
3. Section row: a single full-width `MpTableCell` with `:colspan` covering every column, the title
   in `weight="semiBold"`, a subtle `background.stage` fill.
4. Child row: indent the **first** column cell (`paddingLeft` bump when `depth === 1`), then the
   column labels, then a `#metric-cell` slot per metric, then the unit cell when applicable.
5. Empty state: keep the existing "No rows yet" row with a correct colspan.

## Acceptance

- `pnpm build` clean.
- Rendered against a legacy flat `rows` array with no `unitMode`, the output markup is
  cell-for-cell what `DetailPage.vue:222-249` produces today: no Satuan column, no indent, no
  section rows. Verify by eye in the builder once phase 3 wires it.
- Rendered with two sections plus an orphan row, the orphan appears last and unindented.

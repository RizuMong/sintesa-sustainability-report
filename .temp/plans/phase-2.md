# Phase 2 — builder: Section rows, unit modes, live preview

**Depends on:** phase 1

**Parallel with:** phase 3 (different page file; both only read `rows.ts`)

## Goal

Ticket AC 1, 2, 3: add/reorder/delete Sections with rows under them, a 3-mode Satuan (Unit) setting
pulling from Master Unit, and a Live Preview that reflects both.

## Files owned

- `src/pages/master-key-indicator-quantitative/DetailPage.vue`

## Context — the exact spots

- Step-2 "Rows" panel header + Add Row button: `:449-472`
- Row edit table body: `:490-535`; empty state `:536-556`
- Metric unit select (stays, see step 5): `:410-425`
- Live preview table: `:612-725`; row body `:680-710`
- `FormRow` / `FormMetric` / `form`: `:936-951`
- `addRow` / `removeRow`: `:1075-1083`
- drag: `onDragStart` / `onDrop` / `move`: `:1085-1101`
- load `watch(detail, ...)`: `:1103-1121`
- `buildPayload`: `:1126-1152`
- units already loaded: `useGetMasterUnit()` at `:906-907`, `unitName()` at `:1024`

Load the `pixel` skill before touching the template — it governs which Pixel 3 components and props
are legal here, and the section header cell / unit select must be verified with `get-component`
rather than guessed.

## Steps

1. Form model — `sequence` joins `FormRow`, because it is now identity, and the section fields:

   ```ts
   type FormRow = {
     sequence?: number            // undefined until saved; stampSequences fills it
     labels: Record<string, string>
     type?: 'SECTION'
     name?: string
     unitId: string               // '' = none; only read when unitMode === 'PER_ROW'
   }
   ```
   `form` gains `unitMode: 'NONE' as MkiQuantUnitMode` and `unitId: ''` (the uniform unit).

2. `addRow()` keeps building `labels` from the columns; add `addSection()` next to it:

   ```ts
   function addSection() {
     form.rows.push({ type: 'SECTION', name: '', labels: {}, unitId: '' })
   }
   ```
   Button "Tambah Section" beside the existing Add Row in the step-2 header (`:463-471`), same
   `size="sm" variant="secondary" left-icon="add"`. Add Row's `:is-disabled="!form.columns.length"`
   does **not** apply to sections — a section has no label cells.

3. Row table body (`:490-535`) — split on `isSection(row)`:
   - section: drag handle cell, then one `<MpTableCell as="td" :colspan="form.columns.length">`
     holding an `MpInput v-model="row.name"` with placeholder "Nama section", then the delete cell.
     If `unitMode === 'PER_ROW'` the unit column still needs a spacer cell so the grid stays square.
   - data row: unchanged, plus one extra cell when `unitMode === 'PER_ROW'` — an `MpSelect`
     `v-model="row.unitId"` over `units`, with a "No unit" option, mirroring the metric select at
     `:416-425`.
   - column header row (`:476-489`) and the empty-state `colspan` (`:539-542`) both grow by one when
     `unitMode === 'PER_ROW'`.

4. Deleting a section deletes the header only; the rows that followed stay and fall into the section
   above (or into no section). Say so in the button's `aria-label` / confirm copy — the flat model
   makes this the honest behaviour, and it is the reason rows cannot be orphaned.

   `removeRow(i)` needs no change: one `splice` on one array covers both kinds. Same for
   `onDrop('rows', i)` — dragging a section moves the header alone, which is what "reorderable
   sections" means in a flat list.

5. Unit setting — an `MpSelect` in the step-2 panel header: Tidak ada / Seragam / Per baris,
   `v-model="form.unitMode"`. When `Seragam`, show a second Master Unit select bound to
   `form.unitId`. When not `NONE`, disable the per-metric unit select (`:410-425`) with a hint
   ("Diatur di Satuan (Unit)") — keep the control mounted so a legacy indicator's metric unit is
   still visible, and still saved, rather than silently dropped.

6. Live preview (`:680-710`):
   - section row: one `<MpTableCell as="td" :colspan="form.columns.length + form.metrics.length">`
     with the name in `weight="semiBold"`, no inputs.
   - data row: `:unit="resolveUnit(row-as-Ref2-shaped, metric, form.unitMode, uniformUnit)?.name"`.
     Build the Ref2 from `unitId` with the existing `units.find(...)`; a small
     `computed` `unitRef(id)` next to `unitName()` (`:1024`) keeps the template readable.
   - preview scratch keys stay `${i}:${mi}` — preview values are never part of the payload
     (existing `ponytail:` note at `:953-955`), so section rows simply consume an index. Fine.

7. `watch(detail, ...)` (`:1117`) — carry the new fields in:

   ```ts
   form.rows = next.rows.map((r) => ({
     sequence: r.sequence,
     labels: { ...r.labels },
     type: r.type,
     name: r.name,
     unitId: r.unit?.id ?? '',
   }))
   form.unitMode = next.unit_mode ?? 'NONE'
   form.unitId = next.unit?.id ?? ''
   ```
   `unit_mode ?? 'NONE'` is the legacy read: an old record shows "Tidak ada" in the selector while
   its metric-level units keep rendering, because `resolveUnit` is what draws them and it only
   consults `unit_mode` when the record actually has one. If that reads as a lie in the UI, label
   the option row "Tidak ada (satuan diatur per metrik)" when `next.unit_mode` was absent — copy
   call, not a logic change.

8. `buildPayload` (`:1148-1151`) — **the AC 5 line**. Replace the restamp:

   ```ts
   rows: stampSequences(form.rows).map((r) => ({
     sequence: r.sequence,
     labels: { ...r.labels },
     ...(r.type ? { type: r.type, name: r.name ?? '' } : {}),
     ...(form.unitMode === 'PER_ROW' ? { unit: unitRef(r.unitId) } : {}),
   })),
   unit_mode: form.unitMode,
   unit: form.unitMode === 'UNIFORM' ? unitRef(form.unitId) : null,
   ```

   Do not write `sequence: i + 1` anywhere. That is the bug that would blank submitted data the
   first time anyone reorders rows or inserts a section (see `plan.md`, "Landmine").

9. `validationErrors` (`:961-968`) — add: a `PER_ROW` indicator must have a unit on every data row;
   a `UNIFORM` one must have `form.unitId`. Sections need no unit and no labels. Do not require a
   section name — an unnamed section is a rendering choice, not a broken payload.

## Acceptance

```
pnpm build
```

In the app: create an indicator with two sections and rows under each, drag a section, drag a row,
delete a section (its rows survive), switch the unit mode through all three values, save, reload the
detail page — everything comes back in the same order with the same units. Live Preview shows the
section headers and the right unit per row in each mode.

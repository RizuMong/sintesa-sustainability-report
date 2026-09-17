# MKI GRI-Quantitative Schema Builder — As Built

> **2026-08-28 update.** The mock data layer is gone; both screens now run on the real endpoints in
> `api/Master Key Indicator/GRI - Quantitative/`. Sections 2 and 3 below have been rewritten to
> match; Section 4's UI notes still hold except where they say "mock".

> **2026-09-14 update (GROU-662).** Create/Edit screen adjustments: the per-metric Unit picker in
> Step 1 is gone (value still persisted for legacy records), Status is now an editable `MpSelect`
> sent on create (and update, as a placeholder), Status + Last Updated moved from the header into
> the identity panel (Last Updated as a disabled `MpInput`), panel descriptions moved from inline
> text to tooltips, all control copy is English, and the header Delete button is icon-only.

## 1. Goal & Scope

The MKI GRI-Quantitative schema builder (Platform Administrator side only), wired against the real
workflow API through `src/services/master-key-indicator-quantitative/` (new services module shape).

**In scope (implemented):**
- List/Index screen (`ListPage.vue`) — browse existing schemas, filter, search, delete (soft).
- Create/Edit screen (`DetailPage.vue`) — the builder form: category, code, columns, metrics, rows, live preview.

**Out of scope (unchanged from original plan):**
- Real API calls / backend implementation.
- Submission-side (Subsidiary filling in actual values) — separate future plan.
- Auth, routing shell, or anything outside this feature's screens.

Stack: Vue 3 (`<script setup>`) + `@mekari/pixel3` design system + `vue-router`, following the conventions already used by the sibling `gri-quantitative` and `evaluate-gri-quantitative` features in this repo.

---

## 2. Deviations from the original locked contract

- **`ids` → `code`**: the GRI code is a `code` string on the record, not an FK into `master-gri`.
  It is still *picked* from `GET /v1/master-gri/index` (Active rows only) rather than typed free-text
  — an earlier revision of this doc dropped the lookup; it is back.
- **`name` → `description`**: the endpoints call the human-readable title `description`. The form
  label, the list column and the page heading all say "Description".
- **`status` is only half-contracted.** `Delete.yml` is a hard `DELETE`, no soft-delete concept.
  `V1/Create.yml` and `V2/Create.yml` request bodies do carry `"status"`, so the Create/Edit screen's
  Status pill sends it on create — and on update too, as a sibling-convention placeholder, though
  neither `Update.yml` body documents the field. `Index.yml`'s response never returns `status` at
  all, so a saved value is not readable back: reloading a record always falls back to `Active` (see
  the `ponytail:` note on `MkiGriQuantitative.status`). Remove the fallback and stop treating update
  as a placeholder once the backend grows a real, round-trippable field.
- **`master-gri` field name mismatch**: `GET /v1/master-gri/index` answers the code under `code`
  while the app's `MasterGri` type calls it `gri_code`. `src/services/master-gri/api.ts` maps between
  the two on the way in and out.

---

## 3. API Contract

`src/services/master-key-indicator-quantitative/` — new services module shape (`api.ts` +
`composables.ts` + `types.d.ts` + `index.ts`), all four endpoints confirmed in
`api/Master Key Indicator/GRI - Quantitative/`.

| Call | Endpoint |
| --- | --- |
| `getList({ name?, category_id? })` | `GET /v1/mki/gri-quantitative/index` |
| `create(payload)` | `POST /v1/mki/gri-quantitative/create` |
| `update(payload & { id })` | `POST /v1/mki/gri-quantitative/update` |
| `remove(id)` | `DELETE /v1/mki/gri-quantitative/delete?id=` |

There is **no fetch-by-id endpoint** — Index answers the full record (columns/metrics/rows) per row,
so `useMkiGriQuantitativeDetail(id)` picks it out of the list query, mirroring
`master-entity`'s `useMasterEntityDetail`.

### Create / Update body (`MkiGriQuantitativePayload`)
```ts
{
  id?: string                        // update only
  category_id: { id: string; name: string }   // from GET /v1/master-category/index
  code: string                       // from GET /v1/master-gri/index
  description: string
  columns: { key: string; name: string; sequence: number }[]
  metrics: {
    key: string
    name: string
    input_type: 'NUMBER' | 'TEXT' | 'PERCENTAGE' | 'DATE' | 'YES_NO'
    unit: { id: string; name: string } | null   // from GET /v1/master-unit/index
    sequence: number
  }[]
  rows: {
    sequence: number
    labels: Record<string, string>
    type?: 'SECTION'                  // marker row — see Section 4.2
    name?: string                     // section title, SECTION rows only
    unit?: { id: string; name: string } | null   // always sent per row (see note below); may be null
  }[]
  unit_mode?: 'NONE' | 'UNIFORM' | 'PER_ROW'   // absent = legacy metric-level unit
  unit?: { id: string; name: string } | null   // UNIFORM mode only
}
```
- `columns[].key` / `metrics[].key` are auto-derived from the name via `slugify()`, never typed.
- `created_at` / `updated_at` come back as **epoch milliseconds**, not ISO strings.
- The input-type enum is SCREAMING_CASE here and is declared as `MkiQuantInputType`, separate from
  the Title-cased global `MkiInputType` that `services/mki-sdg` owns. `DynamicFieldInput` case-folds
  both.

### Lookup modules
- `src/services/master-category/` → `useGetMasterCategory()` (`GET /v1/master-category/index`)
- `src/services/master-gri/` → `useGetMasterGri()` (`GET /v1/master-gri/index`)
- `src/services/master-unit/` → `useGetMasterUnit()` (`GET /v1/master-unit/index`)

---

## 4. Screens

### 4.1 List Screen (`ListPage.vue`)
- Flat table: Code (leftmost), Description, Category, Status, Last Updated.
- "Last Updated" formatted as `YYYY-MM-DD HH:MM:SS`.
- Filter toolbar lives in the page **frame** (`background.surface`, same band as the Create button) rather than in the content area — search (name only, with search-icon prefix), Category select, Status select, all fixed-width via a wrapping `MpFlex` + native `is-full-width` (avoids fighting the component's internal chevron positioning).
- "Clear filters" ghost link appears only when a filter is active.
- Status shown as `MpBadge` (Active = completed/green, Inactive = announcement/muted).
- Row click or "Edit" popover item → Create/Edit screen with `?id=`.
- "Create" button (top-right) → Create/Edit screen with no `id`.
- Delete lives on the detail screen → confirm modal → hard `DELETE`.

### 4.2 Create/Edit Screen (`DetailPage.vue`)

Laid out to match the reviewed HTML mockup (`Master Key Indicator - Global Reporting Initiative
Quantitative.html`): an identity panel on top, then numbered step panels side-by-side with the
preview. The mockup's own top bar (Cancel / Save Configuration) was **not** adopted — the existing
back-button + breadcrumb + status + Delete header stays.

The mockup's row **Sections** and table-level **Unit mode** (none / uniform / per-row), reverted in
`b7c7d52` for lack of a contract field, are now built (GROU-649 follow-up). Two deliberate deviations
from the mockup's implied data model:

- **Sections are flat marker rows** (`type: 'SECTION'`), not a nested `children[]`. One array keeps
  drag-reorder, `sequence` identity, and both the builder table and the evaluate matrix
  one-dimensional — the mockup's grouping is a rendering concern, not a data hierarchy. Consequence:
  deleting a section header deletes the header only; the rows that followed it stay in place and fall
  under whichever section (if any) now precedes them.
- **`sequence` is an identity, not a display order.** Array order is the display order. A row keeps
  the `sequence` it loaded with; a new row/section takes `max(existing) + 1`. This mattered before
  Sections too — Evaluate's `row_key` (`row_${sequence}`) is how a filled cell finds its row, so
  restamping `sequence` from array index (the old `buildPayload()` behavior) already orphaned
  submitted values on any reorder. Inserting a Section shifts every following array index, which
  would have blanked every cell after it. `stampSequences()` (`master-key-indicator-quantitative/rows.ts`)
  fixes this: it only assigns a fresh sequence to rows that don't have one yet.
- **Uniformity is UI-only**: whatever the `unit_mode` select says, the payload always carries a
  per-row `rows[].unit`. UNIFORM stamps the same unit on every data row, NONE stamps `null`, PER_ROW
  stamps each row's own pick (which may be `null` — a per-row unit is optional and not validated).
  Section rows always send `unit: null`.
- **Unit precedence (read side)**: `row.unit` (PER_ROW) → top-level `unit` (UNIFORM) → `metric.unit` (legacy,
  `unit_mode` absent). The legacy term is last on purpose, not migrated away — it is what makes every
  indicator saved before this change keep rendering its unit exactly as before. One function,
  `resolveUnit()`, applies this precedence in both the builder's Live Preview and the Evaluate matrix.

- Category dropdown (`master-category`), Code dropdown (`master-gri`, Active only), Description
  field, and a **Status** `MpSelect` (Active/Inactive). Status and a disabled Last Updated `MpInput`
  (edit mode) live in this identity panel, not beside the page heading — see §2 on `status` not
  round-tripping through Update.
- Panel and column-group headings (Table Structure, Label Columns, Value / Metric Columns, Rows)
  carry their explanatory copy in an `MpTooltip` next to the heading, not as inline `text.secondary`
  body text below it.
- **Step 1 — Table Structure**, two subpanels side by side:
  - **Label Columns** (row identity) — the `columns[]` of the payload. The derived `key` is no longer
    shown; it is still slugified from the name behind the scenes. Renaming a column migrates the
    already-typed `rows[].labels` across to the new key instead of dropping them.
  - **Value / Metric Columns** — the `metrics[]` of the payload: header and input type only. The
    per-metric Unit picker was removed from the UI (GROU-662); `metric.unit` still round-trips
    through load/save unedited so a legacy record's metric-level unit keeps rendering exactly as
    before via `resolveUnit()`'s legacy fallback — see the `ponytail:` note on `FormMetric.unitId`.
- **Step 2 — Rows** — an editable table (one input per label column) rather than stacked form rows,
  matching the mockup's row grid. "Add Section" inserts a marker row (name input, spans the label
  columns); "Add Row" is unaffected by unit mode. A **Unit** select (None / Uniform / Per row) sits
  above the table; Uniform shows one Master Unit picker for the whole indicator, Per row adds a
  per-row unit column (each row's unit is optional). The mode only shapes the UI — the payload is
  always per-row.
- All three lists are **drag-to-reorder**. Columns/metrics still stamp `sequence` from array position;
  rows do not — see the `sequence`-as-identity note above.
- **Live Preview** — mirrors what the subsidiary sees. With 2+ metrics the header becomes two rows:
  the period spanning all metric columns, metrics as sub-columns beneath it; with one metric it stays
  flat. Cells render via the shared `DynamicFieldInput`, so each input type previews as its real
  control. The period shown is the current year and is **preview-only** — the schema has no period
  field, the submission owns it. "Client View" hides the input-type captions.
- Save → `create()`/`update()`, redirect to List. The payload shape is unchanged by the restyle.
- Delete (edit mode only, header, icon-only with a tooltip) → confirm modal → hard delete → redirect
  to List.


---

## 5. Task Checklist

- [x] Detect existing frontend stack/conventions in repo before scaffolding.
- [x] Build service module with CRUD + lookup composables against the real endpoints.
- [x] Build List screen wired to `getList()`.
- [x] Build Create/Edit screen wired to the list query + `create()` / `update()`.
- [x] Wire category, GRI code and unit dropdowns to their real lookup endpoints.
- [x] Implement add/remove for columns, metrics, rows in the form state.
- [x] Implement Live Preview panel driven by current form state.
- [x] Confirm Delete action (hard `DELETE`) invalidates and refreshes the List.
- [x] UI taste pass (layered frame/stage, quiet color, dashed add affordances, equal-width metric columns, aligned delete icons) applied to both screens.
- [x] GROU-662: removed per-metric Unit picker, added Status pill control, unified copy to English,
      moved panel descriptions to tooltips, moved Status/Last Updated into the identity panel,
      icon-only header Delete.

# MKI GRI-Quantitative Schema Builder — As Built

> **2026-08-28 update.** The mock data layer is gone; both screens now run on the real endpoints in
> `api/Master Key Indicator/GRI - Quantitative/`. Sections 2 and 3 below have been rewritten to
> match; Section 4's UI notes still hold except where they say "mock".

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
- **No `status` field.** The endpoints have no status/soft-delete concept — `Delete.yml` is a hard
  `DELETE`. The list and detail screens still render a Status badge (per product request) reading
  `status ?? 'Active'`; see the `ponytail:` note on `MkiGriQuantitative.status`. Remove the fallback
  once the backend grows a real field.
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
  rows: { sequence: number; labels: Record<string, string> }[]
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
- Category dropdown (`master-category`), Code dropdown (`master-gri`, Active only), Description field.
- Status badge beside the page heading in edit mode (reads `status ?? 'Active'` — see Section 2).
- **Columns** — add/remove; Key auto-derived from Column name (slugify), shown read-only to the right of the name field (disabled input, not user-editable).
- **Metrics** — add/remove; Metric name, Input type, optional Unit.
  - **Input type** is a dropdown-style popover (`MpPopover` + `MpPopoverList`), not a native `<select>`. Each option shows an icon beside its label (Number/Text/Date/Yes-No have real pixel3 icons; Percentage has no icon in the set, so it shows a "%" glyph instead). The trigger button width is forced via inline `style` (not a `css()` class) since `is-full-width` doesn't reliably stretch through the `MpPopoverTrigger` wrapper. The underlying value sent to the API is still the raw enum string (`NUMBER`/`TEXT`/`PERCENTAGE`/`DATE`/`YES_NO`) — only the display changed.
  - Each metric row's three fields (`name`/`input_type`/`unit`) use `minWidth="0"` on their `MpFormControl` so equal `flex` ratios actually render equal widths regardless of option-label length.
- **Rows** — add/remove; one text input per existing column.
- All three "Add" buttons (Column/Metric/Row) render as a full-width dashed ghost button below their list, not a small button in the section header — sits where the next item will appear.
- Delete icon buttons on each Column/Metric/Row line carry a hidden label spacer (`visibility: hidden`, matching the real `MpFormLabel`) on row 0 only, so `alignItems="flex-end"` lines the icon up with the input controls instead of the label.
- Sections separated by `MpDivider`, not boxed cards.
- **Live Preview** panel rendered as a distinct framed aside (`background.surface` + border + rounded), not floating flat next to the form — columns as label headers, metrics shown via the same icon/`%` treatment as the input-type picker.
- Save → `create()`/`update()`, redirect to List.
- Delete (edit mode only) → confirm modal → hard delete → redirect to List.

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

# MKI GRI-Quantitative Schema Builder (Mockup, Mock Data) — As Built

## 1. Goal & Scope

Frontend mockup of the MKI GRI-Quantitative schema builder (Platform Administrator side only), wired against a **mock data layer** — not a real API. The mock service module mirrors the request/response shapes documented below, so swapping to a real HTTP client later is a drop-in replacement (same function signatures, same JSON shapes).

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

The original plan (see git history) specified `ids` as a scalar FK into a `master-gri` lookup, with a denormalized `gri_code` field on the list response. During implementation this was changed based on product feedback:

- **`ids` → `code`**: the GRI code is now a **free-text field**, not a dropdown bound to a `master-gri` master list. There is no GRI code lookup/autocomplete.
- **`master-gri.api.ts` removed** — no longer needed since the code isn't resolved from a lookup table.
- **`gri_code` removed** from the list response — `code` alone is shown in both list and detail.
- `master-category` and `master-unit` lookups are unchanged (still used for the Category dropdown and the Metric Unit dropdown).

---

## 3. Current API Contract (mock, matches real shapes)

### Mock service module
`src/services/master-key-indicator-quantitative.api.ts` exports `masterKeyIndicatorQuantitativeApi` with `index()`, `create()`, `update()`, `remove()` — an in-memory store, seeded with 3 example schemas (403-9, 401-1, 302-1).

Lookup modules (read-only, static lists):
- `src/services/master-category.api.ts` → `masterCategoryApi.index()`
- `src/services/master-unit.api.ts` → `masterUnitApi.index()`

### Create / Update payload (`MkiGriQuantitativePayload`)
```ts
{
  id?: string                    // present on update only
  category: { id: string }
  code: string                   // free text, e.g. "403-9"
  name: string
  columns: { key: string; name: string; sequence: number }[]
  metrics: {
    key: string
    name: string
    input_type: 'NUMBER' | 'TEXT' | 'PERCENTAGE' | 'DATE' | 'YES_NO'
    unit: { id: string } | null
    sequence: number
  }[]
  rows: { sequence: number; labels: Record<string, string> }[]
}
```
- `columns[].key` and `metrics[].key` are auto-derived from `name` via `slugify()` — never typed directly by the user.
- `rows[].labels` — keyed object, keys match `columns[].key`.
- No `repeat_per_period` / period field — periods remain a submission-time concern only.

### `index()` — list mode (no `id`)
```ts
Promise<{ data: MkiGriQuantitativeSummary[] }>
// MkiGriQuantitativeSummary: { id, name, category: {id,name}, code, status, updated_at }
```
Accepts optional filters: `{ category_id?, status?, search? }` — `search` matches on `name` only.

### `index({ id })` — detail mode
```ts
Promise<MkiGriQuantitativeDetail>
// adds columns[], metrics[], rows[] to the summary shape
```

### `remove({ id })`
Soft-delete — sets `status: 'Inactive'`, does not remove the record. List screen re-fetches after.

Responses always denormalize `category`/`unit` to `{ id, name }` via the lookup modules — request bodies send bare `{ id }`.

---

## 4. Screens

### 4.1 List Screen (`ListPage.vue`)
- Flat table: Code (leftmost), Name, Category, Status, Last Updated, Action.
- "Last Updated" formatted as `YYYY-MM-DD HH:MM:SS`.
- Filter toolbar lives in the page **frame** (`background.surface`, same band as the Create button) rather than in the content area — search (name only, with search-icon prefix), Category select, Status select, all fixed-width via a wrapping `MpFlex` + native `is-full-width` (avoids fighting the component's internal chevron positioning).
- "Clear filters" ghost link appears only when a filter is active.
- Status shown as `MpBadge` (Active = completed/green, Inactive = announcement/muted).
- Row click or "Edit" popover item → Create/Edit screen with `?id=`.
- "Create" button (top-right) → Create/Edit screen with no `id`.
- Delete (popover item) → confirm modal → soft-delete → Inactive.

### 4.2 Create/Edit Screen (`DetailPage.vue`)
- Category dropdown (mock `master-category`), Code free-text field, Name field.
- **Columns** — add/remove; Key auto-derived from Column name (slugify), shown read-only to the right of the name field (disabled input, not user-editable).
- **Metrics** — add/remove; Metric name, Input type, optional Unit.
  - **Input type** is a dropdown-style popover (`MpPopover` + `MpPopoverList`), not a native `<select>`. Each option shows an icon beside its label (Number/Text/Date/Yes-No have real pixel3 icons; Percentage has no icon in the set, so it shows a "%" glyph instead). The trigger button width is forced via inline `style` (not a `css()` class) since `is-full-width` doesn't reliably stretch through the `MpPopoverTrigger` wrapper. The underlying value sent to the mock API is still the raw enum string (`NUMBER`/`TEXT`/`PERCENTAGE`/`DATE`/`YES_NO`) — only the display changed.
  - Each metric row's three fields (`name`/`input_type`/`unit`) use `minWidth="0"` on their `MpFormControl` so equal `flex` ratios actually render equal widths regardless of option-label length.
- **Rows** — add/remove; one text input per existing column.
- All three "Add" buttons (Column/Metric/Row) render as a full-width dashed ghost button below their list, not a small button in the section header — sits where the next item will appear.
- Delete icon buttons on each Column/Metric/Row line carry a hidden label spacer (`visibility: hidden`, matching the real `MpFormLabel`) on row 0 only, so `alignItems="flex-end"` lines the icon up with the input controls instead of the label.
- Sections separated by `MpDivider`, not boxed cards.
- **Live Preview** panel rendered as a distinct framed aside (`background.surface` + border + rounded), not floating flat next to the form — columns as label headers, metrics shown via the same icon/`%` treatment as the input-type picker.
- Save → `create()`/`update()` on the mock API, redirect to List.
- Delete (edit mode only) → confirm modal → soft-delete → redirect to List.

---

## 5. Task Checklist

- [x] Detect existing frontend stack/conventions in repo before scaffolding.
- [x] Build mock data module with CRUD + lookup functions, seeded with 3 example schemas.
- [x] Build List screen wired to mock `index()` (list mode).
- [x] Build Create/Edit screen wired to mock `index()` (detail mode), `create()`, `update()`.
- [x] Wire category/unit dropdowns to mock lookup functions (GRI code dropdown removed — see Section 2).
- [x] Implement add/remove for columns, metrics, rows in the form state.
- [x] Implement Live Preview panel driven by current form state.
- [x] Confirm Delete action (soft-delete → status Inactive) works against mock store and reflects in List.
- [x] UI taste pass (layered frame/stage, quiet color, dashed add affordances, equal-width metric columns, aligned delete icons) applied to both screens.

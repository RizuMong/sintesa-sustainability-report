# Phase 1 — Create/Edit screen adjustments

**Goal** — Apply all six GROU-662 items to the MKI GRI-Quantitative Create/Edit screen.

**Files owned**
- `src/pages/master-key-indicator-quantitative/DetailPage.vue`
- `src/services/master-key-indicator-quantitative/types.d.ts`

**Depends on** — none.

## Context

Ticket text (verbatim):
- Remove Unit From MKI Detail and Create → Table Structure → Header
- Add Toggle Status Control At Create MKI and MKI Detail
- Unify Language to English
- Move Section Description to Tooltip at MKI Detail and Create
- Move Status and Last Updated to Filter Section
- Remove Delete Button Label (Trash Icon only)

**User correction on "Filter Section"**: this is the identity panel at `DetailPage.vue:102-177`
(Category / Code select row + Description textarea) — not the List page's filter popover. Status and
Last Updated currently live in the header next to the `h1` (`DetailPage.vue:30-49`, badge +
`lastUpdatedLabel`). Move both down into that identity panel.

**User correction on the Status control**: build it with **custom HTML**, not `MpSelect`/`<option>`
— Pixel's select renders plain text options, it cannot show a colored badge pill inside the list
(confirmed against the ticket's screenshot: two badge pills, "Active" selected green, "Active" /
"Inactive" pills as the open list). Build two clickable pill buttons (styled like the existing
`MpBadge` colors: `completed`/green for Active, `announcement`/red for Inactive) that set
`form.status` on click — a native chip toggle, not a dropdown. Mirror `MpBadge`'s existing color use
at `DetailPage.vue:38-45` for the two states so the toggle and the (now-removed) header badge agree
visually. Use `css()` from `@mekari/pixel3` for the pill styling (see `panel`/`subpanel`/`dragRow`
class helpers already in this file, e.g. `sectionRow` at line ~1065) — don't reach for a UI library
component that isn't in Pixel.

Patterns to imitate:
- Tooltip: `src/components/SummaryBox.vue:248` (`<MpTooltip :label="…">` wrapping an `MpIcon`).
- Existing `css()`-based style const: `DetailPage.vue` `sectionRow` (~line 1065).
- Icon-only ghost button: `DetailPage.vue:283-289` (`Remove column`, `left-icon="delete"` + `aria-label`).

Indonesian strings still in the file (item 3), by line:
- `442` — `Diatur di Satuan (Unit)` → `Set in Unit`
- `480` — `Tambah Section` → `Add Section`
- `502` — `Satuan (Unit)` label → `Unit`
- `614` — placeholder `Nama section` → `Section name`
- `1146-1148` — `unitModeOptions` labels `Tidak ada` / `Seragam` / `Per baris` → `None` / `Uniform` / `Per row`

Grep before finishing: `grep -nE 'Tambah|Satuan|Tidak ada|Seragam|Per baris|Diatur|Nama ' DetailPage.vue` must return nothing.

## Steps

1. **Remove the per-metric Unit picker.** Delete the `metric-unit-${i}` `MpFormControl` block
   (`DetailPage.vue:408-445`, Unit label + `MpSelect` + the "Diatur di Satuan (Unit)" hint). Leave
   `Input Type` as the only field in that row. Keep `metric.unitId` in `FormMetric`, keep it loaded
   in `loadForm()` and keep it emitted in `buildPayload()` — a legacy record saved with metric-level
   units must round-trip unchanged, and `resolveUnit()`'s legacy fallback still reads it. Add a
   `ponytail:` comment on `FormMetric.unitId` noting the picker was removed from the UI but the value
   is preserved for legacy records.

2. **Payload type.** In `src/services/master-key-indicator-quantitative/types.d.ts`, add
   `status?: MasterStatus` to `MkiGriQuantitativePayload` with a comment: present in
   `V1/Create.yml` + `V2/Create.yml` bodies, absent from both Update bodies and from the Index
   response — sent on update as a sibling-convention placeholder.

3. **Status toggle (custom HTML) + move Status/Last Updated into the identity panel.**
   - Add `status: 'Active' as MasterStatus` to the `form` reactive (near `unitMode`, ~line 1158).
   - In `loadForm()` set `form.status = next.status ?? 'Active'`. In `buildPayload()` include
     `status: form.status`.
   - Remove the header `MpBadge` (status, `:36-46`) and the `lastUpdatedLabel` `MpText` (`:47-49`)
     from the header block entirely.
   - Delete the now-unused `status` computed (~line 1112) — carry its `ponytail:` note (no live
     status field on the endpoint) onto the `loadForm()` fallback line instead.
   - In the identity panel (`DetailPage.vue:102-177`), add a third `MpFormControl id="mki-status"
     is-required` alongside Category/Code (adjust the grid to 3 columns, or place it full-width below
     Description — either is fine, pick whichever keeps the two-column Category/Code row intact).
     Render two pill buttons (`<button>` or `MpFlex` with `role="radio"`/`aria-pressed`), one per
     status, each toggling `form.status` on click; the selected pill gets the badge-green/red fill,
     the unselected one a neutral/outline style. Keep it keyboard-operable (`tabindex="0"`,
     `@keydown.enter`/`@keydown.space`).
   - Directly under/beside that control (still inside the identity panel), render `lastUpdatedLabel`
     as plain `MpText` — same computed, same text, new location, `v-if="isEdit && lastUpdatedLabel"`.

4. **Descriptions → tooltips.** For each panel heading that carries a `text.secondary` description —
   Step 1 "Table Structure" (`:198-205`), "Label Columns (row identity)" (`:221-231`), the matching
   "Value / Metric Columns" heading, and the Step 2 heading if it has one — remove the description
   `MpText` and add an `MpTooltip :label="…"` (same copy) wrapping an `MpIcon name="information"`
   placed right after the heading text. Verify `information` is a real icon name with the pixel
   skill's `get-icon-name` tool before committing to it; substitute the confirmed name if different.

5. **English copy.** Replace the five Indonesian strings listed in Context.

6. **Delete button.** `DetailPage.vue:56-63`: drop the `Delete` text child, keep
   `variant="ghost" left-icon="delete"`, add `aria-label="Delete"`, wrap in `<MpTooltip label="Delete">`.

## Acceptance

```
pnpm build
node --experimental-strip-types src/services/master-key-indicator-quantitative/rows.check.ts
grep -nE 'Tambah|Satuan|Tidak ada|Seragam|Per baris|Diatur|Nama ' src/pages/master-key-indicator-quantitative/DetailPage.vue   # no output
```

Then `pnpm dev`, open `/master-key-indicator-quantitative/detail` (create) and `?id=<existing>`:
- Header no longer shows a status badge or "Last updated" text.
- Identity panel shows Category, Code, Description, a clickable Status pill toggle (defaulting to
  Active on create), and — in edit mode — the Last Updated text.
- Step 1 metric rows show Header + Input Type only; a legacy record's saved metric unit still shows
  correctly in Live Preview after reload (round-trip check).
- Info tooltips open on hover/focus over the panel headings.
- Header Delete is a bare trash icon with a tooltip.
- Console clean (no Vue warnings).

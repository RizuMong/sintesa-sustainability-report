# GROU-662 — [FE] MKI Adjustments

Source: Stride task `W7avDeq0WrUe` (GROU-662), P1, sprint 18/2026, 16h estimate. No subtasks, no
comments.

**Correction from user**: all six bullets are on the Create/Edit screen only — the List screen is not
touched. "Filter Section" in the ticket means the identity panel at the top of `DetailPage.vue`
(Category / Code / Description, `DetailPage.vue:102-177`), not the List page's `TableFilter`
popover. Status/Last-Updated move from the header (next to the `h1`) down into that panel. Status
control must be custom HTML (colored badge-style pills), not a native `MpSelect`/`<option>` list —
Pixel's select cannot render a badge inside its option list.

## Goal

Six UI adjustments to the MKI GRI-Quantitative Create/Edit screen
(`src/pages/master-key-indicator-quantitative/DetailPage.vue`): drop the per-metric Unit picker from
Step 1, add a custom-HTML editable Status control, unify all copy to English, move panel description
text into tooltips, move Status + Last Updated out of the header into the identity panel, and strip
the Delete button's label to a trash icon.

## Phases

| Phase | Scope | Depends on |
| --- | --- | --- |
| 1 | `DetailPage.vue` + payload type: all six items | none |
| 2 | As-built doc refresh | none (write from phase-1.md, don't wait on code) |

Single file for all six items, so one phase owns it — CLAUDE.md's own rule (two phases needing the
same file are one phase).

## Ticket items → phase 1 steps

1. Remove Unit from Table Structure → Header (metric row)
2. Add Status toggle control (custom HTML badge pills) at Create + Detail
3. Unify language to English
4. Move section description text to tooltips
5. Move Status + Last Updated from header into the identity panel
6. Remove Delete button label (trash icon only)

## Shared contracts

`MkiGriQuantitativePayload` gains `status?: MasterStatus`:

```ts
interface MkiGriQuantitativePayload {
  // …existing
  status?: MasterStatus   // 'Active' | 'Inactive'
}
```

Contract facts, verified in `api/Master Key Indicator/GRI - Quantitative/`:
- `V1/Create.yml` **and** `V2/Create.yml` request bodies both carry `"status": "Active"` → sending it
  on create is contract-backed.
- `V1/Update.yml` / `V2/Update.yml` bodies do **not** carry `status`, and `Index.yml`'s response does
  not return it. So a saved status is not readable back and update support is assumed, not proven.
  Send it anyway (sibling-convention placeholder, per CLAUDE.md) and keep the existing
  `status ?? 'Active'` fallback + its `ponytail:` note in `types.d.ts`.
- App calls the `v1` URLs; `V2/*` differ only in the `/v2/` path. Do **not** switch versions in this
  ticket.

## Verification (whole ticket)

```
pnpm build                                   # vue-tsc + vite build, must stay clean
node --experimental-strip-types src/services/master-key-indicator-quantitative/rows.check.ts
pnpm dev   # then /master-key-indicator-quantitative/detail, console must be warning-free
```

There is no browser acceptance script for MKI (the acceptance run covers the dashboard only), so the
dev-server pass is manual — Vue "failed to resolve component" warnings are the risk `vue-tsc` misses.

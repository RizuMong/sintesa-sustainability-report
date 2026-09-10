# Evaluate GRI — Quantitative — As Built

Covers `src/services/evaluate-gri-quantitative/` and the three screens in
`src/pages/evaluate-gri-quantitative/` (Requestor list, submission Detail, Review & Approval).
Contract source of truth: `api/Evaluate GRI - Quantitative/*.yml`.

## 1. Screens

### Requestor (`RequestorPage.vue`)
- Four summary blocks above the table: **Draft**, **Awaiting Approval**, **Approved**, **Rejected**,
  counted client-side off the same list query that feeds the table (`requestorSummary()`).
- Table + filter + "Create Data" modal unchanged (AC-86 duplicate guard still applies).

### Detail (`DetailPage.vue`)
- **Items are grouped by category.** `groupItemsByCategory()` buckets `items[]` on `category_id`,
  first-seen order, and each bucket renders under an `h2` category heading.
- Each item renders as one table: its `columns[]` as the left-hand label columns, then **one column
  per `metrics[]` entry**, each cell a `DynamicFieldInput` dispatched on the metric's `input_type`.
  (The earlier build rendered a single "Value" column off a per-item `input_type`; the real Detail
  response carries a `metrics[]` array per item, same shape as the MKI record behind it.)
- A row with `type: 'SECTION'` (mirrored from the MKI schema, see `docs/mki-quantitative.md`) renders
  as a spanning header with no inputs; `isSection()` / `dataRows()`
  (`@/services/master-key-indicator-quantitative`) are what skip it on save, since a section carries
  no `labels` and produces no cell. The unit shown per cell comes from `resolveUnit(row, metric,
  item.unit_mode, item.unit)`, not `metric.unit?.name` directly, so PER_ROW/UNIFORM/legacy indicators
  all render the right unit through one function.
- **Submit / Update sit below the form**, not in the page header — matching the Officeless
  submission screen. Delete (draft only) stays in the header.
- Read-only whenever `isReadOnly(flow_status)` (anything but `draft`/`rejected`).

### Review & Approval (`ApprovalPage.vue`)
- **GRI Quantitative only.** The Qualitative and Action Plan Realization tabs were removed; those
  queues get their own portals. `ApprovalReviewTable` is still the shared table component.
- Four summary blocks: **Awaiting Approval**, **Approved by Me**, **Approved**, **Rejected**
  (`approvalSummary()`).

## 2. Cell values ↔ the Update contract

`Update.yml` wants one flat entry per (row, metric) cell, with the value split across three typed
fields; the form holds one plain value per cell. `validation.ts` maps between the two:

```ts
toSubmissionValue(metric, rowSequence, raw, unit = metric.unit) // -> { row_key: `row_${seq}`, metric_key, value_number, value_text, value_date, unit }
fromSubmissionValues(values)                                    // -> { `row_1:metric_key`: value }
```
- `NUMBER` / `PERCENTAGE` → `value_number`; `DATE` → `value_date` (epoch ms); everything else
  (`TEXT`, `YES_NO`) → `value_text`. A blank cell stays `null` in all three, never `0`.
- `unit` is the 4th argument, defaulting to the metric's own unit — the default is what keeps every
  pre-Section, pre-unit-mode call site (and every already-saved indicator's data) correct without a
  call-site change. Save (`DetailPage.vue`) passes `resolveUnit(row, metric, item.unit_mode,
  item.unit)` explicitly instead of relying on the default, since a PER_ROW/UNIFORM indicator's real
  unit isn't the metric's.
- `rowKey`/`cellKey`/`fromSubmissionValues` are untouched by Sections: a section row never reaches
  `toSubmissionValue` (it's filtered by `dataRows()` before the `flatMap`), so it never produces a
  key, and an already-submitted row's `row_key` keeps matching after a section is inserted ahead of
  it — see `sequence`-as-identity in `docs/mki-quantitative.md`.
- **Unconfirmed:** the seeded `Detail.yml` example is an unfilled draft, so nothing proves how saved
  values come *back*. `fromSubmissionValues()` assumes the same `items[].values[]` shape. See the
  `ponytail:` note on `EvaluateGriQuantitativeItem.values`.

## 3. "By me" identity

There is no user id in the embed config. `useCurrentUserEmail()`
(`src/composables/useCurrentUser.ts`) POSTs the embed token to `/v1/tools/auth` with
`method: 'decrypt'`, which answers the signed-in user's email (`api/Auth/Auth Low-code.yml`), and
"Approved by Me" matches that against `approval_logs[].approvers[].user.email`. With no email
resolved the count is simply 0 — it never guesses.

## 4. Known gaps carried forward

- `flow_status: 'sent'` (open-gaps G1) — both summary helpers treat *anything* that is not
  `draft`/`approved`/`rejected`/`cancelled` as awaiting approval rather than exact-matching
  `'submitted'`, so `'sent'` lands in the right block.
- Evidence upload still has no endpoint — the file is validated and gates Submit client-side only.
- The item heading falls back `description → name → code → parent_id.name`; the contract's item
  objects carry none of the first three yet.
- **Open (GROU-649 AC 6), Section rows / unit_mode round-trip:** unconfirmed whether `rows[]`
  round-trips `type`/`name`/`unit` and top-level `unit_mode`/`unit` through the API unchanged, on both
  MKI index and the Evaluate detail echo (`items[].rows`, `items[].values`) — the request bodies in
  `api/Master Key Indicator/GRI - Quantitative/V2/{Create,Update}.yml` document the intended shape,
  not a confirmed one. If top-level `unit_mode`/`unit` get dropped by the backend schema, that config
  has to move inside `rows[]` and `resolveUnit()` needs a per-item inference fallback — it's the only
  function that would need to change. Also unconfirmed: which of `/v1` vs `/v2/mki/gri-quantitative/*`
  carries this change (the app still calls `/v1`).

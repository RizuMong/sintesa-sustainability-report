# Plan — Submission & Approval revisions

Scope = the Evaluate GRI Quantitative screens:

- List/table (Approval sub-menu): `src/pages/evaluate-gri-quantitative/ApprovalPage.vue` + `src/components/ApprovalReviewTable.vue` (table is only used by that page)
- Detail: `src/pages/evaluate-gri-quantitative/DetailPage.vue`
- Sibling requestor screen: `src/pages/evaluate-gri-quantitative/RequestorPage.vue` (shares `SummaryBox`, `TableFilter`, `useTableFilter`)

Ordered so shared components land before the pages that consume them.

---

## 1. SummaryBox follows the reference (`.temp/references/summary-box.vue`)

Files: `src/components/SummaryBox.vue`, `ApprovalPage.vue`, `RequestorPage.vue`.

Current `SummaryBox` is a 15-line box (`label` + `amount`). Reference adds: `variant` (green/red/blue/orange/gray) colored top bar, `badge`, `caption`, `isLoading` spinner, `isFilter`/`isActive` filter affordance, `isHoverable`/`as`/`href`, `top-right-content` / `bottom-right-content` slots.

Steps:

1. Port the reference component into `src/components/SummaryBox.vue`.
   - `@mekari/pixel3-styled-system@^0.3.1` is now a direct dependency, so `import { sva } from '@mekari/pixel3-styled-system/css'` resolves — port the file as-is, no `css()` rewrite needed.
   - Change `caption` default from `"Total"` to `''` and render it only when set — the existing three dashboard usages pass no caption and must not sprout a stray "Total".
   - Keep prop names identical to the reference (`label`, `amount`, `badge`, `caption`, `variant`, `isLoading`, `isFilter`, `isActive`, `isHoverable`, `as`, `labelSrc`) so the reference usage example is copy-pasteable.
2. Verify no regression at the other 3 call sites (`dashboard/GriQuantitativePage.vue`, `dashboard/GriQualitativePage.vue`, `dashboard/SdgPage.vue`): they pass `label` + `amount` only, which must keep rendering (variant falls back to `gray`).
3. Use it on `ApprovalPage.vue` per the usage example: 4 boxes in the `MpFlex gap="4"` row, with
   - Awaiting Approval → `variant="orange"`, Approved by Me → `blue`, Approved → `green`, Rejected → `red`
   - `:is-loading="isLoading"` wired to the list query so cards skeleton with the table.
   - `badge` = the same count where a count is the amount; skip `badge` rather than inventing a second number.
4. Optional (do it, it's free once (3) is done): mirror the same variants on `RequestorPage.vue`'s 4 boxes so the two sub-menus look like one feature.

Filter-card behaviour (`isFilter`/`isActive`) is **not** wired in this pass — see §9 for where filtering lives. Note it in a `ponytail:` comment.

## 2. Template field in Detail View

File: `DetailPage.vue` (~line 62, the `MpFlex gap="6"` holding Entity + Period).

Add a third read-only `MpFormControl` after Period:

```vue
<MpFormControl id="detail-template" is-disabled flex="1">
  <MpFormLabel>Template</MpFormLabel>
  <MpInput :model-value="detail.template_id.name" is-disabled />
</MpFormControl>
```

`template_id: Ref2` already exists on the detail payload (it's what the page title renders), so no API change. Leave the h1 as-is.

## 3. Remove Status column from the approval table

File: `ApprovalReviewTable.vue`.

Delete the `<MpTableCell scope="col">Status</MpTableCell>` header and its `MpBadge` body cell. Then delete the now-unused `statusBadgeType()` helper and drop `MpBadge` from the import list (typecheck will catch it via `vue-tsc -b`). Keep the "Approval Stage" column.

## 4. Approval line uses the Pixel timeline

File: `DetailPage.vue`, the right-hand "Approval line" column (currently `MpFormControl` + `MpBadge` per stage).

`@mekari/pixel3` re-exports `@mekari/pixel3-timeline@0.0.28`: `MpTimeline`, `MpTimelineItem`, `MpTimelineTitle`, `MpTimelineCaption`, `MpTimelineContent`, `MpTimelineLog`, `MpTimelinLogItem` (sic), `MpTimelineAccordion`, `MpTimelineDocument`.

`MpTimelineItem` props: `position: 'first' | 'last' | 'middle'`, `status: 'approved' | 'canceled' | 'need-approval' | 'rejected' | 'created' | 'submitted' | 'next'`, `icon` (icon-name union), `iconVariant`, `iconColor`, `isHideTopConnector`, `isHideBottomConnector`. `MpTimeline` / Title / Caption / Content take no props — slot-only.

Slot usage confirmed by `.temp/references/timeline-with-description.vue` and `timeline-with-multiple-content.vue`: Title/Caption/Content are plain default slots; the references put an `MpText weight="semiBold"` inside Title with the "by" connector as a nested `<MpText as="span" :color="isNextTheme ? 'text.secondary' : 'gray.400'" weight="regular">`. `DetailPage.vue` is a `meta: { nextTheme: true }` route, so `usePixelTheme()`'s `isNextTheme` is true there — take the `text.secondary` branch directly rather than importing the composable just for a color.

One `MpTimelineItem` per stage, one nested line per approver:

```vue
<MpTimeline>
  <MpTimelineItem
    v-for="log in approvalLogs"
    :key="log.stage_order"
    :status="timelineStatus[log.status] ?? 'next'"
  >
    <MpTimelineTitle>
      <MpText weight="semiBold">
        Stage {{ log.stage_order }} · {{ log.approval_type }}
      </MpText>
    </MpTimelineTitle>
    <MpTimelineCaption>{{ formatDecidedAt(log) }}</MpTimelineCaption>
    <MpTimelineContent>
      <MpText v-for="a in log.approvers" :key="a.user.id">
        <MpText as="span" weight="semiBold">{{ a.action }}</MpText>
        <MpText as="span" color="text.secondary" weight="regular"> by </MpText>
        {{ a.user.name }} ({{ a.position.name }})
        <template v-if="a.notes"> — “{{ a.notes }}”</template>
      </MpText>
    </MpTimelineContent>
  </MpTimelineItem>
</MpTimeline>
```

Details:

- Map `ApprovalLog.status` → `TimelineStatus` inline in the page (`WAITING_APPROVAL → 'need-approval'`, `APPROVED → 'approved'`, `REJECTED → 'rejected'`, else `'next'`), same inline-map convention as the existing `statusBadgeType`. `approvalLogs` is already sorted by `stage_order`.
- Skip `position` — the references omit it and let the component infer first/last from order. Only reach for `isHideTopConnector`/`isHideBottomConnector` if the rendered connectors look wrong.
- Caption timestamp: `log.decided_at` (epoch **milliseconds**, nullable) falling back to the max `approver.acted_at`; format with `new Date(value).toLocaleString('sv-SE')`, matching the three existing list pages — no unit conversion. Render `'—'` (or omit the Caption) when still pending.
- Keep the "No approval stages yet." empty line. Drop `MpFormControl`/`MpFormLabel`/`MpBadge` from that block only (still used elsewhere on the page).
- Optional flourish, only if a stage carries evidence: `MpTimelineDocument` (`icon`, `title`, `file-size`) per `timeline-with-document.vue`. Not wired now — evidence upload has no endpoint yet (existing `ponytail:` note in `DetailPage.vue`).

## 5. Remove Actions column from the approval table

File: `ApprovalReviewTable.vue`.

Delete the `Actions` header + the `MpButtonGroup` body cell (per-row Approve/Reject). Consequences to clean up in the same edit:

- `approveOne()` becomes unused → delete.
- `openReject(id)` per-row entry point goes away; the reject modal is kept but is now driven by the bulk bar (§6).
- `actingOnId` / `isRowBusy()` only served the per-row buttons → delete.
- `MpButtonGroup` import in the table stays (used by the modal footer).

Approve/Reject now happen **only** via row selection + the bulk bar, and inside the detail view. Confirm that's intended before deleting — it removes the single-row one-click path.

## 6. Bulk actions via row selection

File: `ApprovalReviewTable.vue`.

Selection already exists (per-row `MpCheckbox` + select-all, gated by `selectableApprovalIds()`), so this is mostly promoting it to the only action path:

- Bulk bar: the whole bar (`{{ selected.size }} selected` + **Bulk Approve** + **Bulk Reject**) renders only when `selected.size > 0` — `v-if="selected.size"` on the wrapping `MpFlex`, replacing today's always-visible count line. Nothing above the table when no row is selected.
- Add `bulkReject()` mirroring `bulkApprove()`: open the existing reject modal with no `rejectTargetId`, require `canReject(notes)`, then loop `rejectMutation.mutateAsync({ id, remarks })` over the selection. Generalise `rejectTargetId: string | null` into `rejectTargetIds: string[]` so the modal serves one-or-many with one code path.
- Keep the sequential `for … await` loop and the existing `ponytail:` note (each mutation's `onSuccess` invalidates the list).
- Clear `selected` after either bulk action.

`src/lib/review-approval-validation.ts` + its `.check.ts` already cover which rows are selectable and `canReject`; extend `review-approval-validation.check.ts` only if `rejectTargetIds` gets non-trivial logic.

## 7. Toast on every response message

Root cause fix in one place: `src/lib/http.ts` response interceptor, not per-call site.

- Success branch: if the request method is not `GET`/`HEAD` and `response.data.message` is non-empty, `toast.notify({ id: <method+url>, variant: 'success', title: response.data.message })`.
- Error branch: `toast.notify({ variant: 'error', title: error.response?.data?.message ?? error.message })` — but **skip when the mapped auth status is not `'ok'`**, since the App-level 401/expired screen already handles that and would double-report.
- Then delete the now-duplicate hand-written success toasts so nothing fires twice: `ApprovalReviewTable.vue` (`approve-*`, `reject-*`, `bulk-approve`), `DetailPage.vue` (`evaluate-save`, `evaluate-submit`), `RequestorPage.vue` (`evaluate-create`). Bulk loops will then emit one toast per row — keep a single summary toast for bulk by suppressing the interceptor toast for those calls (simplest: a `config.meta?.silentToast` flag read in the interceptor, set by the bulk calls).
- Grep the rest of `src/` for `toast.notify` and strip only the ones that duplicate a server message; keep purely client-side ones (validation, "copied", etc.).

Leave a `ponytail:` comment on the interceptor naming the ceiling: envelope `message` is shown verbatim, no i18n/mapping.

## 8. Row click opens detail (not the entity name)

File: `ApprovalReviewTable.vue`.

Currently the first column renders `MpButton variant="textLink"` that emits `rowClick`; the rest of the row is dead. Change to: plain text in every column, and put the handler on the row —

```vue
<MpTableRow :class="css({ cursor: 'pointer' })" @click="emit('rowClick', row)">
```

Keep the checkbox cell from triggering navigation: `@click.stop` on that cell. Matches `RequestorPage.vue`, which already makes cells clickable with `css({ cursor: 'pointer' })` (put it on the row here, which is tidier — consider aligning RequestorPage the same way while in there).

## 9. Filters on the approval table view

File: `ApprovalPage.vue` (page owns filtering; the table stays presentational).

Reuse the existing pieces, exactly as `RequestorPage.vue` does:

```ts
const filterColumns = computed(() => [
  { value: 'entity_id.name', label: 'Entity' },
  { value: 'period_id.name', label: 'Period' },
  { value: 'template_id.name', label: 'Template' },
])
const { filteredItems, applyFilter, resetFilter } = useTableFilter(items)
```

- Render `<TableFilter :columns="filterColumns" @apply="applyFilter" @reset="resetFilter" />` in a `MpFlex justifyContent="flex-start"` above the table.
- Pass `:items="filteredItems"` to `ApprovalReviewTable`.
- No Status filter option — §3 removes that column.
- Note: `useGetApprovalList(filters)` already accepts server-side `entity_id/period/template_id`; this pass stays client-side like the requestor screen. `ponytail:` comment pointing at the server-side upgrade path.

---

## Verification

- `pnpm build` (runs `vue-tsc -b`) — catches every dangling import from the deletions in §3/§5/§7.
- `node --experimental-strip-types src/lib/review-approval-validation.check.ts` — still passes after §6.
- `pnpm dev`, then walk: approval list (filter, select rows, bulk approve/reject, row click) → detail (Template field, timeline) → confirm exactly one toast per mutation.

## Resolved

1. "Submission & Approval" = Evaluate GRI Quantitative. Scope above is correct.
2. §5 confirmed: per-row Approve/Reject buttons go away; selection + detail are the action paths.
3. §6 confirmed: selection-driven bulk bar, hidden entirely until ≥1 row selected.
4. `@mekari/pixel3-styled-system@^0.3.1` installed — §1 ports the reference verbatim.
5. Timeline layout is ours to design; §4 follows the `.temp/references/timeline-*.vue` patterns.
6. `decided_at` / `acted_at` are epoch milliseconds — feed straight to `new Date()`.

No open questions. Plan is ready to build.

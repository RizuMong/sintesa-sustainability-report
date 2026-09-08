# GROU-650 · Phase 1 — hide requester actions in the approval context

**Depends on:** none

## Goal

Make `readOnly` in `DetailPage.vue` true whenever the page was opened from the Review & Approval
queue, so rejected submissions stop rendering Submit/Update/Delete and editable cells there.

## Files owned

- `src/services/evaluate-gri-quantitative/validation.ts`
- `src/services/evaluate-gri-quantitative/api.check.ts`
- `src/pages/evaluate-gri-quantitative/DetailPage.vue`

## Context

Ticket (AC verbatim):
1. Submit and Update buttons are hidden/disabled for Rejected status data within the Approval sub-menu.
2. Approval sub-menu only shows actions relevant to the approval process (per status: Pending, Approved, Rejected).
3. Verify this behavior doesn't affect other statuses (Pending/Approved) — only Rejected data in this specific context is impacted.

The approval context is not a route of its own — it is `/evaluate-gri-quantitative/detail?from=approval`.
`DetailPage.vue:787` and `:794` already read `route.query.from === "approval"`; there is no shared
computed for it yet, both inline it.

Patterns to imitate:
- helper shape + comment style: `src/services/evaluate-gri-quantitative/validation.ts:25-31` (`isReadOnly`)
- assertion style: `src/services/evaluate-gri-quantitative/api.check.ts:49-54`
- computed style: `src/pages/evaluate-gri-quantitative/DetailPage.vue:794` (`canAct`)

## Steps

1. `validation.ts` — add next to `isReadOnly`:

   ```ts
   // GROU-650 — the detail screen is shared by the requestor and the approver. isReadOnly() lets a
   // rejected submission reopen for edit/resubmit (AC-84), which is correct for the requestor only;
   // opened from the Review & Approval queue the screen is approve/reject/view-only.
   export function isDetailReadOnly(flowStatus: SubmissionFlowStatus | string, fromApproval: boolean): boolean {
     return fromApproval || isReadOnly(flowStatus)
   }
   ```

2. `api.check.ts` — import `isDetailReadOnly` and assert, after the existing `isReadOnly` block:

   ```ts
   assert.equal(isDetailReadOnly('rejected', true), true, 'GROU-650: rejected is view-only in the approval context')
   assert.equal(isDetailReadOnly('draft', true), true)
   assert.equal(isDetailReadOnly('rejected', false), false, 'requestor still revises a rejected submission')
   assert.equal(isDetailReadOnly('draft', false), false)
   ```

3. `DetailPage.vue` — add a shared computed above `readOnly` (~`:658`) and use it:

   ```ts
   const fromApproval = computed(() => route.query.from === "approval");
   const readOnly = computed(
       () => !detail.value || isDetailReadOnly(detail.value.flow_status, fromApproval.value),
   );
   ```

4. `DetailPage.vue` — swap the `isReadOnly` import (`:578`) for `isDetailReadOnly`; if `isReadOnly`
   ends up unused in this file, drop it from the import list (`vue-tsc` will not flag it, the
   linter/reviewer will).

5. `DetailPage.vue` — replace the two remaining inline `route.query.from === "approval"` reads
   (`:787` in `remove()`'s redirect, `:795` in `canAct`) with `fromApproval.value`. No behaviour
   change, just one source of truth.

6. Do **not** touch the `canAct` predicate itself, the Approve/Reject block (`:263`), or the
   reviewer-note panel (`:67`) — a rejected row in the approval context is meant to render note +
   approval line and no buttons.

## Acceptance

```
node --experimental-strip-types src/services/evaluate-gri-quantitative/api.check.ts
pnpm build
```

Both pass. In the running app:
- `?id=<rejected>&from=approval` → no Submit, Update, or Delete; metric inputs disabled; reviewer
  note + approval line visible.
- `?id=<rejected>` (no `from`) → Submit + Update present, inputs editable (AC 3 regression).
- `?id=<pending>&from=approval` → Approve + Reject still present.

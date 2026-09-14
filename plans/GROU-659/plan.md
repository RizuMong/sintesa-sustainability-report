# GROU-659 — [FE] Cancel / Revised Submission on Evaluate GRI - Quantitative

Source: Stride task `cEfLxiquiIa7x` (GROU-659), P1, 3h estimate. No subtasks, no comments.

## Goal

Let the requestor pull back a submission that is already sent for approval: a **"Revise Submission"**
button on `src/pages/evaluate-gri-quantitative/DetailPage.vue`, visible only while the submission is
in flight, that confirms, POSTs `/v1/evaluate-gri-quantitative/cancel` with the submission `id`, and
on success routes the user back to the requestor list view (confirmed in the ticket notes: "User
back to Table View / List View").

## What already exists (verified in repo, do not rebuild)

- `evaluateGriQuantitativeApi.cancel(id)` — `src/services/evaluate-gri-quantitative/api.ts:39`,
  already POSTs the exact contract body `{ id }`.
- `useCancelEvaluateGriQuantitative()` — `src/services/evaluate-gri-quantitative/composables.ts:62`,
  already invalidates both list queries on success.
- Error toasts — automatic. `src/lib/http.ts:40,52` toasts every non-GET failure from the envelope
  message unless `meta.silentToast` is set. Do **not** add a manual try/catch toast; AC 4 is met by
  the interceptor, same as `submit()`/`confirmReject()` do today.
- Confirmation dialog — `src/components/ConfirmDeleteModal.vue`, but its confirm button is hard-coded
  `variant="danger"` + label `Delete`. See phase 1 for how to handle that.

So this ticket is **UI + wiring only**. The service layer is done.

## Phases

| Phase | Scope | Depends on |
| --- | --- | --- |
| 1 | `review-approval-validation.ts` + its check: `canRevise(flowStatus, fromApproval)` predicate | none |
| 2 | `ConfirmDeleteModal.vue` → configurable confirm label/variant | none |
| 3 | `DetailPage.vue`: button, confirm dialog, mutation call, redirect | 1 and 2 |
| 4 | `docs/evaluate-quantitative.md` as-built refresh | none |

Phases 1, 2, 4 are dependency-free and run in parallel. Phase 3 is the only serialized one; it is
small (one file, ~4 edits) and its contracts are fixed below so it can be started on the assumption
that 1 and 2 land as specified.

## Shared contracts

Phase 1 exports, consumed by phase 3:

```ts
// src/lib/review-approval-validation.ts
export function canRevise(flowStatus: string, fromApproval: boolean): boolean
```

`true` only when `!fromApproval` and the submission is in flight. "In flight" must be matched the
way the rest of this codebase already hedges — **not** an exact `=== 'submitted'`. The live API has
been observed answering `'sent'` for the same state (G1 in
`docs/sustainability-reporting-portal-open-gaps.md`; `isReadOnly()` and `isAwaitingApproval()` in
`src/services/evaluate-gri-quantitative/validation.ts` both hedge this way). So:

```ts
const SETTLED = ['draft', 'approved', 'rejected', 'cancelled']
return !fromApproval && !SETTLED.includes(flowStatus)
```

That satisfies AC 1 (visible on Sent) and AC 5 (hidden for Draft/Approved/Rejected) while surviving
the `submitted` vs `sent` ambiguity.

Phase 2 contract, consumed by phase 3:

```vue
<ConfirmDeleteModal
  :is-open="…" title="…" message="…"
  confirm-label="Revise Submission"     <!-- optional, default 'Delete' -->
  confirm-variant="primary"             <!-- optional, default 'danger' -->
  @close="…" @confirm="…" />
```

Defaults keep both existing call sites (`DetailPage.vue` of MKI and of Evaluate) unchanged.

## Out of scope

AC 6 ("approval line reflects the revert") needs no FE work: the approval line renders whatever
`approval_logs` the detail endpoint answers, and `Cancel.yml`'s 200 example returns
`"approval_logs": []`. Since the user is redirected to the list, there is nothing to re-render.
State this in the doc rather than building for it.

## Verification (whole ticket)

```
pnpm build
node --experimental-strip-types src/lib/review-approval-validation.check.ts
node --experimental-strip-types src/services/evaluate-gri-quantitative/api.check.ts
pnpm dev   # /evaluate-gri-quantitative/requestor → open a Sent row, console must stay clean
```

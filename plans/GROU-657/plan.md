# GROU-657 — [FE] "Request Revision" flow on Evaluate GRI - Quantitative

Source: Stride task `FpA6NONGNhXJq` (GROU-657), P1, 2h estimate. No subtasks, no comments.

## ⚠️ The ticket's blocker is stale — read this first

The ticket says the endpoint is "still in development" and that flow integration is "blocked until
contract is finalized". **It is not.** The contract is in the repo and committed upstream:

- `api/Evaluate GRI - Quantitative/Request Revision.yml` — `POST {{base_url}}/v1/evaluate-gri-quantitative/request-revision`,
  body `{ id, remarks }`, **both mandatory**. 200 answers `{"code":200,"data":{},"error":false,"message":"Successfully request revision data"}`.
  Upstream commit `239045e update: add example request revision` in `vas-api-collection`
  (the repo's `api/` is a symlink into it); the file landed 2026-09-10.
- `api/Evaluate GRI - Quantitative/Index Requestor.yml:173` — a whole `Data Request Revision`
  response example showing the post-action state.

So this ticket is **fully unblocked** and needs no BE sync. Tell the reporter the dependency note is
out of date rather than waiting on it. Everything below is contract-backed, not assumed.

## Goal

Give the approver a third decision on Evaluate GRI - Quantitative, alongside Approve and Reject:
**Request Revision**, which collects mandatory remarks and hands the submission back to the requestor
in an editable state.

## What the contract actually says about the resulting state

From the `Data Request Revision` example (`Index Requestor.yml:173-265`), after the action:

- `flow_status` returns to **`"draft"`** — not a new `"revision_requested"` status. This is the single
  most important fact in this ticket and it contradicts the ticket's own wording ("status updates to
  reflect 'Revision Requested'"). Follow the contract.
- The approver's entry gets `action: "REQUEST_REVISION"`, `notes: "<remarks>"`, `acted_at`, and the
  stage gets `status: "REQUEST_REVISION"` with `decided_at` set.
- `submitted_at: null`, `submitted_by: ""` — the submission is fully returned to the requestor.

Two consequences that mean **less** work than the ticket implies:

1. **AC "requester can edit and resubmit" is already satisfied.** `isReadOnly()` returns `false` for
   `draft`, so the requestor's Submit/Update row reappears automatically. No change needed.
2. **The duplicate guard is already correct.** `BLOCKING_STATUSES` includes `draft`, so a
   revision-requested submission still blocks a duplicate create. Correct, no change.

And one that means **more**: `approval_logs` in that example is an **object**, not an array
(`"approval_logs": { … }`), while `Detail.yml:51` and the other Index example both use an array, and
`EvaluateGriQuantitativeSummary.approval_logs` is typed `ApprovalLog[]`. Treat the object form as a
seeding typo in the example, **but** do not let it crash the UI — see phase 1.

## Phases

| Phase | Scope | Depends on |
| --- | --- | --- |
| 1 | Types + `validation.ts`: `REQUEST_REVISION` in the enums, note surfacing, log-shape hardening | none |
| 2 | Service layer: `requestRevision()` in `api.ts` + `useRequestRevisionEvaluateGriQuantitative()` | none |
| 3 | `ApprovalReviewTable.vue` — remarks modal made reusable for a third action | none |
| 4 | `DetailPage.vue` — the approver's Request Revision button, modal, call, redirect | 1, 2, 3 |
| 5 | `docs/evaluate-quantitative.md` as-built refresh | none |

Phases 1, 2, 3 and 5 are dependency-free. Only phase 4 serializes, and its contracts are pinned
below so it can be written in parallel against them.

## Shared contracts

Phase 1 exports (global types, `src/services/evaluate-gri-quantitative/types.d.ts`):

```ts
type ApprovalStatus = 'WAITING_APPROVAL' | 'PENDING' | 'APPROVE' | 'APPROVED'
                    | 'REJECTED' | 'CANCEL' | 'REQUEST_REVISION'
```

Phase 1 exports (`src/services/evaluate-gri-quantitative/validation.ts`):

```ts
export function latestApproverNote(approvalLogs: ApprovalLog[]): { note: string; action: ApprovalAction } | null
```

Phase 2 exports:

```ts
// api.ts
evaluateGriQuantitativeApi.requestRevision(id: string, remarks: string, silentToast?: boolean)
// composables.ts
useRequestRevisionEvaluateGriQuantitative()  // mutateAsync({ id, remarks, silentToast? })
```

Phase 3 contract (`ApprovalReviewTable.vue` stays source-compatible for its one existing call site,
`ApprovalPage.vue:64-69`): any new mutation prop is **optional**, and the bulk Request Revision button
only renders when it is passed.

## Reuse, do not rebuild

Request Revision is structurally identical to Reject: a button, a mandatory-remarks modal, a
`{ id, remarks }` POST, a redirect to the approval queue. Copy `confirmReject()` /
`openReject()` / `closeReject()` and the reject modal at `DetailPage.vue:504-536` rather than
inventing a new pattern. `canReject(notes)` in `src/lib/review-approval-validation.ts` is already a
generic non-blank-remarks guard — reuse it as-is, do not add a `canRequestRevision()` twin.

Error toasts are automatic (`src/lib/http.ts:40,52` toasts any non-GET failure from the envelope),
**except** in the bulk loop, which passes `silentToast: true` and surfaces one summary toast itself
(`bulkErrorTitle()`). That satisfies the ticket's AC 4 with no new code on the single-row path.

## Verification (whole ticket)

```
pnpm build
node --experimental-strip-types src/lib/review-approval-validation.check.ts
node --experimental-strip-types src/services/evaluate-gri-quantitative/api.check.ts
pnpm dev   # /evaluate-gri-quantitative/approval → open a Sent row
```

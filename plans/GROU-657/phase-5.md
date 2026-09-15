# Phase 5 — As-built doc refresh

**Goal** — Record the Request Revision flow in `docs/evaluate-quantitative.md`, and correct the two
places where the new action makes an existing statement wrong.

**Files owned**
- `docs/evaluate-quantitative.md`

**Depends on** — none (write from `plan.md` + the phase files; do not wait for code).

## Context

The doc is the feature's as-built record, and it was refreshed for GROU-659 yesterday — match that
entry's style: a `> **date update (TICKET).**` banner at the top, then bullets under
`### Detail (DetailPage.vue)` in §1 that name the function doing the work.

Two existing statements go stale:

- §1 Detail, "Read-only whenever `isReadOnly(flow_status)` (anything but `draft`/`rejected`)" — still
  true, but now load-bearing for a second reason: a revision-requested submission comes back as
  `draft`, which is *why* no read-only work was needed. Say so, or someone will "fix" it later.
- §4 Known gaps, the `flow_status: 'sent'` bullet — unchanged, but the new `REQUEST_REVISION`
  enum member deserves a line near it, since it is the first status value the contract emits that
  the `SubmissionFlowStatus`/`ApprovalStatus` split did not originally cover.

Facts to record, all verified against the contract:

- `POST /v1/evaluate-gri-quantitative/request-revision`, body `{ id, remarks }`, **both mandatory**
  (`api/Evaluate GRI - Quantitative/Request Revision.yml`). 200 answers `data: {}`.
- The result, from `Index Requestor.yml`'s `Data Request Revision` example: `flow_status` returns to
  **`"draft"`** (not a dedicated "revision requested" status — the ticket's own wording is wrong
  here), `submitted_at: null`, `submitted_by: ""`, and the approver's entry carries
  `action: "REQUEST_REVISION"` with the remarks in `notes`; the stage carries
  `status: "REQUEST_REVISION"` and `decided_at`.
- Because the status is `draft`, the requestor's edit/resubmit path and the `BLOCKING_STATUSES`
  duplicate guard both already do the right thing with no change. Record this as "no work needed",
  with the reason.
- The reviewer-note banner is driven by `latestApproverNote()` (action-aware), not by
  `flow_status === 'rejected'` — otherwise a revision remark would never be shown, since the status
  is `draft`.
- `Index Requestor.yml:212` renders `approval_logs` as an **object** where every other example and
  the `ApprovalLog[]` type use an array. Record it as a probable seeding artifact that
  `latestApproverNote()` defends against with an `Array.isArray` normalisation.

## Steps

1. Add the `> **2026-09-15 update (GROU-657).**` banner under the GROU-659 one, one line: the
   approver can now hand a submission back for revision, which returns it to `draft`.
2. Under §1 → `### Detail (DetailPage.vue)`, add a **Request Revision** bullet: availability
   (`canAct`, same as Approve/Reject, approver context only), mandatory remarks via the shared
   `canReject()` guard, the endpoint, the redirect to the approval queue, and the resulting state.
3. Sub-bullet: the banner change and why the status gate had to go.
4. If phase 3 shipped, add a line to the `### Review & Approval (ApprovalPage.vue)` section about
   the bulk lane and its optional `requestRevisionMutation` prop. If it was dropped, say the queue
   has no bulk revision action yet and that the prop is optional by design.
5. §4 Known gaps — add the `approval_logs`-as-object observation, and note `REQUEST_REVISION` as a
   contract-emitted status now present in `ApprovalStatus`.
6. Correct the record on the ticket's stale blocker: one line stating the contract was already
   committed upstream (`vas-api-collection@239045e`, 2026-09-10) despite the ticket marking it
   blocked, so a future reader does not go looking for a missing endpoint.

## Acceptance

`docs/evaluate-quantitative.md` describes the action, its gating, the contract, the resulting
`draft` status and the banner behaviour. Every acceptance criterion in the ticket is traceable to a
sentence in the doc or explicitly marked as needing no FE work, with the reason. No claim contradicts
`Request Revision.yml` or `Index Requestor.yml`. The GROU-659 entry is left intact.

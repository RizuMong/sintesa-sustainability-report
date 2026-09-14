# Phase 4 — As-built doc refresh

**Goal** — Record the revise/cancel flow in `docs/evaluate-quantitative.md` so the next reader knows
the action exists, why it is gated the way it is, and what the backend does not answer.

**Files owned**
- `docs/evaluate-quantitative.md`

**Depends on** — none (write from `plan.md` + `phase-1.md` + `phase-3.md`; do not wait for code).

## Context

The doc is the feature's as-built record. Today it does not mention the cancel endpoint at all, even
though `api.ts:39` has shipped a `cancel()` since before this ticket — the only trace is one line
about `cancelled` being treated as settled (`docs/evaluate-quantitative.md:72`). After GROU-659 that
endpoint becomes user-reachable, so it needs a real entry.

Match the file's existing style: `### Detail (DetailPage.vue)` bullets under §1 Screens, prose that
names the predicate/function doing the work, and a `> **date update.**` banner if the file already
uses one (check the top; `docs/mki-quantitative.md` uses `> **2026-09-14 update (GROU-662).**`).

Facts to record, all verified:
- Endpoint `POST /v1/evaluate-gri-quantitative/cancel`, body `{ id }`, from
  `api/Evaluate GRI - Quantitative/Cancel.yml`. Its 200 example returns
  `flow_status: "draft"`, `submitted_at: null`, `submitted_by: ""`, `approval_logs: []` — the
  submission is fully reset, not merely flagged.
- Visibility is `canRevise(flow_status, fromApproval)` in `src/lib/review-approval-validation.ts`,
  defined as "not settled and not the approver context", *not* an exact match on `submitted` —
  because the live API answers `sent` for the same state (G1 in
  `docs/sustainability-reporting-portal-open-gaps.md`).
- On success the user is routed to the requestor list, per the ticket's BE-confirmed note. The detail
  page is therefore never re-rendered in the reverted state, which is why no approval-line work was
  needed for the ticket's AC 6.
- Errors are handled by the `src/lib/http.ts` response interceptor's automatic toast, same as
  submit/approve/reject. There is no per-call error handling in the page.

## Steps

1. Add the dated update banner naming GROU-659 and the one-line behaviour change.
2. Under §1 → `### Detail (DetailPage.vue)`, add a **Revise Submission** bullet: label, gating
   predicate (name the function and the not-settled reasoning), confirmation dialog, redirect target.
3. In whichever section lists the endpoints/contracts, add the `cancel` row with its body and the
   full reset its 200 example describes.
4. Note the AC-6 non-issue explicitly, so a future reader does not add approval-line handling that
   nothing can reach.
5. If the doc has a checklist section like `docs/mki-quantitative.md` §5, tick GROU-659 into it.

## Acceptance

`docs/evaluate-quantitative.md` describes the Revise Submission button, its gating rule, the cancel
contract and the redirect. Every acceptance criterion in the ticket is traceable to a sentence in the
doc or is explicitly marked as needing no FE work. No claim contradicts `Cancel.yml`.

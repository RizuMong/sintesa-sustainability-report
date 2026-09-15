# Phase 3 — Bulk Request Revision in the shared approval table

**Goal** — Let the Review & Approval queue request revision on selected rows, without breaking its
one existing call site.

**Files owned**
- `src/components/ApprovalReviewTable.vue`
- `src/pages/evaluate-gri-quantitative/ApprovalPage.vue`

**Depends on** — none for the component shape; the `ApprovalPage.vue` wiring uses phase 2's
composable, whose name is pinned in `plan.md`.

## Scope note

The ticket only demands the action "alongside Approve/Reject on the approval flow", which phase 4
delivers on the detail screen. The queue's bulk lane is included here because the component already
generalises approve and reject over a mutation prop, so a third is a small, symmetric addition and
leaving it out makes the queue inconsistent with the detail page. **If time is short, this phase is
the one to drop** — phase 4 alone satisfies every acceptance criterion. Say so in your handoff if you
skip it.

## Context

`ApprovalReviewTable.vue` is the shared table for the Review & Approval tabs. Its reject lane is
three pieces, all of which have a revision twin:

- `rejectTargetIds` / `rejectNotes` / `isBulkRejecting` state (`:220-223`)
- the remarks modal (`:96-133`), gated on `rejectTargetIds.length > 0`
- `openBulkReject()` / `closeReject()` / `confirmReject()` (`:284-325`)

`confirmReject()` is the loop to copy exactly: `silentToast: true` per call, one summary toast at the
end, `bulkErrorTitle(error, done, total)` on failure so a partial run reports how far it got. That
last detail is the ticket's AC 4 in the bulk case and is easy to lose by copying carelessly.

**Do not** generalise the existing reject modal into a shared "remarks modal" component in this
phase. Two similar modals in one file is cheaper than a new abstraction plus a refactor of a
working flow, and phase 4 needs its own copy on a different page anyway.

The only prop-shape constraint: `requestRevisionMutation` must be **optional**. Its one call site
(`ApprovalPage.vue:64-69`) will pass it, but the prop type is what makes the component reusable by
the other queues, and a required prop would be a breaking change for them.

## Steps

1. Add the optional prop to the `defineProps` block (`:197-215`), mirroring `rejectMutation`'s type:

   ```ts
   requestRevisionMutation?: {
     mutateAsync: (payload: { id: string; remarks: string; silentToast?: boolean }) => Promise<unknown>
     isPending: { value: boolean }
   }
   ```

2. Add `revisionTargetIds` / `revisionNotes` / `isBulkRequestingRevision` state.

3. Add a third button to the bulk `MpButtonGroup` (`:12-26`), between Approve and Reject,
   `v-if="requestRevisionMutation"`, `variant="secondary"`, label **"Bulk Request Revision"**,
   disabled while any bulk op runs.

4. Add the remarks modal: same structure as the reject one, header "Request revision", label
   **"Revision Notes"**, placeholder "Explain what needs to be revised", confirm button
   `variant="primary"` labelled "Request Revision", disabled by the same
   `!canReject(revisionNotes) || isBulkRequestingRevision` guard. Reuse `canReject` — it is a generic
   non-blank check, do not add a twin predicate. Give the `MpFormControl` a distinct id
   (`revision-notes`), not a duplicate of `reject-notes`.

5. Add `openBulkRequestRevision()` / `closeRequestRevision()` / `confirmRequestRevision()` as a
   faithful copy of the reject trio, with `id: 'bulk-request-revision'` on both toasts and the
   success title `Requested revision on ${ids.length} submission(s).`

6. `ApprovalPage.vue` — import `useRequestRevisionEvaluateGriQuantitative` alongside the existing
   approve/reject imports (`:132-133`), instantiate it next to them, and pass
   `:request-revision-mutation="requestRevisionMutation"` on the `<ApprovalReviewTable>` at `:64-69`.

## Acceptance

```
pnpm build
```

(The `actionVerb` error from phase 1 persists until phase 4; nothing new may originate in these two
files.)

Then `pnpm dev` → `/evaluate-gri-quantitative/approval`:
- Select one or more Sent rows: Bulk Approve, Bulk Request Revision, Bulk Reject all appear.
- Bulk Request Revision with blank notes: confirm stays disabled.
- With notes: one success toast, selection clears, the rows leave the Awaiting Approval box and
  reappear under Draft (lists invalidated by the composable).
- Reject still behaves exactly as before, and its modal is unaffected by the new one.

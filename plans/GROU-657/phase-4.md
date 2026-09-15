# Phase 4 — Request Revision on the detail screen

**Goal** — Add the approver's third decision to
`src/pages/evaluate-gri-quantitative/DetailPage.vue`, and make the returned submission show the
approver's remarks to the requestor.

**Files owned**
- `src/pages/evaluate-gri-quantitative/DetailPage.vue`

**Depends on** — phase 1 (`REQUEST_REVISION` in `ApprovalStatus`, `latestApproverNote()`) and
phase 2 (`useRequestRevisionEvaluateGriQuantitative`). Both contracts are pinned in `plan.md`; you
may write against them first, but acceptance only passes once they land.

## Context

This file is both screens: the requestor's editable form and, with `?from=approval`, the approver's
review. So this phase has two halves.

### Half A — the approver's action

The approve/reject lane is `:288-301` (button row, gated on `canAct`) plus the reject modal
(`:504-536`) plus `openReject()`/`closeReject()`/`confirmReject()` (`:876-901`). `canAct` gates on
`fromApproval && selectableApprovalIds([detail]).length > 0` — Request Revision has the **same**
availability as Approve and Reject, so reuse `canAct` unchanged. Do not add a new predicate.

`confirmReject()` is the exact shape to copy, including the bare `catch { return }`: `http.ts`
already toasted the envelope error, and swallowing it here keeps the modal open for a retry. Do not
add a toast (AC 4 is met by the interceptor) and do not log.

### Half B — the requestor sees why

`:67-68` gates the reviewer-note banner on `detail.flow_status === 'rejected'`. Per the contract, a
revision request returns the submission to `flow_status: 'draft'`, so that banner would never fire
and the requestor would get their work back with no explanation. This is the ticket's "remarks are
visible in the history" requirement and it is the half that is easy to miss.

Phase 1's `latestApproverNote()` returns `{ note, action }`. Drive the banner off it instead of off
the status: show whenever a note exists, and label it by action.

### The deliberate compile error

Phase 1 adds `REQUEST_REVISION` to `ApprovalAction`, which breaks `actionVerb`
(`:690`, typed `Record<ApprovalAction, string>`) with a missing key. Fix it by adding the verb, not
by widening the type — the map is what renders the approval line, so the ticket's "history shows who
requested it and when" requirement is literally this one entry.

## Steps

1. **Imports.** Add `useRequestRevisionEvaluateGriQuantitative` to the existing
   `@/services/evaluate-gri-quantitative` import (`:592-600`) and `latestApproverNote` to whichever
   import currently supplies `latestRejectionNote`.

2. **`actionVerb`** (`:690`) — add `REQUEST_REVISION: "Revision requested by",`. With
   `acted_at` already rendered through `formatStamp()`, the approval line now shows who and when for
   free.

3. **Script state**, next to `rejectMutation` (`:862-866`):

   ```ts
   // GROU-657 — third approver decision; same availability as approve/reject (canAct)
   const requestRevisionMutation = useRequestRevisionEvaluateGriQuantitative()
   const isRequestingRevision = computed(() => requestRevisionMutation.isPending.value)
   const isRequestingRevisionOpen = ref(false)
   const revisionNotes = ref("")
   ```

4. **Button** — a third entry in the `canAct` row (`:288-301`), between Approve and Reject:

   ```vue
   <MpButton
       variant="secondary"
       :is-disabled="isApproving || isRequestingRevision"
       @click="openRequestRevision"
       >Request Revision</MpButton
   >
   ```

   Also add `|| isRequestingRevision` to the existing Approve and Reject `:is-disabled` guards, so
   two decisions can't be fired at once.

5. **Modal** — copy the reject modal (`:504-536`), changing: header "Request revision", form control
   id `detail-revision-notes`, label **"Revision Notes"**, placeholder "Explain what needs to be
   revised", confirm `variant="primary"` labelled "Request Revision", guard
   `!canReject(revisionNotes) || isRequestingRevision`. `canReject` is already imported and is a
   generic non-blank check — reuse it, do not add a twin.

6. **Handlers**, next to the reject trio:

   ```ts
   function openRequestRevision() {
       revisionNotes.value = ""
       isRequestingRevisionOpen.value = true
   }

   function closeRequestRevision() {
       isRequestingRevisionOpen.value = false
       revisionNotes.value = ""
   }

   async function confirmRequestRevision() {
       if (!detail.value || !canReject(revisionNotes.value)) return
       try {
           await requestRevisionMutation.mutateAsync({
               id: detail.value.id,
               remarks: revisionNotes.value.trim(),
           })
       } catch {
           // http.ts already toasted the envelope error — keep the modal open for a retry
           return
       }
       closeRequestRevision()
       router.push("/evaluate-gri-quantitative/approval")
   }
   ```

7. **Banner** (half B). Replace the `rejectionNote` computed (`:741-743`) with one driven by
   `latestApproverNote(detail.value.approval_logs)`, and change the `v-if` at `:67-68` from the
   status check to "a note exists and the submission is back with the requestor":

   ```ts
   const approverNote = computed(() =>
       detail.value ? latestApproverNote(detail.value.approval_logs) : null,
   )
   const noteIsRevision = computed(() => approverNote.value?.action === "REQUEST_REVISION")
   ```

   Banner shows when `approverNote && !fromApproval && !readOnly` — i.e. the requestor has the
   submission back and there is something to read. Badge/heading switch on `noteIsRevision`:
   `type="warning"` + "Revision requested" vs the existing `type="critical"` + "rejected" /
   "Reviewer note". Keep `latestRejectionNote`'s import only if something still uses it; otherwise
   drop it from the import list so the build stays warning-free.

## Acceptance

```
pnpm build                                                                  # now clean, actionVerb error gone
node --experimental-strip-types src/lib/review-approval-validation.check.ts
node --experimental-strip-types src/services/evaluate-gri-quantitative/api.check.ts
```

Then `pnpm dev`:
- `/evaluate-gri-quantitative/approval` → open a Sent row → Approve, **Request Revision**, Reject all
  render. Blank notes keep the confirm disabled. Confirm → success toast ("Successfully request
  revision data") → back on the approval queue, row gone from Awaiting Approval.
- `/evaluate-gri-quantitative/requestor` → the same submission now sits under **Draft**, opens
  editable, shows a **Revision requested** banner with the approver's remarks, and Submit/Update are
  available (no code needed for that — `isReadOnly('draft')` is already false).
- The approval line on that submission reads "Revision requested by <position> | <email>" with its
  timestamp.
- A genuinely rejected submission still shows the old red "Reviewer note" banner, unchanged.
- Failure path (offline / bad id): error toast, modal stays open, no crash. Console clean.

# Phase 3 — Wire "Revise Submission" into the detail screen

**Goal** — Add the button, the confirmation, the cancel call and the redirect on
`src/pages/evaluate-gri-quantitative/DetailPage.vue`.

**Files owned**
- `src/pages/evaluate-gri-quantitative/DetailPage.vue`

**Depends on** — phase 1 (`canRevise`) and phase 2 (`confirm-label` / `confirm-variant` props). Both
contracts are fixed in `plan.md`; you may write against them before they land, but run acceptance
only after.

## Context

Ticket requirements, condensed:
- Button labeled **"Revise Submission"**, only when status is Sent.
- Click → confirmation dialog → POST cancel with the submission `id`.
- Success → back to the **list view** (confirmed in the ticket notes, not "stay on the page").
- Failure → error toast, no silent failure.
- Hidden for every other status.

Everything below the UI already exists — see `plan.md` §"What already exists". You are importing
`useCancelEvaluateGriQuantitative` and calling it; you are not touching `api.ts` or `composables.ts`.

Patterns in this exact file to copy:
- **Action button row**: `:272-286` (`!readOnly` block, Submit + Update). The revise button is a
  *different* visibility condition, so give it its own `MpFlex` row rather than squeezing it in.
- **Confirm-modal state**: `isConfirmingDelete = ref(false)` + `<ConfirmDeleteModal>` at `:496-503`
  + `confirmDelete()` at `:836-849`. Mirror that trio exactly.
- **Mutation + redirect + error handling**: `confirmReject()` at `:888-901`. Note the shape:
  bare `try { await …mutateAsync(…) } catch { return }` then `router.push(…)`. The empty catch is
  deliberate — `src/lib/http.ts` already toasted the error. Do not add a toast, do not log.
- **Pending state**: `isApproving`/`isRejectSubmitting` computed off `mutation.isPending.value`
  (`:863-864`), bound to `:is-disabled` and `:is-loading`.

## Steps

1. **Import** `canRevise` from `@/lib/review-approval-validation` (the file already imports
   `canReject`, `selectableApprovalIds` from there — add to that import, see `:586-590`), and
   `useCancelEvaluateGriQuantitative` from `@/services/evaluate-gri-quantitative` (the file already
   imports `useUpdateEvaluateGriQuantitative`, `useSubmitEvaluateGriQuantitative` there).

2. **Script state**, next to the other mutations (~`:781-785`):

   ```ts
   // GROU-659 — the requestor pulls a sent submission back to draft to revise it
   const cancelMutation = useCancelEvaluateGriQuantitative()
   const isRevising = computed(() => cancelMutation.isPending.value)
   const isConfirmingRevise = ref(false)
   const canReviseSubmission = computed(() =>
     Boolean(detail.value) && canRevise(detail.value!.flow_status, fromApproval.value),
   )
   ```

3. **Button**, its own row placed directly after the `!readOnly` Submit/Update `MpFlex` (`:286`).
   It must be outside that block: when the submission is sent, `readOnly` is `true`, so the
   Submit/Update row is hidden and this is the only action the requestor has.

   ```vue
   <MpFlex v-if="canReviseSubmission" gap="3" paddingTop="2">
       <MpButton
           variant="secondary"
           :is-disabled="isRevising"
           :is-loading="isRevising"
           @click="isConfirmingRevise = true"
           >Revise Submission</MpButton
       >
   </MpFlex>
   ```

4. **Confirmation modal**, next to the existing `<ConfirmDeleteModal>` at `:496`:

   ```vue
   <ConfirmDeleteModal
       :is-open="isConfirmingRevise"
       title="Revise this submission?"
       message="This pulls the submission back out of approval and returns it to draft so you can edit it. Approvers will no longer see it in their queue."
       confirm-label="Revise Submission"
       confirm-variant="primary"
       @close="isConfirmingRevise = false"
       @confirm="confirmRevise"
   />
   ```

5. **Handler**, next to `confirmDelete()`:

   ```ts
   async function confirmRevise() {
       if (!detail.value) return
       try {
           await cancelMutation.mutateAsync(detail.value.id)
       } catch {
           // http.ts already toasted the envelope error — leave the modal open so the user can retry
           return
       }
       isConfirmingRevise.value = false
       router.push('/evaluate-gri-quantitative/requestor')
   }
   ```

   Always the requestor route, never the approval one — `canRevise()` already guarantees
   `fromApproval` is false here.

## Acceptance

```
pnpm build
node --experimental-strip-types src/lib/review-approval-validation.check.ts
node --experimental-strip-types src/services/evaluate-gri-quantitative/api.check.ts
```

Then `pnpm dev` → `/evaluate-gri-quantitative/requestor`:
- Open a **Sent / Awaiting Approval** row: "Revise Submission" is visible; Submit/Update are not.
- Open a **Draft** row: Submit/Update visible, no Revise button.
- Open an **Approved** and a **Rejected** row: no Revise button.
- Open any row with `?from=approval`: no Revise button, Approve/Reject unchanged.
- Click Revise → modal with a primary-styled "Revise Submission" confirm → confirm → success toast
  ("Successfully cancel data", from the interceptor) → lands on the requestor list, and the row now
  reads Draft (lists are invalidated by the composable).
- Simulate a failure (offline, or a bad id): error toast appears, modal stays open, no crash.
- Console clean.

# Phase 1 — Types and note surfacing

**Goal** — Teach the type layer and the pure helpers about `REQUEST_REVISION`, and make the
"reviewer note" banner cover a revision request, not just a rejection.

**Files owned**
- `src/services/evaluate-gri-quantitative/types.d.ts`
- `src/services/evaluate-gri-quantitative/validation.ts`
- `src/services/evaluate-gri-quantitative/api.check.ts`

**Depends on** — none.

## Context

`types.d.ts:12` aliases one union into both slots, with a comment explaining why:

```ts
type ApprovalStatus = 'WAITING_APPROVAL' | 'PENDING' | 'APPROVE' | 'APPROVED' | 'REJECTED' | 'CANCEL'
type ApprovalAction = ApprovalStatus
type ApprovalStageStatus = ApprovalStatus
```

The contract emits `REQUEST_REVISION` in **both** slots (`Index Requestor.yml:217` on the approver's
`action`, `:239` on the stage's `status`), so the alias still holds and one addition covers both.
The file header says "Verbatim from api/… — do not change field names" — adding a member the API
demonstrably emits is exactly in keeping with that.

Adding the member makes `actionVerb` in `DetailPage.vue:690` a **compile error**, because it is typed
`Record<ApprovalAction, string>` and will be missing a key. That is the point: the type system will
force phase 4 to handle the new action rather than silently rendering `undefined` in the approval
line. Do not widen the Record to make the error go away.

### The note banner

`latestRejectionNote()` (`validation.ts:44`) picks the most recent approver entry that has both
`notes` and `acted_at` — it never inspects `action`, so it **already** returns a revision remark.
The problem is the caller: `DetailPage.vue:67-68` gates the banner on
`detail.flow_status === 'rejected'`, and after a revision request the status is `draft`, so the
remark never shows. The requestor would get their submission back with no idea what to change,
failing the ticket's history/remarks requirement.

Rather than adding a second near-identical helper, generalise: return the action alongside the note
so the caller can label the banner correctly.

### The log-shape hazard

`Index Requestor.yml:212` renders `approval_logs` as an **object**, where `Detail.yml:51`, the other
Index example, and the `ApprovalLog[]` type all use an array. Almost certainly a seeding artifact,
but `latestApproverNote()` runs `.flatMap` on it and would throw on the object form, blanking the
whole detail page. Cheap insurance: normalise at the top of the helper.

## Steps

1. `types.d.ts` — add `| 'REQUEST_REVISION'` to `ApprovalStatus`, and extend the existing comment to
   note the source (`Index Requestor.yml`'s `Data Request Revision` example, both slots).

2. `validation.ts` — add, directly above `latestRejectionNote`:

   ```ts
   // GROU-657 — a rejection and a revision request both hand the submission back with a note; the
   // banner needs to know which. Kept separate from latestRejectionNote() so existing callers are
   // untouched. The Array.isArray guard is for Index Requestor.yml's 'Data Request Revision'
   // example, which renders approval_logs as a bare object rather than the documented array.
   export function latestApproverNote(
     approvalLogs: ApprovalLog[] | ApprovalLog | null | undefined,
   ): { note: string; action: ApprovalAction } | null {
     const logs = Array.isArray(approvalLogs) ? approvalLogs : approvalLogs ? [approvalLogs] : []
     const acted = logs
       .flatMap((log) => log.approvers ?? [])
       .filter((a): a is ApprovalApprover & { acted_at: number; notes: string } =>
         Boolean(a.notes && a.acted_at),
       )
       .sort((a, b) => b.acted_at - a.acted_at)
     return acted[0] ? { note: acted[0].notes, action: acted[0].action } : null
   }
   ```

   Leave `latestRejectionNote()` in place; re-express it as a one-liner over the new helper so there
   is only one sort order to maintain:

   ```ts
   export function latestRejectionNote(approvalLogs: ApprovalLog[]): string | null {
     return latestApproverNote(approvalLogs)?.note ?? null
   }
   ```

3. Re-export `latestApproverNote` from `api.ts`'s existing `export { … } from './validation'` block
   (`api.ts:4-16`, alphabetical — it goes right before `latestRejectionNote`). `api.ts` is otherwise
   phase 2's file; this one line is the only overlap, so **phase 1 owns the export block** and phase
   2 owns the `evaluateGriQuantitativeApi` object below it. Do not both edit the same lines.

4. `api.check.ts` — add assertions next to the existing AC-85 block (`:64+`), reusing its
   `approvalLogs` fixture:

   ```ts
   assert.deepEqual(latestApproverNote(approvalLogs), { note: 'latest note', action: 'REJECTED' })
   assert.equal(latestApproverNote([]), null)
   assert.equal(latestApproverNote(null), null)
   // the object form Index Requestor.yml's revision example emits must not throw
   assert.deepEqual(latestApproverNote(approvalLogs[1]), { note: 'latest note', action: 'REJECTED' })
   ```

   Plus one fixture with `action: 'REQUEST_REVISION'` asserting the action is returned verbatim.
   Add `latestApproverNote` to the file's import list.

## Acceptance

```
node --experimental-strip-types src/services/evaluate-gri-quantitative/api.check.ts   # ok
```

`pnpm build` will **fail** at this phase with a missing-key error on `actionVerb` in
`DetailPage.vue`. That is expected and is fixed in phase 4 — do not patch `DetailPage.vue` from here,
it is phase 4's file. Note the failure in your handoff so the phase-4 agent expects it.

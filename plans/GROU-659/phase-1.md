# Phase 1 — `canRevise()` predicate

**Goal** — Add the pure predicate that decides whether the "Revise Submission" button is shown, with
a test that pins the `submitted`/`sent` ambiguity.

**Files owned**
- `src/lib/review-approval-validation.ts`
- `src/lib/review-approval-validation.check.ts`

**Depends on** — none.

## Context

This file already holds the sibling predicates for this flow: `canReject()` (blank-notes guard) and
`selectableApprovalIds()` (which statuses are actionable). Both are pure and dependency-free, and the
header comment explains why — `.check.ts` imports by relative path so Node needs no `@/` alias
resolution. Keep that property: no Vue, no imports.

`selectableApprovalIds()` at line 13 already encodes the key fact you need:

```ts
const ACTIONABLE_STATUSES = ['submitted', 'sent']
```

The live Index Approval example answers `'sent'` where the `§3`-locked `SubmissionFlowStatus` union
says `'submitted'`. The ticket says the button shows on status **'Sent'**. Do not match `'sent'`
alone and do not match `'submitted'` alone — express the rule as "not settled", which covers both
spellings and any future in-review status:

```ts
const SETTLED_STATUSES = ['draft', 'approved', 'rejected', 'cancelled']
```

This mirrors `isAwaitingApproval()` in
`src/services/evaluate-gri-quantitative/validation.ts` (the same list, same reasoning).

The `fromApproval` argument exists because `DetailPage.vue` is shared by requestor and approver
(`isDetailReadOnly()` in the same service, and `fromApproval` at `DetailPage.vue:693`). Cancel is a
requestor-only action, so the approver context must never see the button.

## Steps

1. Append to `src/lib/review-approval-validation.ts`:

   ```ts
   // GROU-659 — the requestor can pull a submission back out of approval ("Revise Submission",
   // POST /cancel → flow_status returns to 'draft'). Expressed as "not settled" rather than an
   // exact match on 'submitted' for the same reason ACTIONABLE_STATUSES lists 'sent': the live API
   // answers both spellings for the in-review state. Approver context never gets this action.
   const SETTLED_STATUSES = ['draft', 'approved', 'rejected', 'cancelled']

   export function canRevise(flowStatus: string, fromApproval: boolean): boolean {
     return !fromApproval && !SETTLED_STATUSES.includes(flowStatus)
   }
   ```

2. Append assertions to `src/lib/review-approval-validation.check.ts`, following its existing
   one-line `assert.equal` style:

   ```ts
   assert.equal(canRevise('submitted', false), true)
   assert.equal(canRevise('sent', false), true, "the live API's spelling of in-review must also qualify")
   assert.equal(canRevise('draft', false), false)
   assert.equal(canRevise('approved', false), false)
   assert.equal(canRevise('rejected', false), false)
   assert.equal(canRevise('cancelled', false), false)
   assert.equal(canRevise('sent', true), false, 'approver context never revises')
   ```

   Add `canRevise` to the file's existing import from `./review-approval-validation.ts`.

## Acceptance

```
node --experimental-strip-types src/lib/review-approval-validation.check.ts   # prints ok (or exits 0 silently, match the file's existing ending)
pnpm build
```

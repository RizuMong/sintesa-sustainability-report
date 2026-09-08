# GROU-650 — Submit & Update buttons appear on rejected data in Approval sub-menu

Stride id `2BFpyscYU5X4` · status Backlog · P? · bug

## Goal

In the Approval context (`/evaluate-gri-quantitative/detail?from=approval`), a submission with
`flow_status: 'rejected'` must not offer requester-side editing actions (Submit, Update, Delete,
editable cells). Approval context is approve/reject/view-only. Requestor context keeps today's
behaviour: rejected reopens for edit + resubmit (AC-84, `isReadOnly()`).

## Root cause

`src/pages/evaluate-gri-quantitative/DetailPage.vue:658`

```ts
const readOnly = computed(() => !detail.value || isReadOnly(detail.value.flow_status))
```

`isReadOnly()` (`src/services/evaluate-gri-quantitative/validation.ts:29`) returns **false** for
`'rejected'` on purpose — that is the requestor's revise-and-resubmit path. The detail page is
shared by both contexts and never folds `route.query.from === 'approval'` into `readOnly`, so a
rejected row opened from the approval queue renders the editor.

`readOnly` is the single gate behind all three symptoms:
- `:56` Delete button — `v-if="detail && !readOnly && flow_status === 'draft'"` (draft-only, so not
  visible on rejected — no change, but keep it correct)
- `:247` Submit + Update block — `v-if="!readOnly"` ← the reported bug
- cell inputs / evidence `:disabled="readOnly"` (`:216` and the `DynamicFieldInput` bindings)

Fixing `readOnly` fixes all of them at once. Do **not** patch the button block alone — the inputs
stay editable and the bug comes back through a different door.

## Phases

| # | Goal | Files | Depends on |
|---|------|-------|------------|
| 1 | Gate `readOnly` on approval context + check test | `DetailPage.vue`, `validation.ts`, `api.check.ts` | none |

Single phase — one computed and its helper. Splitting it would put two agents in the same file.

## Shared contract

```ts
// src/services/evaluate-gri-quantitative/validation.ts
export function isReadOnly(flowStatus: SubmissionFlowStatus | string): boolean // unchanged
export function isDetailReadOnly(flowStatus: SubmissionFlowStatus | string, fromApproval: boolean): boolean
// = fromApproval || isReadOnly(flowStatus)
```

`canAct` (`DetailPage.vue:794`) is unrelated and must keep working — it gates Approve/Reject on
`from === 'approval'` + `selectableApprovalIds()`. A rejected row is not selectable, so the approval
view of rejected data ends up with **no** action buttons at all, only the reviewer note + approval
line. That matches AC 1–2.

## Verification

```
pnpm build
node --experimental-strip-types src/services/evaluate-gri-quantitative/api.check.ts
```

Manual: `/evaluate-gri-quantitative/detail?id=<rejected>&from=approval` → no Submit/Update/Delete,
inputs disabled. Same id without `&from=approval` → Submit + Update present (AC 3 regression).
`from=approval` on a pending row → Approve/Reject still shown.

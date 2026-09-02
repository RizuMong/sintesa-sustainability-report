# Phase 1 — Resolve the draft-case requester to an email

**Goal.** "Requested by" never renders a raw project-user id.

**Files owned**
- `src/pages/evaluate-gri-quantitative/DetailPage.vue`

**Depends on:** none

## Context

Ticket:
> Approval line shows `Requested by izEEBmvDjfgN`. Expected: the requester's email
> (e.g. `Requested by muhammad.faqih@mekari.com`) or display-name equivalent.

Current binding, `src/pages/evaluate-gri-quantitative/DetailPage.vue:288-292`:

```vue
<MpText weight="semiBold">
  Requested by
  {{ detail.submitted_by || detail.created_by_project_user }}
</MpText>
```

`submitted_by` is already the email for anything past draft — keep it first. The fallback is the bug.

The only user identity the FE can reach is the **current** user: `useGetUserProfile()` in
`src/services/user-profile/composables.ts` (`UserProfile.email`). There is no id→email lookup for
`created_by_project_user`, and a draft is only reachable from the requestor list — the viewer *is* the creator —
so the current profile's email is the correct value in practice. Anything else (an approver somehow opening
someone else's draft) must not print the raw id; print nothing identifying rather than an opaque id.

Copy the import/usage style of the other service composables already imported at the top of this file.

## Steps

1. Import and call `useGetUserProfile()` in the `<script setup>` block, next to the existing
   `use*EvaluateGriQuantitative*` composable calls.
2. Add a `requestedBy` computed: return `detail.submitted_by` when non-empty; otherwise the loaded profile's
   `email`; otherwise `'—'`. Never fall through to `created_by_project_user`.
3. Replace the interpolation at line ~290 with `{{ requestedBy }}`.
4. Leave the `MpTimelineCaption` below it (`formatStamp(detail.submitted_at ?? detail.created_at)`) unchanged.
5. Add a `ponytail:` comment above the computed naming the ceiling and the upgrade path, matching the style of the
   existing markers in this file (e.g. `:608`, `:669`): the current-user email stands in for the draft creator
   because no id→email lookup exists; delete it once `/detail` returns the creator's email.
6. Do **not** touch `approverLabel()` (`:601`) or the approver caption — they already show email / name.

## Acceptance

```
pnpm build
```

Manually:
- Draft submission → Approval line → `Requested by <your email>`, no `L5RR6...`-style id anywhere in the panel.
- Submitted submission → `Requested by <submitter email>` (value comes from `submitted_by`, unchanged from today).
- Every approver row still reads `<verb> <position> | <email>`.

# GROU-649 · Phase 1 — resolve the requester label without the raw id

**Depends on:** none

## Goal

Replace the inline three-term fallback in the Approval line with a helper that falls back to the
signed-in user's email (requestor context only) before it ever shows `created_by_project_user`.

## Files owned

- `src/services/evaluate-gri-quantitative/requester-label.ts` (new)
- `src/services/evaluate-gri-quantitative/requester-label.check.ts` (new)
- `src/pages/evaluate-gri-quantitative/DetailPage.vue`

## Context

Ticket, expected behaviour: *"Approval line should display the requester's email (or display name,
per FE's standard) instead of the raw user ID. This should be consistent across all entry points
that generate an approval line — both on new data creation and on existing submissions."*

Confirmed in `api/`: neither `Detail.yml` nor `Create.yml` returns `created_by_user` or
`submitted_by`; only `Index Requestor.yml` has `submitted_by`, and only because that example is
already submitted. See `plan.md` for line numbers.

Patterns to imitate:
- pure helper + `ponytail:` comment: `src/services/evaluate-gri-quantitative/validation.ts:1-2,25-31`
- check-file header + assertions: `src/services/evaluate-gri-quantitative/api.check.ts:1-11,49-54`
- profile query usage: `src/services/user-profile/composables.ts:4` (`useGetUserProfile`)
- the label itself: `src/pages/evaluate-gri-quantitative/DetailPage.vue:290-300`

## Steps

1. Create `requester-label.ts` (kept out of `api.ts` so the check file can import it by relative
   path without the `@/` alias, same reason as `validation.ts`):

   ```ts
   // ponytail: the backend returns no requester email on detail/create (api/Evaluate GRI -
   // Quantitative/{Detail,Create}.yml — created_by_project_user only), so a just-created draft has
   // nothing but the raw id to show. In the requestor context the viewer IS the requester, so their
   // own profile email stands in. Delete this branch the moment BE ships created_by_user on detail.
   export function requesterLabel(
     submission: Pick<EvaluateGriQuantitativeSummary, 'created_by_user' | 'submitted_by' | 'created_by_project_user'>,
     viewerEmail: string | undefined,
     isOwnContext: boolean,
   ): string {
     if (submission.created_by_user?.email) return submission.created_by_user.email
     if (submission.submitted_by) return submission.submitted_by
     if (isOwnContext && viewerEmail) return viewerEmail
     return submission.created_by_project_user
   }
   ```

2. Create `requester-label.check.ts` with the run-command header comment and assert: BE email wins
   over everything; `submitted_by` wins over the viewer email; viewer email used when both are
   absent and `isOwnContext` is true; **raw id** returned when `isOwnContext` is false (approver must
   never see their own email as the requester); raw id returned when there is no viewer email yet.

3. `DetailPage.vue` — import `requesterLabel` alongside the existing
   `@/services/evaluate-gri-quantitative` imports (`:566-569`) and `useGetUserProfile` from
   `@/services/user-profile`; add near `readOnly` (`:658`):

   ```ts
   const { data: profile } = useGetUserProfile();
   const fromApproval = computed(() => route.query.from === "approval");
   const requestedBy = computed(() =>
       detail.value ? requesterLabel(detail.value, profile.value?.email, !fromApproval.value) : "",
   );
   ```

   If GROU-650's phase already added `fromApproval`, reuse it — do not declare it twice.

4. `DetailPage.vue:294-299` — replace the inline `||` chain with `{{ requestedBy }}`.

5. Leave `created_by_user` in `types.d.ts` as-is (optional). It stays the preferred source and costs
   nothing; update its comment to point at this ticket instead of the closed one.

## Acceptance

```
node --experimental-strip-types src/services/evaluate-gri-quantitative/requester-label.check.ts
pnpm build
```

Both pass. In the running app, the ticket's repro (Submission → create → save) shows
`Requested by <signed-in email>` with no id anywhere in the approval line; a submitted row opened
from Review & Approval shows the requester's email, not the approver's.

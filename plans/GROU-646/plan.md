# GROU-646 — Display requester's email instead of user ID in Approval Line

Task id `B9pKo7Cj3jobL` · status Backlog · assignee Abdullah Abdullah

## Goal

The "Requested by" line of the Approval line panel renders
`detail.submitted_by || detail.created_by_project_user`. `submitted_by` **is already the email** in the API
(`api/Evaluate GRI - Quantitative/Index Requestor.yml:157` → `"submitted_by": "rizki.haddi@mekari.com"`), but a
**draft** submission has never been submitted, so that field is empty and the fallback prints the raw project-user
id (`Detail.yml:54` → `"created_by_project_user": "L5RR6EypnHYg"`). That is exactly the repro in the ticket
("Open a submission in draft status"). Fix the fallback, don't touch the `submitted_by` path.

## Phases

| # | Goal | Depends on |
|---|------|------------|
| 1 | Resolve the draft-case requester to an email in the detail page | none |

Single phase — one file, one binding. Splitting it would cost more than it saves.

## Shared contracts

Already-global (`src/services/evaluate-gri-quantitative/types.d.ts`):

```ts
interface EvaluateGriQuantitativeSummary {
  created_by_project_user: string   // raw project-user id, e.g. "L5RR6EypnHYg"
  submitted_by: string              // email once submitted, empty on a draft
  flow_status: SubmissionFlowStatus // 'draft' | 'submitted' | ...
}
```

Available user source (`src/services/user-profile/`): `useGetUserProfile()` → `UserProfile { name, email, ... }`
from `GET /v1/user/profile`. There is **no** id→email lookup endpoint in `api/` for `created_by_project_user`.

## Verification

```
pnpm build
```

Then: Evaluate GRI Quantitative → open a **draft** submission → Approval line → "Requested by" shows an email.
Open a **submitted** one → still shows `submitted_by` unchanged.

## Notes

- AC #2 ("applies consistently across all approval line entries") is **already satisfied** — `approverLabel()`
  (`src/pages/evaluate-gri-quantitative/DetailPage.vue:601`) renders `${position.name} | ${a.user.email}` and the
  caption uses `a.user.name`. Only the top "Requested by" node is broken. No change needed there; verify, don't edit.
- AC #3 asks to confirm with BE. The answer from the collection: for submitted records the email is already
  there; for drafts nothing carries it. Phase 1 ships the client-side fallback and leaves a `ponytail:` marker —
  raise with BE to add a `created_by_project_user_email` (or make it a `Ref2`-style `{id, name/email}`) on
  `/v1/evaluate-gri-quantitative/detail`, then delete the fallback.
- Stride's `/v1/comments/index` is down for this backend, so this plan is built from the ticket description +
  repo only. Re-read ticket discussion before merging if it comes back.
- `src/pages/evaluate-gri-quantitative/DetailPage.vue` is also owned by **GROU-647 phase 2**. Land one, then the other.

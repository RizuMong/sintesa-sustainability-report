# GROU-649 — [Bug · Reopened] Approval line shows requester's User ID instead of Email on data creation

Stride id `58HZu0GQC2Zjv` · status Backlog · reopen of "[FE] Display requester's email instead of
user ID in Approval Line" (`B9pKo7Cj3jobL`, Done).

## Goal

`Requested by <id>` must never render a raw project-user id. Right after create — a `draft` with no
`submitted_by` yet — the Approval line falls all the way through to `created_by_project_user`
(`izEEBmvDjfgN`). Show the requester's email there instead.

## Root cause — confirmed against the API collection, not guessed

`src/pages/evaluate-gri-quantitative/DetailPage.vue:294-299`

```
Requested by {{ detail.created_by_user?.email || detail.submitted_by || detail.created_by_project_user }}
```

The previous fix added the `created_by_user?: {id,name,email}` field
(`src/services/evaluate-gri-quantitative/types.d.ts:96-98`) as an *optional* field pending a BE
change. That change never shipped:

- `api/Evaluate GRI - Quantitative/Detail.yml:54` — response has `created_by_project_user`, **no**
  `created_by_user`, **no** `submitted_by`.
- `api/Evaluate GRI - Quantitative/Create.yml:78` — same, `created_by_project_user` only.
- `api/Evaluate GRI - Quantitative/Index Requestor.yml:137,157` — has `created_by_project_user`
  **and** `submitted_by: "rizki.haddi@mekari.com"`, because that example is already submitted.

So the chain only ever resolves to an email once the record has been submitted. On a fresh draft
both earlier terms are undefined → raw id. That is exactly the reported repro (ticket step 4:
"Successfully create data", then the approval line shows the id).

**Answer to ticket AC 3** ("confirm with BE whether the create endpoint returns the email"): it does
not, and neither does `detail`. Two ways forward, and they are not exclusive:

- **BE (real fix, not in this plan's scope):** add `created_by_user` (or `created_by_email`) to
  `detail` + `create`. The FE already reads it first and will pick it up with zero changes.
- **FE (this plan):** a draft in the requestor context was, by construction, created by the person
  looking at it — `/v1/evaluate-gri-quantitative/index` is already scoped to the caller. Fall back
  to the signed-in user's own profile email instead of to the raw id.

## Phases

| # | Goal | Files | Depends on |
|---|------|-------|------------|
| 1 | Requester-label fallback + check test | `DetailPage.vue`, `requester-label.ts`, `requester-label.check.ts` | none |

Single phase; one label, one helper, one test. A second phase would share `DetailPage.vue`.

## Shared contract

```ts
// src/services/evaluate-gri-quantitative/requester-label.ts  (new, pure — no imports)
export function requesterLabel(
  submission: Pick<EvaluateGriQuantitativeSummary, 'created_by_user' | 'submitted_by' | 'created_by_project_user'>,
  viewerEmail: string | undefined,
  isOwnContext: boolean,
): string
```

Resolution order: `created_by_user.email` → `submitted_by` → (`isOwnContext` ? `viewerEmail` : —) →
`created_by_project_user` (last-resort, still better than blank).

`isOwnContext` = not opened from the approval queue. In the approval context the viewer is *not* the
requester, so the viewer's email must never be substituted — that would be a worse bug than the id.
Approval-queue rows are always submitted, so `submitted_by` covers them.

Viewer email source: `useGetUserProfile()` (`src/services/user-profile/composables.ts:4`) →
`UserProfile.email`. `UserProfile` carries no id (`src/services/user-profile/types.d.ts`), so an
id-to-viewer match is not possible — hence the context flag.

## Verification

```
pnpm build
node --experimental-strip-types src/services/evaluate-gri-quantitative/requester-label.check.ts
```

Manual, the ticket's repro: Evaluate GRI Quantitative → Submission → create (entity + period +
template) → save → approval line reads `Requested by <your email>`. Then submit it and reload:
still an email (now `submitted_by`). Then open a submitted row from Review & Approval as a different
user: shows the **requester's** email, not the approver's.

## Note for the ticket

GROU-649 AC 2 asks for a regression check on the original ticket's scope. The original fix is intact
— it just depended on a BE field that was never deployed. Worth replying on the Stride ticket with
the `Detail.yml` / `Create.yml` evidence above so BE can decide whether to add `created_by_user`; if
they do, delete the viewer-email fallback rather than keeping both.

# Phase 2 — Service layer

**Goal** — Add the `request-revision` endpoint call and its mutation composable.

**Files owned**
- `src/services/evaluate-gri-quantitative/api.ts` (the `evaluateGriQuantitativeApi` object only — the
  `export { … } from './validation'` block at `:4-16` belongs to phase 1)
- `src/services/evaluate-gri-quantitative/composables.ts`

**Depends on** — none.

## Context

Contract, verbatim from `api/Evaluate GRI - Quantitative/Request Revision.yml`:

```
POST {{base_url}}/v1/evaluate-gri-quantitative/request-revision
{ "id": "aCxPWRWtkN9l",  // Mandatory
  "remarks": "Salah nii revisii.." }  // Mandatory
200 -> { "code": 200, "data": {}, "error": false, "message": "Successfully request revision data" }
```

`data` is `{}`, so the response type is `Record<string, never>` — same as `approve`/`reject`, not
`Partial<EvaluateGriQuantitative>` like `submit`/`cancel`. Copy `reject()` exactly
(`api.ts:47-51`): same mandatory-remarks shape, same `silentToast` meta passthrough (needed so the
bulk loop in phase 3 can suppress per-call toasts).

`composables.ts:87-94` has the matching `useRejectEvaluateGriQuantitative()`. Copy it, including the
`onSuccess: () => invalidateLists(queryClient)` — a revision request flips the row to `draft`, so
both the requestor and approval lists are stale and must refetch. That is also what makes the row
disappear from the approver's Awaiting Approval box without any page-level code.

Keep both additions positioned next to their reject sibling, not appended at the bottom, so the
approve/reject/request-revision trio reads together.

## Steps

1. `api.ts` — after `reject()`:

   ```ts
   // GROU-657 — third approver decision: hand the submission back for revision. Per
   // api/…/Request Revision.yml both fields are mandatory, and the 200 answers data: {}.
   // Index Requestor.yml's 'Data Request Revision' example shows the result: flow_status returns
   // to 'draft' with action/status REQUEST_REVISION recorded on the approval log.
   async requestRevision(id: string, remarks: string, silentToast = false) {
     return unwrap<Record<string, never>>(
       http.post('/v1/evaluate-gri-quantitative/request-revision', { id, remarks }, { meta: { silentToast } }),
     )
   },
   ```

2. `composables.ts` — after `useRejectEvaluateGriQuantitative()`:

   ```ts
   export function useRequestRevisionEvaluateGriQuantitative() {
     const queryClient = useQueryClient()
     return useMutation({
       mutationFn: (payload: { id: string; remarks: string; silentToast?: boolean }) =>
         evaluateGriQuantitativeApi.requestRevision(payload.id, payload.remarks, payload.silentToast),
       onSuccess: () => invalidateLists(queryClient),
     })
   }
   ```

3. Check `src/services/evaluate-gri-quantitative/index.ts` — if it re-exports the composables
   explicitly rather than with `export *`, add the new one there too, or phase 4's import fails.

## Acceptance

```
pnpm build
```

Expect the pre-existing `actionVerb` missing-key error from phase 1 until phase 4 lands; **no new**
error may originate in `api.ts` or `composables.ts`.

Grep check: `grep -rn 'request-revision' src/` returns exactly one line, in `api.ts`. The URL string
must not be duplicated into a page.

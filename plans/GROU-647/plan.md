# GROU-647 — Handle BE validation error response with toast (Evaluate GRI - Quantitative)

Task id `fU5ADOo9ixWmQ` · status Backlog · assignee Abdullah Abdullah

## Goal

The Workflow API answers **HTTP 200** with an envelope of `{code: 4xx, error: true, message: "<validation message>"}`
on validation failures. `src/lib/http.ts`'s response interceptor only inspects the envelope for the two
*auth* messages (`statusFromResponse`), so a validation failure takes the **success** branch: it fires a
**green success toast carrying the validation text**, and `unwrap()` returns `.data.data` (empty), so the
caller believes the write succeeded. Fix it once in the interceptor — every module routes through this
instance, so patching the page would leave every sibling caller broken.

## Phases

| # | Goal | Depends on |
|---|------|------------|
| 1 | Reject `error: true` envelopes in the http interceptor, toast them as errors, + check test | none |
| 2 | Catch the now-rejecting mutations in the Evaluate GRI Quant detail page | none (independent files) |

## Shared contracts

`ApiEnvelope<T>` (already in `src/lib/http.ts`):

```ts
export interface ApiEnvelope<T> { code: number; data: T; error: boolean; message: string }
```

Failure case observed: `status 200`, body `{"code": 400, "data": null, "error": true, "message": "..."}`.
Auth failures keep their existing path — `statusFromResponse` maps `ERR_TOKEN_EXPIRED` / `ERR_UNAUTHORIZED`
before the new guard runs, so do not reorder those checks.

Opt-out already exists and must keep working: `config.meta.silentToast` (declared via the `axios` module
augmentation at the top of `http.ts`; used by `evaluateGriQuantitativeApi.approve/reject`).

## Verification

```
pnpm build
node --experimental-strip-types src/lib/http.check.ts
```

## Notes

- Stride's `/v1/comments/index` endpoint is down for this backend ("automation API not found"), so this plan
  is built from the ticket description + repo only. If there is discussion on the ticket, re-read it before merging.
- `src/pages/evaluate-gri-quantitative/DetailPage.vue` is also owned by **GROU-646 phase 1**. Land one, then the other.

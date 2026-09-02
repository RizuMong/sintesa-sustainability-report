# Phase 2 — Handle the now-rejecting mutations in the Evaluate GRI Quant detail page

**Goal.** With phase 1 in place the mutations reject; the page must not blow up with an unhandled rejection or
run Submit after a failed Update.

**Files owned**
- `src/pages/evaluate-gri-quantitative/DetailPage.vue`

**Depends on:** none (behaviour only matters once phase 1 lands, but the files do not overlap)

## Context

`src/pages/evaluate-gri-quantitative/DetailPage.vue:705` and `:727`:

```ts
async function save() {
  if (!detail.value) return
  await updateMutation.mutateAsync({ ... })
}

async function submit() {
  if (!detail.value || !canSubmitForm.value) return
  await save()
  await submitMutation.mutateAsync(detail.value.id)
}
```

Nothing catches. Today the interceptor resolves everything so this never throws; after phase 1 a validation
failure on Update rejects, `submit()` propagates it out of the `@click` handler as an unhandled rejection, and
worse — the intent is that Submit **must not** proceed when the preceding save failed.

The toast is already emitted by the interceptor, so these handlers must **not** toast again. They only need to
stop the flow.

## Steps

1. Make `save()` report success instead of throwing: wrap the `mutateAsync` in `try/catch`, return `true` on
   success and `false` on rejection. Do not toast in the catch — the interceptor owns user-facing messaging.
2. In `submit()`, bail when `save()` returns `false`, and wrap the `submitMutation.mutateAsync` in the same
   `try/catch` so a rejected Submit does not escape the click handler.
3. Do the same for `confirmDelete()` (`:733`) — same unhandled-rejection shape, and the confirm modal should
   stay open / not pretend success on failure.
4. Keep the `isSaving` / `isSubmitting` computeds as they are; Tanstack Query resets `isPending` on rejection.

## Acceptance

```
pnpm build
```

Manually, against a BE that rejects: click **Submit** with data the BE refuses — a red toast appears, the page
stays on the form, no `Uncaught (in promise)` in the console, and the submission's `flow_status` stays `draft`.

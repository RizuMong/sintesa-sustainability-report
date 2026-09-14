# Phase 2 — Make the confirm modal reusable

**Goal** — Let `ConfirmDeleteModal.vue` render a non-destructive confirm action, without changing
either existing call site.

**Files owned**
- `src/components/ConfirmDeleteModal.vue`

**Depends on** — none.

## Context

The component is 38 lines and already does exactly what GROU-659's confirmation step needs (modal,
overlay, close button, ghost Cancel + one confirm button). Only two things are hard-coded:

```vue
<MpButton variant="danger" @click="emit('confirm')">Delete</MpButton>
```

Two call sites exist and both must keep working untouched:
- `src/pages/evaluate-gri-quantitative/DetailPage.vue:497` — "Delete this submission?"
- `src/pages/master-key-indicator-quantitative/DetailPage.vue:945` — "Delete this indicator?"

So the new props are optional with the current values as defaults. Do not rename the component, do
not create a second near-identical modal component, and do not add a slot — two optional props is
the whole change.

`defineProps` here is the plain type-literal form (`defineProps<{ … }>()`); to give defaults, switch
to `withDefaults(defineProps<…>(), { … })`, which is the idiomatic Vue 3 script-setup pattern and
keeps the types.

## Steps

1. Extend the props type and wrap in `withDefaults`:

   ```ts
   const props = withDefaults(
     defineProps<{
       isOpen: boolean
       title: string
       message: string
       // GROU-659 — the same dialog confirms a non-destructive "Revise Submission"; defaults keep
       // every existing delete call site byte-identical.
       confirmLabel?: string
       confirmVariant?: string
     }>(),
     { confirmLabel: 'Delete', confirmVariant: 'danger' },
   )
   ```

   (`props` must be assigned, not discarded, or the template can still use the names directly —
   either is fine, but do not leave an unused-variable lint error.)

2. Bind them in the template:

   ```vue
   <MpButton :variant="confirmVariant" @click="emit('confirm')">{{ confirmLabel }}</MpButton>
   ```

## Acceptance

```
pnpm build
```

Plus: `git diff` on the two existing call sites is empty, and `pnpm dev` → MKI detail → Delete still
opens a modal whose confirm button reads "Delete" in danger red.

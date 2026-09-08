# GROU-651 · Phase 1 — Types + `toDisplayRows` + backward-compat checks

## Goal

Land the additive type changes and the one pure function every renderer will use to turn a
`rows[]` array into a grouped, unit-resolved display list.

## Files owned

- `src/services/master-key-indicator-quantitative/types.d.ts`
- `src/services/master-key-indicator-quantitative/sections.ts` (new)
- `src/services/master-key-indicator-quantitative/sections.check.ts` (new)
- `src/services/master-key-indicator-quantitative/index.ts` (add the `export * from './sections'` line)
- `src/services/evaluate-gri-quantitative/types.d.ts` (the mirrored optional fields only)

## Depends on

none.

## Context

Read `plan.md` §"Shared contract" — it is the spec for this phase, verbatim. Nothing here may be
invented beyond it; phases 2-4 are coding against exactly those signatures.

Existing shapes to extend, do not rewrite:
- `MkiQuantRow` / `MkiGriQuantitative` / `MkiGriQuantitativePayload` in
  `src/services/master-key-indicator-quantitative/types.d.ts`
- `EvaluateGriQuantitativeRow` / `EvaluateGriQuantitativeItem` in
  `src/services/evaluate-gri-quantitative/types.d.ts`

Both files carry a "verbatim from `api/…*.yml` — do not change field names" header. Honour it:
every field you add is **new and optional**, and gets a `ponytail:` comment saying the BE contract
does not have it yet (AC-6 is unconfirmed). Mirror the tone of the existing `ponytail:` notes on
`MkiGriQuantitative.status`.

Test style is repo-native: a plain `node:assert/strict` script with the run command in its header
comment, importing by **relative** path (no `@/` alias — see the header of
`src/services/evaluate-gri-quantitative/validation.ts` for why). Copy the structure of
`src/services/evaluate-gri-quantitative/requester-label.check.ts`.

`sections.ts` must be dependency-free (no vue, no imports) so the check script can run it directly.

## Steps

1. Add `MkiQuantUnitMode` and the optional `row_type` / `title` / `parent_sequence` / `unit` fields
   to `MkiQuantRow`; add optional `unit_mode` / `unit` to both `MkiGriQuantitative` and
   `MkiGriQuantitativePayload`.
2. Mirror the same optional fields onto `EvaluateGriQuantitativeRow` and
   `EvaluateGriQuantitativeItem` in the evaluate module's `types.d.ts`. Do not touch anything else
   in that file.
3. Write `sections.ts` exporting `QuantDisplayRow` and `toDisplayRows(rows, opts)` per the contract:
   sections in order each followed by their children, orphans last at depth 0, unit resolved by
   `unit_mode`. Order rows by `display_order` when present, falling back to array order — **never**
   sort by `sequence`, which no longer tracks visual order.
4. Export it from the module's `index.ts`.
5. Write `sections.check.ts` covering, at minimum:
   - **legacy passthrough**: a flat old-shape `rows` array with no new fields and no `opts` returns
     the same rows, same order, `kind: 'row'`, `depth: 0`, `unit: null`. This is AC-5's guard.
   - grouped: two sections with children come back interleaved section→children→section→children.
   - orphan row pointing at a `parent_sequence` that does not exist lands at the end, depth 0.
   - `UNIFORM` gives every row the table unit; `PER_ROW` gives each row its own; `NONE` gives null.
   - section rows never carry a unit.
   - **order is not sequence**: rows whose `display_order` disagrees with their `sequence` come back
     in `display_order` order (guards `plan.md` §Sequence handling gotcha 2).

## Acceptance

```
node --experimental-strip-types src/services/master-key-indicator-quantitative/sections.check.ts
pnpm build
```

Both clean. `pnpm build` must stay green **without** phases 2-4 existing — this phase is purely
additive and cannot break the current pages.

# GROU-651 — Section grouping & configurable Unit in the MKI Quantitative builder

Stride id `fU5RKnP9i1WNB` · status Backlog · enhancement · no subtasks, no comments

## Goal

The MKI GRI-Quantitative builder (`src/pages/master-key-indicator-quantitative/DetailPage.vue`)
today emits a flat `rows: {sequence, labels}[]` and one optional `unit` per **metric**. This ticket
adds (1) Section headers that group rows, (2) a table-level Unit mode — `Tidak ada` / `Seragam`
(one unit for the whole table) / `Per baris` (unit chosen per row) — and (3) makes Evaluate GRI
Quantitative render both, **without breaking any indicator or submitted value already stored in the
old flat shape**.

## Repo reality check (read before planning further)

- Builder rows: `DetailPage.vue:163-200` (row editor) and `:222-249` (Live Preview table).
  Row state is `form.rows: {labels}[]`, serialized at `:412` as `{sequence: i+1, labels}`.
- Unit today is per metric only: `MkiQuantMetric.unit: Ref2 | null`, editor at `:139-146`.
  Master Unit options come from `useGetMasterUnit()`.
- Evaluate side renders the same `rows`/`metrics` at
  `src/pages/evaluate-gri-quantitative/DetailPage.vue:157-190`, and serializes cells at `:766`
  via `toSubmissionValue(metric, row.sequence, value)` →
  `row_key = "row_<sequence>"` (`validation.ts:93`). **`row.sequence` is the storage identity of a
  saved cell.** Any renumbering of existing rows silently orphans submitted values — this is the
  single biggest hazard in this ticket.
- There is **no drag-and-drop library in the repo** (`grep draggable` → nothing). Reordering is
  implemented as move-up/move-down buttons, not HTML5 DnD, unless the user asks otherwise. Flagged.
- The `sequence`/`labels`/`unit` field names are verbatim from
  `api/Master Key Indicator/GRI - Quantitative/*.yml` — the contract has **no** section or per-row
  unit field yet. AC-6 of the ticket ("confirm with BE") is therefore a real blocker for
  persistence: the shape below is our proposal, marked `ponytail:` in code, and must be confirmed
  before this ships. Everything else can be built against it now.

## Shared contract (every phase depends on this)

Additive only. Old records deserialize unchanged because every new field is optional.

```ts
// src/services/master-key-indicator-quantitative/types.d.ts
type MkiQuantUnitMode = 'NONE' | 'UNIFORM' | 'PER_ROW'

interface MkiQuantRow {
  sequence: number                 // unchanged — storage identity, never renumber an existing row
  labels: Record<string, string>
  // NEW, all optional -> old payloads parse as a flat data row with no unit
  row_type?: 'SECTION' | 'ROW'     // absent === 'ROW'
  title?: string                   // SECTION only: the group header text
  parent_sequence?: number | null  // ROW only: sequence of the SECTION it sits under, null = top level
  unit?: Ref2 | null               // only meaningful when unit_mode === 'PER_ROW'
  display_order?: number           // visual position; sequence no longer tracks order (see below)
}

interface MkiGriQuantitative { /* ...unchanged... */
  unit_mode?: MkiQuantUnitMode     // absent === 'NONE' (old records keep metric-level unit only)
  unit?: Ref2 | null               // the table-wide unit when unit_mode === 'UNIFORM'
}
// MkiGriQuantitativePayload gains the same two optional fields.
```

Evaluate side mirrors it: `EvaluateGriQuantitativeRow` gains the same optional
`row_type`/`title`/`parent_sequence`/`unit`, and `EvaluateGriQuantitativeItem` gains optional
`unit_mode`/`unit`.

Derived-view helper all rendering goes through (phase 1 owns it):

```ts
// src/services/master-key-indicator-quantitative/sections.ts
type QuantDisplayRow =
  | { kind: 'section'; sequence: number; title: string; depth: 0 }
  | { kind: 'row'; sequence: number; labels: Record<string, string>; unit: Ref2 | null; depth: 0 | 1 }

function toDisplayRows(
  rows: MkiQuantRow[] | EvaluateGriQuantitativeRow[],
  opts: { unit_mode?: MkiQuantUnitMode; unit?: Ref2 | null },
): QuantDisplayRow[]
```

Contract of `toDisplayRows`: sections first in their own order, each followed by its child rows;
orphan rows (no `parent_sequence`, or pointing at a missing section) render at the end at depth 0.
`unit` resolves to the row's own unit under `PER_ROW`, the table unit under `UNIFORM`, `null` under
`NONE`/absent. **A flat legacy `rows` array must come back out in the identical order, depth 0,
unit `null`** — that property is what guarantees AC-5, and it gets its own assertion.

`row_key`/cell identity is unchanged: `row_<sequence>` for data rows. Section rows are never
serialized into `values[]`.

## Sequence handling (the load-bearing rule)

`sequence` currently does three jobs at once. Split them:

| Concept | Field | Mutable? |
|---|---|---|
| Storage identity — the `row_<n>` in a saved cell's `row_key` | `sequence` | **Never**, once allocated |
| Visual order | `display_order` (new) / array index | Freely |
| Grouping | `parent_sequence` | Freely |

```ts
const nextSeq = () => Math.max(0, ...form.rows.map(r => r.sequence)) + 1   // monotonic, never reuse
rows: form.rows.map((r, i) => ({ ...r, sequence: r.sequence, display_order: i + 1 }))
```

Gotchas, in descending order of damage:

1. **Never reuse a sequence.** `max+1`, not `length+1`. Delete row 3 of 4 then add one and
   `length+1` yields `4`, colliding with the surviving row. Worse, reusing a *deleted* row's
   number makes the new row inherit the dead row's submitted values via `fromSubmissionValues`.
   Silent, and it looks like data corruption to the user.
2. **Array order is not durable unless persisted.** If BE sorts `rows` by `sequence` on read,
   reordering evaporates on reload, because sequence no longer tracks order. Hence
   `display_order` — confirm it with BE alongside AC-6, or reordering appears to work and reverts.
3. **Sections and rows share one numbering space.** Independent counters make `parent_sequence`
   ambiguous.
4. **Deleting a section unparents its children** (`parent_sequence = null`), never renumbers or
   cascades, or every cell beneath it is orphaned.
5. **Orphaned values are harmless, reassigned ones are not.** `fromSubmissionValues` ignores
   unknown `row_key`s. Only gotcha 1 actually loses data.
6. **Verify first — this may all be moot.** `EvaluateGriQuantitativeItem` carries its own
   `columns`/`metrics`/`rows` with `parent_id` pointing back at the MKI, i.e. it looks like a
   snapshot taken at submission time. If snapshots are frozen, editing an indicator cannot
   retro-break existing submissions and AC-5 reduces to "render the old snapshot shape". If BE
   re-reads the live MKI instead, the rules above are load-bearing. **Ask BE this first.**

## API version note

`api/Master Key Indicator/GRI - Quantitative/` has a **`V2/`** folder (`/v2/mki/gri-quantitative/
create|update`) that is byte-identical to `V1/` except for the URL, with its `examples:` block
stripped. The app calls `/v1/` (`services/master-key-indicator-quantitative/api.ts`). That empty V2
is very likely BE's placeholder for this ticket — check whether the new fields are meant to land on
`/v2/` before assuming the endpoint stays `/v1/`.

## Phases

| # | Goal | Files owned | Depends on |
|---|------|-------------|------------|
| 1 | Types + `toDisplayRows` + backward-compat checks | `services/master-key-indicator-quantitative/types.d.ts`, `sections.ts`, `sections.check.ts`, `services/evaluate-gri-quantitative/types.d.ts` | none |
| 2 | Shared grouped table renderer component | `components/QuantSchemaTable.vue` | none (codes to the §contract) |
| 3 | Builder: Section editor + Unit-mode config + Live Preview | `pages/master-key-indicator-quantitative/DetailPage.vue` | 1, 2 |
| 4 | Evaluate: render groups/units, keep old submissions working | `pages/evaluate-gri-quantitative/DetailPage.vue` | 1, 2 |

Phases 1 and 2 are the dependency-free layer and should start together; 3 and 4 then run in
parallel and never touch the same file.

## Verification for the whole ticket

```
pnpm build                                                   # vue-tsc + vite, must be clean
node --experimental-strip-types src/services/master-key-indicator-quantitative/sections.check.ts
node --experimental-strip-types src/services/evaluate-gri-quantitative/api.check.ts   # must still pass
```

Manual: open an **existing** indicator in the builder and an **existing filled** submission in
Evaluate — both must look exactly as they do on `main` (AC-5). Then create a new indicator with a
section and `Per baris` units and confirm it renders grouped in Evaluate.

## Open questions to raise before merge

1. **BE schema (AC-6)** — is the nested structure `row_type`/`parent_sequence` on the existing flat
   `rows` array acceptable, or does BE want a truly nested `sections[]`? Our shape was chosen because it
   keeps `row_<sequence>` cell identity intact, which is what protects already-submitted data.
2. **Metric-level unit vs table-level unit** — the ticket adds a table Unit setting but does not say
   the per-metric unit goes away. Assumed: metric unit stays, table `unit_mode` wins when it is not
   `NONE`. Confirm with design.
3. **Reordering** — move-up/down buttons unless the user funds a DnD dependency.
4. **Are submission items frozen snapshots?** `EvaluateGriQuantitativeItem` carries its own
   `columns`/`metrics`/`rows`. If those are copied at submission time, editing an MKI cannot break
   existing submissions and most of the sequence risk disappears. **Ask this first — it sizes the
   whole ticket.**
5. **Does `display_order` exist, and does BE re-sort `rows` by `sequence` on read?** If it sorts
   and there is no `display_order`, reordering silently reverts on reload.
6. **Is `/v2/mki/gri-quantitative/*` the intended home for this change?** The contract folder
   already has an empty V2 (see above).

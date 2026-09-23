# SDG Dashboard Adjustments

No Stride code given. Scope: `src/pages/dashboard/SdgPage.vue` + `src/services/strategic-insight/` + `src/components/SummaryBox.vue` + the two SDG checks.

## Contract this is built on

`api/Dashboard/SDG.yml` as of **e1a3b38 "update res"** (pulled 2026-09-23). Relevant changes vs. what the
code was written against:

- `impact` query param now **declared and enabled** — `value: "Investment Impact"`, `description: "Operation Impact"`.
  Those two literal strings are the enum; there is no uppercase token form.
- The `Response Dummy` example is **deleted**. Only example `200` remains: 3 entities × 8 actions,
  `period: 2026` on every action, `execution_percentage` still row-level only.
- Observed value sets in that example: `adoption_status ∈ {TAKE, SKIP}`, `plan_origin ∈ {HOLDING}`,
  `impact ∈ {Investment Impact, Operation Impact}`, `summary` totals only on `sdg_roadmap` (9 / 17).

Grouped entity × SDG that example yields a **3 × 5 matrix** (SDG 1, 3, 9, 12, 19), with SDG 12 holding 4
actions per cell — so per-cell percentages are non-degenerate: Menara Duta × SDG 12 = 0/4 = 0%, × SDG 1 = 1/1 = 100%.

### Contract facts that constrain the design

| Fact | Consequence |
|---|---|
| `execution_percentage` is row-level (per entity), never per cell — gap B1 | Cell % is FE-derived from `actions[]`, per the confirmed rule below. Row `execution_percentage` is rendered once, in the row header. |
| `adoption_status` never carries `INITIATE` in any example; gap A1 still open | The yellow cell state is implemented but will not appear against this contract. Not a bug — do not "fix" it by re-deriving it from `plan_origin`. |
| `plan_origin` never carries `INITIATE` in example `200` either (every action is `HOLDING`) | The INITIATE stack of the Alignment Gap chart renders as zero-length bars against this contract. Same note — do not fabricate data to make it show. |
| Backend ignores `period`/`entity_id` server-side (verified live 2026-09-10, gap B2) | Existing client-side filter in `normalize-sdg.ts` stays. **`impact` is sent as a param only** (decided) — no client-side impact filter, so the Impact select may look inert until the backend honours it. Recorded as a known limitation, not a workaround. |
| Example data noise: sdg id `EwGok8Dh3xXQ` is `name:"SDG 10", number:19` in two entities and `name:"SDG 19", number:19` in the third | Group cells on `sdg_id.id` (consistent), label the column from the **first** `sdg_id.name` seen for that id. Assumption — flagged below. |

## Decisions (confirmed)

1. **Cell = colour + number.** Cell groups an entity's actions on `sdg_id`. Percentage = `TAKE count / actions in cell × 100`.
   Colour by derived cell status, precedence **INITIATE > TAKE > SKIP**: any INITIATE action ⇒ whole cell INITIATE (yellow);
   else any TAKE ⇒ TAKE (green); else SKIP (white). Anything left (e.g. `PENDING`) falls through to white.
2. **Columns = SDG**, from `actions[].sdg_id`.
3. **Matrix renders as an `MpTable` with token-coloured cells**, not a chart.js matrix chart. No new dependency, per-cell
   click is free, long SDG labels stay readable, and the acceptance check can assert on real DOM.
4. **Data source = the `200` example.** `fixtures/live-sdg.json` is regenerated from it, so the unit check stays
   self-contained (no `api/` symlink dependency) and `mock-api-server.ts` keeps reading the fixture.
5. **`DEMO_PAD` is deleted** — the whole padding block, the flag, `paddedActionsFor`, `mergeWithPadding`,
   `ROADMAP_SDGS`, `PAD_ENTITIES`, `PAD_PERIODS`, `seededRandom`, `pick`. It fabricates per-SDG rows with invented
   entities, which is actively wrong for an entity × SDG matrix, and the real example now carries 3 entities.
6. **Summary block format:** `total` present ⇒ `${value} / ${total}`; otherwise keep the current percent map
   (`execution_rate`, `strategic_alignment` ⇒ `${value}%`); else the bare value.
7. **`SummaryBox` gains opt-in props** `isFullWidth` + `description`, and its fixed `height: 89px` becomes
   `minHeight: 89px`. GRI Quantitative passes neither and is visually unchanged.
8. **`impact` is sent as a query param only.**
9. **The two existing charts are replaced, not kept.** "Strategic Action Matrix — Take Rate per SDG" (GROU-833) and
   "Aligned vs Initiated per SDG" both go away; the matrix table and the Alignment Gap stacked bar take their place.
10. **`plan_origin: SUBSIDIARY` is deprecated** — the backend now emits `INITIATE` for what used to be `SUBSIDIARY`.
    Drop `'SUBSIDIARY'` from the `plan_origin` union in `types.d.ts` and stop special-casing it anywhere. The
    `plan_origin` enum is `'HOLDING' | 'INITIATE'`, full stop.
11. **`padMatrixToAllSdgs()` and `SDG_CATALOG` are deleted.** The matrix is entity × SDG-present; forcing all 17
    goals would render 12 permanently-empty columns. GROU-833's AC-2 (all 17 goals on the axis) is retired with them.

## Assumptions (not confirmed — say so if wrong)

- **Column label** comes from the first `sdg_id.name` seen for a given `sdg_id.id` (see the data-noise row above).
- Both deleted symbols (`padMatrixToAllSdgs`, `SDG_CATALOG`) are exported from `index.ts` but consumed only by
  `SdgPage.vue` and `normalize-sdg.check.ts`, so nothing outside this module breaks.
- The Impact select sits in the existing filter bar as a third `MpSelect` (Reporting Period · Entity · Impact).

## Shared contracts (new canonical shapes)

`src/services/strategic-insight/types.d.ts`. The canonical (post-`normalizeSdg`) shape changes shape substantially;
the wire interfaces gain only `impact` on the filter params.

```ts
interface StrategicInsightFilterParams {
  period?: string
  entity_id?: string
  category?: string
  impact?: string // 'Investment Impact' | 'Operation Impact' — literal wire strings, not a token
}

// Passed straight through from wire `summary[]` — the page needs name/description/total, not four
// flattened numbers, so StrategicInsightSdgKpi is deleted.
interface StrategicInsightSdgSummary {
  key: string
  name: string
  description: string
  value: number
  total?: number
}

type SdgCellStatus = 'TAKE' | 'INITIATE' | 'SKIP' | 'NONE'

interface StrategicInsightSdgCell {
  sdg_id: string            // sdg_id.id — the column key
  status: SdgCellStatus     // INITIATE > TAKE > SKIP precedence
  take_percentage: number   // TAKE count / actions in cell, 0..100
  action_count: number
}

interface StrategicInsightSdgMatrixRow {   // one per entity, replaces the per-SDG row
  entity: Ref2
  entity_type: 'HOLDING' | 'SUBSIDIARY'
  execution_percentage: number             // row-level, straight from the wire
  holding_count: number                    // plan_origin === 'HOLDING'
  initiate_count: number                   // plan_origin === 'INITIATE'
  cells: StrategicInsightSdgCell[]
}

interface StrategicInsightSdgColumn {      // ordered column vocabulary for the matrix header
  sdg_id: string
  name: string                             // sdg_id.name, first seen wins
  number: number
}

interface StrategicInsightSdgDetailItem {
  id: string                 // action.ids
  entity_id: string          // for the alignment-gap drill-down
  sdg_id: string
  sdg_name: string           // sdg_id.name — the SDG column of the detail table
  key_business_action: string
  plan_origin: string
  adoption_status: string
}

interface StrategicInsightSdgResponse {
  summary: StrategicInsightSdgSummary[]
  columns: StrategicInsightSdgColumn[]
  matrix: StrategicInsightSdgMatrixRow[]
  detail: StrategicInsightSdgDetailItem[]
}
```

Drill-down selection state, local to `SdgPage.vue` — one ref serves both entry points so both render the
same table:

```ts
type SdgDetailSelection =
  | { kind: 'cell'; entityId: string; sdgId: string }
  | { kind: 'origin'; entityId: string; planOrigin: 'HOLDING' | 'INITIATE' }
  | null
```

## Phases

| # | Goal | Depends on |
|---|------|------------|
| 1 | Rewrite the data layer: new canonical shapes, entity × SDG derivation, `impact` param, `DEMO_PAD` deleted, fixture regenerated from example `200` | none |
| 2 | Summary blocks: `SummaryBox` opt-in props, full-width row, description, `value / total` | 1 (needs `summary[]`) |
| 3 | Strategic Action Matrix table with colour-coded clickable cells + the shared Action Plan Details table | 1 |
| 4 | Strategic Alignment Gap horizontal stacked bar with stack-click drill-down | 1, 3 (reuses the detail table) |
| 5 | Impact filter select + rewrite `scripts/sdg-acceptance.check.ts` for the new DOM | 2, 3, 4 |

Phases 2–4 are independent of each other once 1 lands, so they can go in parallel.

### Phase 1 — data layer

`src/services/strategic-insight/normalize-sdg.ts`, `types.d.ts`, `fixtures/live-sdg.json`, `index.ts`, `api.ts`.

- `normalizeSdg(wire, filters)`: keep `flattenActions` (entity + action + `action.period`) and the client-side
  `period`/`entity_id` filter. Replace everything downstream:
  - `columns`: distinct `sdg_id.id` across all actions, first `name` wins, sorted by `sdg_id.number`.
  - `matrix`: one row per wire matrix row (i.e. per `entity_id`), `cells` covering every column so the table is
    rectangular — a column an entity has no action for becomes `{ status: 'NONE', take_percentage: 0, action_count: 0 }`.
  - `detail`: one item per flattened action, carrying `entity_id`, `sdg_id`, `sdg_name`, `plan_origin`, `adoption_status`.
  - `summary`: wire `summary[]` passed through unchanged.
- Delete the whole `DEMO_PAD` block and `padMatrixToAllSdgs`/`SDG_CATALOG`; drop their re-exports from `api.ts`.
- `fixtures/live-sdg.json` ← the `data` object of example `200`, verbatim. Update the fixture's header comment in
  `mock-api-server.ts` (it currently explains why it does *not* use the committed example — that reason, the
  missing `sdg_id.number`, no longer holds; the reason is now only check self-containment).
- `StrategicInsightFilterParams.impact` added — shared with the GRI pages, which never set it, so no param leaks.

Check: rewrite `normalize-sdg.check.ts` against the new fixture. Must pin, at minimum:
cell status precedence (INITIATE beats TAKE beats SKIP); `take_percentage` = 0 for Menara Duta × SDG 12 and 100 for
Menara Duta × SDG 1; every row's `cells.length === columns.length`; `columns.length === 5`; the duplicate-name
SDG-19 column collapsing to exactly one column; `period`/`entity_id` client filters still narrowing.

### Phase 2 — summary blocks

`src/components/SummaryBox.vue`, `src/pages/dashboard/SdgPage.vue`.

- `SummaryBox`: add `isFullWidth: Boolean` (root `width: 100%` instead of `197px`) and `description: String`
  (rendered below the amount, `size="label-small" color="gray.600"`). Change base `height: 89px` → `minHeight: 89px`
  so the description cannot clip — this is the exact failure the component's own GRI comment records.
- Page: render `summary[]` with `v-for`, one `SummaryBox isFullWidth` per block inside a
  `display:flex; gap:2` row with each child `flex: 1; minWidth: 0`. Amount via a local `formatSummaryAmount()`:
  `total` present ⇒ `${value} / ${total}`, else `PERCENT_KEYS.has(key)` ⇒ `${value}%`, else `String(value)`.
  `PERCENT_KEYS = new Set(['execution_rate', 'strategic_alignment'])`.

### Phase 3 — matrix table + shared detail table

`src/pages/dashboard/SdgPage.vue`, new `src/components/SdgActionPlanDetail.vue`.

- Matrix: `MpTableContainer > MpTable`. Header = `Entity`, `Execution %`, then one column per
  `columns[]` (`SDG 12` etc.). Body = one row per `matrix[]` row; row header cell prints `entity.name` and
  `execution_percentage`; then one cell per `cells[]` entry showing `${take_percentage}%`, background from the
  status map, `cursor: pointer`, `@click` setting `{ kind: 'cell', entityId, sdgId }`.
- Colour map via `sva` variants or plain token lookup: `TAKE → green.50/green.700`, `INITIATE → orange.50/orange.700`
  (Pixel 3 has no `yellow` scale — verify with `get-component` before committing to `orange`), `SKIP`/`NONE` →
  `background.surface` with `gray.100` borders. Add a small legend row above the table, otherwise the colour coding
  is unreadable.
- `SdgActionPlanDetail.vue`: props `{ items: StrategicInsightSdgDetailItem[]; heading: string }`. Columns exactly
  `SDG` / `Action Plan Initiative` / `Origin` / `Adoption Status`, Origin and Adoption Status as `MpBadge`.
  Renders the existing "No action plan items" empty state when `items` is empty.
- Page computes `selectedDetail` from `selection` + `detail[]`: `kind: 'cell'` filters on `entity_id && sdg_id`;
  `kind: 'origin'` filters on `entity_id && plan_origin`.
- Delete the `Show detail for` `MpSelect`, `selectedSdgValue`, `selectedMatrixRow`, `decisionBadgeType` and the
  old 6-column detail table.

### Phase 4 — Strategic Alignment Gap

`src/components/DashboardChartCard.vue`, `src/pages/dashboard/SdgPage.vue`.

- `DashboardChartCard`: add kind `bar-stacked-horizontal` (`type: 'bar'`, both `isStacked` and `isHorizontal` true —
  the current `isStacked`/`isHorizontal` computeds are mutually exclusive and neither covers it), and an optional
  `onSegmentClick?: (datasetIndex: number, index: number) => void` prop. Wire it through MpChart's `options`:
  MpChart lodash-`merge`s `props.options` over its own config, so `options: { onClick }` reaches chart.js;
  resolve the segment with `chart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, true)`.
  MpChart's declared emits are only `show-tooltip`/`hide-tooltip`/`click-legend` — there is no per-bar emit, which
  is why this goes through `options`. Also set `cursor: pointer` on the canvas when a handler is passed.
- Page: `labels` = entity names, two datasets `Holding` / `Initiate` from `holding_count` / `initiate_count`.
  `onSegmentClick` maps `datasetIndex → planOrigin`, `index → matrix[index].entity.id`, sets
  `{ kind: 'origin', ... }`, and scrolls the detail table into view.
- Delete `takeRateData`, `alignedVsInitiatedData` and both old chart cards.

Check: `DashboardChartCard` has no check file today; the new kind is one boolean pair, covered by the
acceptance run rather than a new unit check.

### Phase 5 — Impact filter + acceptance check

`src/services/strategic-insight/composables.ts`, `src/pages/dashboard/SdgPage.vue`, `scripts/sdg-acceptance.check.ts`.

- `useStrategicInsightFilterState()`: `state.impact`, a hardcoded
  `IMPACT_OPTIONS = ['Investment Impact', 'Operation Impact']` (the contract sends no impact vocabulary endpoint;
  `Master SDG/` in `api/` has no impact list either), `params.impact = state.impact || undefined`, and
  `activeFilterLabel` extended. GRI pages don't render the select, so their params are unchanged.
- SDG page renders the third select.
- **`scripts/sdg-acceptance.check.ts` is already stale before this change** — it asserts the matrix is the *first*
  `<table>` and that its rows match `/^SDG \d+ — /`, which stopped being true when GROU-833 replaced the matrix
  table with a chart. Rewrite it wholesale rather than patching: 4 summary boxes each with a description and
  `sdg_roadmap` reading `9 / 17`; matrix table with 3 entity rows × 5 SDG columns; at least one green and one white
  cell (asserted on computed background, not class names); clicking a green cell reveals a detail table whose
  columns are the four required ones; the stacked-bar canvas painted with `spreadRatio > 0.6`; console clean of
  Vue warnings.

## Verification

```bash
node --experimental-strip-types src/services/strategic-insight/normalize-sdg.check.ts
```

```bash
pnpm build
```

```bash
bash scripts/run-sdg-acceptance.sh
```

`scripts/verify-api.ts` is GRI-only and unaffected; it is expected to keep failing for the reasons in CLAUDE.md.

## Docs to update

- `docs/dashboard-sdg-api-gaps.md`: record e1a3b38 (the `impact` param landing, `Response Dummy` deleted), mark B1
  resolved-by-FE-derivation with the confirmed precedence rule, note A1 still blocks the yellow INITIATE cell from
  ever appearing, and note that `impact` is sent unfiltered client-side so B2 now has a user-visible symptom.
- A new `docs/dashboard-sdg.md` "As Built" doc is **not** proposed — the gap doc plus the `ponytail:` comments cover
  it, and the mockup spec for this page lives in `plans/sdg-dashboard-demo/plan.md`.

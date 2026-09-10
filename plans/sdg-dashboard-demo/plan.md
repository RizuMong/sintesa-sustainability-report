# SDG Dashboard — render the live shape, fake only what is truly absent

Same treatment as `plans/gri-legacy-shape-adapter/plan.md`, applied to `GET /v1/strategic-insight/sdg`.
Goal is a **mockup demo that displays data**, so the bar is "every widget on the page shows
plausible numbers", not "the contract is clean". Fastest path wins; absent data gets patched with
clearly-labelled fake values rather than blocking on backend.

## Live probe, 2026-09-10 (this is new information — nothing had called this endpoint before)

`node --experimental-strip-types scripts/verify-api.ts --sdg` → HTTP 200, full
`{code,data,error,message}` envelope. Dump: `.temp/api-verify/sdg-probe/sdg.json`.

The endpoint works and is **ahead of the committed collection example** in two ways the gap doc
lists as blockers:

- `actions[].sdg_id` carries **`number`** (`{id, name:"SDG 12", number:12}`). Gap A3's
  "the number would have to be string-parsed out of `name`" is already solved.
- `plan_origin` has a **third value, `INITIATE`** (collection only ever showed `HOLDING`). Gap A1
  asked whether `INITIATED` exists — it does, on `plan_origin`, not on `adoption_status`, and it is
  spelled `INITIATE`. **Answer question 1 of the gap doc's open list with this.**

Confirmed still missing / unchanged:

- 1 matrix row only (`entity_type: HOLDING`, `Sintesa`, period 2026), 2 actions.
- No `sdgs[]` roadmap array → no `adopted` flag, no `short_name` (gaps A2/A3).
- All query params ignored: `period=2026`, `period=1999`, `entity_id=1`, `entity_id=zzzzzz`,
  `impact=OPERATION` each returned **byte-identical** payloads (1884 bytes). Gap B2 confirmed.

### The trap (do not miss this)

Both live actions share `sdg_id.id === 's6X9n1U8Bjl0'` while carrying **different** `name`/`number`
(`SDG 12` and `SDG 1`). Backend dummy data reuses one id across two SDGs. So **group the matrix on
`sdg_id.number`, never on `sdg_id.id`** — grouping on id collapses two distinct SDGs into one row
and the page silently shows half the data. Pin this with a check.

## Why `SdgPage.vue` currently renders nothing

`types.d.ts`'s SDG shapes are an invention that matches neither the contract nor the live payload:

| `SdgPage.vue` reads | Live payload has |
|---|---|
| `data.kpi.holding_sdg_roadmap` (object) | `summary[key=sdg_roadmap].value` (keyed array) |
| `data.matrix[].sdg.{id,number,name}` | `matrix[]` is **per entity**, SDGs live inside `actions[].sdg_id` |
| `data.matrix[].take_rate` / `aligned_count` / `initiated_count` | not sent at any level |
| `data.detail[]` (top-level) | `matrix[].actions[]` (nested) |
| `detail[].sdg_id` (string) | `actions[].sdg_id` (Ref2) |

Every KPI reads 0 and both tables hit their empty state. The page is not "partly wrong", it is
fully disconnected.

## Decision: one adapter module, mirroring `normalize.ts`

Add `src/services/strategic-insight/normalize-sdg.ts` exporting
`normalizeSdg(wire): StrategicInsightSdgResponse`. Same rationale as the GRI adapter: the page and
its computeds stay as written, one module owns the wire shape, and the fakery is quarantined in one
file with one deletion condition.

Do **not** redesign `SdgPage.vue` to the mockup's 10-column entity×SDG matrix. It currently renders
a per-SDG row table, that is enough to display the data, and rebuilding the matrix is the slow path.

### Derivations (real data, no fakery)

- `kpi` ← `summary[]` by key: `sdg_roadmap`→`holding_sdg_roadmap`,
  `strategic_alignment`→`strategic_alignment_rate`, `execution_rate`→`execution_rate_take`,
  `bottom_up_initiatives`→`bottom_up_initiatives`. Missing key → 0.
  Keep `sdg_roadmap.total` (17) and render the KPI as `9 / 17`, since the live payload sends it.
- `matrix[]` ← flatten `matrix[].actions[]`, group **on `sdg_id.number`**, one row per SDG:
  - `sdg` = `{id, number, name}` from the first action of the group;
  - `aligned_count` = actions with `plan_origin === 'HOLDING'`;
  - `initiated_count` = actions with `plan_origin === 'INITIATE'` (also accept `'SUBSIDIARY'`,
    which is what the collection's proposal used, so both spellings work);
  - `take_rate` = `TAKE / (TAKE + SKIP)` as a rounded percent over the group; no decided action in
    the group → fall back to the row's `execution_percentage`.
  - Sort ascending by `number`.
- `detail[]` ← flatten `matrix[].actions[]`, carrying the parent row's `entity_id` down as `entity`:
  - `id` = `ids` (note the live field is plural `ids`, a string);
  - `sdg_id` = `sdg_id.id`… **no** — the page filters `detail` by `selectedSdgId` and `matrix` keys
    on `sdg.id`, and ids are duplicated across SDGs (see the trap). Key both sides on
    `String(number)` instead: set `sdg.id = String(number)` in the matrix row and
    `detail[].sdg_id = String(action.sdg_id.number)`. Drill-down then selects correctly.
  - `key_business_action`, `action_indicator` ← `indicator_id`, `created_by_level` ←
    `plan_origin === 'HOLDING' ? 'Holding' : 'Subsidiary'`, `unverified` ←
    `plan_origin !== 'HOLDING'`, `decision` ← `adoption_status` mapped `TAKE`→`'Take'`,
    `SKIP`→`'Skip'`, anything else → `null`.
  - `skip_reason` is not sent by the backend at all → `null`.

### Fakery, where the backend genuinely has nothing

All of it behind one exported flag in `normalize-sdg.ts`, so the demo is honest and reversible:

```ts
// ponytail: mockup-demo padding. The live endpoint returns ONE holding row and TWO actions, and
// ignores every filter, so the matrix, the chart and the drill-down all render a single bar.
// Everything below is invented to make the page demonstrable. Delete this whole block, and the
// DEMO_PAD flag, the day the backend returns real multi-entity/multi-SDG data.
export const DEMO_PAD = true
```

Rules for the padding, in priority order (stop as soon as the page looks alive):

1. **SDG roadmap set.** Hardcode the mockup's 10 SDGs with `number`, `name`, `short_name` and
   `adopted` (adopted: 5, 7, 8, 12, 13, 16; non-adopted: 1, 3, 14, 15) — taken verbatim from
   `docs/dashboard-sdg-api-gaps.md`'s proposed `sdgs[]`. This closes A2/A3 for display purposes.
2. **Matrix rows.** Every real action keeps its real counts. SDGs in the roadmap set with no live
   action get a padded row with deterministic pseudo-random counts (seed off the SDG number, never
   `Math.random()`, or the numbers change on every refetch and the demo looks broken).
3. **Drill-down rows.** Give each padded SDG 2-3 fake actions cloned from the real action's text
   with the entity name varied across the mockup's subsidiaries (WS, SDS, MEPPO, SBG), so the
   Detail table has something to show for every row clicked.
4. **Filters.** Since the backend ignores them, apply `period` / `entity_id` **client-side** in
   the adapter over the padded set, so moving the selects visibly changes the page. That is the
   whole point of a demo. Note it in the same `ponytail:` block as fake filtering.

Real live data must always be preferred over padding for the same SDG. Padding is additive only,
never overwrites.

## Phases

Sequential; commit each. Checks are `*.check.ts` run with `node --experimental-strip-types <file>`.

### Phase 1 — wire types + adapter, real derivations only (`DEMO_PAD = false` path)

- `types.d.ts`: add `StrategicInsightSdgWire*` (`{summary[], matrix[]}`, `matrix[].actions[]`,
  `sdg_id: Ref2 & {number: number}`, `plan_origin: 'HOLDING' | 'INITIATE' | 'SUBSIDIARY'`).
  Leave the existing canonical `StrategicInsightSdg*` types alone — the page consumes them.
- `normalize-sdg.ts` with the derivations above.
- Commit a redacted fixture `src/services/strategic-insight/fixtures/live-sdg.json` generated from
  `.temp/api-verify/sdg-probe/sdg.json`.
- `normalize-sdg.check.ts` against that fixture: 4 KPIs non-zero, **2** matrix rows (proves the
  duplicate-`sdg_id.id` trap is handled — grouping on id would give 1), SDG 1 and SDG 12 both
  present, `initiated_count` picks up `INITIATE`, drill-down filter by `sdg_id` returns the right
  action for each row. Add a mutation test for the group-by key: switch it to `sdg_id.id` and
  assert the check fails.

### Phase 2 — wire it in, see it render

- `api.ts`: `getSdgInsight` unwraps the wire type and returns `normalizeSdg(...)`.
- `mock-api-server.ts`: serve `Dashboard/SDG.yml`'s `Response Dummy` at
  `/v1/strategic-insight/sdg` (currently 404s, so the acceptance run never touches SDG).
- Confirm visually. `bash scripts/run-dashboard-acceptance.sh` covers GRI only; for SDG take a
  screenshot via the existing `scripts/screenshot-dashboard.sh` pattern (or extend it) at
  `/dashboard/sdg`, and confirm KPIs are non-zero and the chart painted.

### Phase 3 — demo padding

- Implement `DEMO_PAD` per the rules above, default **on** (this is a mockup).
- `normalize-sdg.check.ts` gains: with padding on, ≥10 matrix rows, every row has ≥1 detail action,
  real SDG 1/12 counts are unchanged from the `DEMO_PAD = false` run (padding must not overwrite
  real data), and two calls with the same input produce identical output (determinism — no
  `Math.random()`).
- Client-side filtering: assert changing `period` changes the result, since the backend cannot.

### Phase 4 — docs

- `docs/dashboard-sdg-api-gaps.md`: add a "Live-backend status — verified 2026-09-10" section.
  Record that the endpoint is live, that `sdg_id.number` already exists (A3 partly resolved), that
  `plan_origin: INITIATE` answers open question 1, that all params are ignored (B2 confirmed), and
  that the duplicate `sdg_id.id` in dummy data is a data-quality bug worth reporting to BE.
  Mark A2/A3's `short_name`/`adopted` as FE-faked for the demo, pointing at `normalize-sdg.ts`.
- `CLAUDE.md`: mention `normalize-sdg.ts` and the `DEMO_PAD` flag next to the GRI adapter, so the
  next reader knows which numbers on that page are real.
- `verify-api.ts`: make `--sdg` more than a raw dump — at minimum assert the envelope shape and
  report the ignored-filter finding, mirroring the GRI filter-scope probe.

## Constraints

- pnpm only, no new dependencies.
- Never weaken a `*.check.ts` to pass.
- All fake data must be deterministic and behind `DEMO_PAD`, in one file, with one `ponytail:`
  block stating the deletion condition. A reviewer must be able to find every invented number in
  under a minute.
- Do not rebuild `SdgPage.vue`'s table into the mockup's entity×SDG matrix. Out of scope.

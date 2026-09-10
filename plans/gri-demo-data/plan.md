# GRI Quantitative dashboard — make it demo-complete with fixture data

## Scope change

This dashboard is a **mock-up**. Goal is a page that shows every widget populated, using the
components already built. Backend fidelity is explicitly not the goal. Anything the backend does
not supply gets patched with fake data.

Supersedes the backend-contract framing of `plans/gri-legacy-shape-adapter/plan.md`. Phase 1 of
that plan (`normalize.ts`, commit d2fb625) is already committed and is **kept** — it is the
boundary adapter and still the right place for the wire→canonical mapping. Phases 2-5 of it are
dropped.

## What already exists (do not rebuild)

- `api/Dashboard/GRI - Quantitative.yml` example `Response Dummy`: **all 8 categories**, with
  `dimensions[]`, `labels{}`, `metric_key`, `aggregation`, and 32 summary keys. Canonical shape.
- `scripts/mock-api-server.ts` already replays that example, and
  `bash scripts/run-dashboard-acceptance.sh` already drives all 8 tabs in a real browser.
- `chart-spec.ts` already builds 27 cards across 18 dimensions.
- `normalize.ts` (committed) maps the live wire shape to canonical.

## The only real gap for a demo

`Response Dummy` carries **1 entity (WS) and 1 period (2025)**, ~2 items per category. So:

- every trend/line chart plots a single point;
- the PT-comparison chart is suppressed (`entities.length > 1` guard in `chart-spec.ts`);
- `card()` drops any card whose datasets are all-zero, so sparsely-populated dimension members
  vanish;
- the Period and Entity filters have nothing to select between.

Fix = more fixture rows, same shape. No new components, no type changes, no backend asks.

## Implementation

### Step 1 — `src/services/strategic-insight/demo-data.ts`

Exports `demoGriQuantitative(): StrategicInsightGriCategory[]`.

- Import the 8-category canonical structure. Do **not** hand-retype it: read the shape from the
  contract example. But the browser cannot shell out to python3, so commit it as a JSON fixture:
  `src/services/strategic-insight/fixtures/gri-quantitative-demo.json`, generated once from
  `api/Dashboard/GRI - Quantitative.yml`'s `Response Dummy` by a small
  `scripts/generate-demo-fixture.ts` (committed, re-runnable, documented in its header).
- Expand it: for each category, replace `items[]` with the cross-product of
  **15 entities × 3 periods (2023/2024/2025) × the example's existing item templates**, preserving
  each template's `gri_code`, `metric_key`, `metric_name`, `labels`, `input_type`, `aggregation`
  and `unit`.
- Entities: the 15 PTs the mockup lists — WS, SDS, MEPPO, SBG, SGE, TES, MPRD, MD, TA, TRS, MPH,
  SPP, SPM, GSME, PMB. Give each a stable fake id (`demo-ent-<code>`) and a plausible name.
- Values: **deterministic**, never `Math.random()` — a seeded hash of
  `entity.code + period + gri_code + JSON.stringify(labels)`. A demo that renders different numbers
  on every refresh is worse than one with fixed numbers, and it makes the acceptance run flaky.
  Scale each value off the template's own value (roughly ±35%, with a mild upward year-on-year
  trend so the line charts slope) so units stay believable (GJ stays GJ-sized).
- `AVERAGE`/`PERCENTAGE` items must stay inside their natural range — a salary ratio jitters around
  0.9-1.0, a percentage stays 0-100. Do not scale these like absolute totals.
- `summary[]`: keep the example's keys and names, but recompute `value` from the expanded items
  where a matching aggregation exists; otherwise scale the example's value by the entity/period
  count so the KPI cards agree in magnitude with the charts. A KPI card reading 8,614 above a chart
  totalling 400,000 is the kind of thing a demo audience notices immediately.
- `TEXT`/`DATE`/`BOOLEAN` items: keep one per entity/period, no jitter.

### Step 2 — serve it

Two consumers, one source:

- `src/services/strategic-insight/api.ts` — in `getGriQuantitativeInsight`, after
  `normalizeGriQuantitative(...)`, fall back to `demoGriQuantitative()` when the live payload is
  too thin to demo (fewer than 8 categories, or fewer than 2 periods, or fewer than 2 entities).
  Gate on a single exported const `USE_DEMO_GRI_DATA = true` with a `ponytail:` comment naming the
  condition to flip it to `false`. Also fall back when the request **fails**, so an expired token
  still shows a populated dashboard in a demo. Log through `src/lib/logger.ts` (dev-only) whenever
  the fallback engages, so nobody debugs fake numbers thinking they are real.
- `scripts/mock-api-server.ts` — serve the same expanded fixture instead of the raw example, so the
  acceptance run exercises the populated page.

### Step 3 — make the filters do something

The backend ignores `period`/`entity_id`/`category_id`. In demo mode, filter client-side in
`GriQuantitativePage.vue` (or a small helper in `demo-data.ts`) so the two dropdowns visibly change
the page:

- `period` narrows `summary[]` recomputation and the non-trend charts;
- keep `items[]` unfiltered for trend and PT-comparison charts, per the A4 rule already documented
  and already assumed by `aggregate.ts`/`chart-spec.ts`.
- Populate the Entity dropdown from the demo entities when the live entity master is thin (it
  returns 7 rows with duplicate codes).

### Step 4 — verify it actually renders

- `demo-data.check.ts`: 8 categories; every category has ≥2 periods and ≥2 entities; **every card
  `chartCardsFor()` returns for every tab is non-null and has at least one non-zero dataset** (this
  is the actual acceptance condition — it is what "nothing is empty" means); `summaryValue()`
  resolves every expected KPI key; two calls produce identical values (determinism).
- `bash scripts/run-dashboard-acceptance.sh` must pass with the expanded fixture, including the
  PT-comparison chart now appearing (it was previously suppressed) — update the expected chart
  titles per tab in the acceptance script if that guard changes any tab's card count.
- `pnpm build` clean.
- Then look at the page: `pnpm dev` and `bash scripts/screenshot-dashboard.sh` (or the existing
  screenshot script) for all 8 tabs, and confirm by eye that no tab has an empty region, no chart
  is a single point, and no KPI card shows an em-dash placeholder. Attach/describe what you saw.

## Constraints

- pnpm only, no new dependencies.
- Do not weaken any existing `*.check.ts`. `contract.check.ts` and `gri-contract-diff.check.ts`
  must stay green — they describe the contract, which is unchanged.
- `scripts/verify-api.ts` is a live-backend probe and is **out of scope**. Leave it failing; it is
  measuring a different thing. Do not point it at demo data.
- Every fake-data site carries a `ponytail:` comment saying it is fixture data for the mock-up and
  what removes it.
- No `Math.random()` anywhere in the fixture path.
- Commit in the two or three natural steps, explaining why in the repo's existing commit style.

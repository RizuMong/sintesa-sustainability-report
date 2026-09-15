# Dashboard types vs live backend data — alignment plan

Status: **plan only, nothing implemented.** Written 2026-09-15 against the live dev backend
(`.temp/api-verify/2026-09-15T10-22-20-958Z/`), reproduce with:

```sh
node --experimental-strip-types scripts/verify-api.ts --sdg --verbose
```

## Premise

BE has switched both dashboard endpoints from dummy fixtures to **live data**. The response
*envelope* shapes did not change — the two field-level changes from earlier today (`category`
filter param, SDG `period` moved onto actions) are already applied. What changed is the **content**,
and the content invalidates assumptions baked into our types and our normalize layer.

The headline: **the FE's entire dimension/label model has no source in live data.** Our types
describe a mockup that the real data does not resemble.

---

## Finding 1 — GRI Quantitative: charts render ZERO cards from live data

Measured, not inferred:

```
Energy                        caption=""   cards=0
Waste                         caption=""   cards=0
Water                         caption=""   cards=0
Diversity & Equal Opportunity caption=""   cards=0
Employment                    caption=""   cards=0
OHS                           caption=""   cards=0
Training & Education          caption=""   cards=0
General                       caption="Total karyawan…" cards=0
```

`normalizeGriQuantitative()` emits **30 warnings**, all the same class:

> item `rvicLwOC8l7O`: description 'Total timbulan dan pengelolaan limbah operasional…' matched no
> declared vocabulary member (category WASTE)

### Root cause

`normalize.ts` derives `labels{}`/`dimensions[]` by matching `items[].description` against a
hardcoded `DIMENSION_VOCABULARY` of mockup member names ("Laki-laki", "Non-Renewable", "Tetap"…).

In live data `description` is **not a dimension member label at all** — it is the GRI disclosure's
long prose description, identical for every item in a category:

| Category | distinct `description` values | what it actually contains |
|---|---|---|
| WASTE | **1** | "Total timbulan dan pengelolaan limbah operasional perusahaan berdasarkan jenis dan metode pengolahannya." |
| WATER | **1** | "Total pengambilan air berdasarkan sumber (air tanah, PDAM, air permukaan)." |
| GENERAL | **2** | "report the total number of employees, and a breakdown of this total by gender and by region" |

So: zero vocabulary matches → every `labels` is `{}` → `dimensions[]` is empty → every chart
builder finds no members → zero cards. `dims=0` on all 8 categories confirms it.

### What live data actually discriminates on

`metric_name` is the real series key, and it is *per GRI code*:

```
WASTE   (GRI-306-3, 'Target')             -> [10, 100, 10, 10]
WASTE   (GRI-306-3, 'Actual Generated')   -> [10, 10, 10, 120]
WATER   (GRI-001,   'Actual Consumption') -> [5, 120, 10, 10]
WATER   (GRI-001,   'Target')             -> [5, 10, 100, 100]
GENERAL (2-8a,      'Turnover Rate')      -> [20, 12, 32, 12, 43]
GENERAL (2-8a,      'New Hire Count')     -> [100, 32, 32, 12, 12]
GENERAL (271-a,     '2025')               -> [100, 200]     // note: a YEAR as a metric name
GENERAL (271-a,     '2026')               -> [290, 130]
```

The live vocabulary is `Target` / `Actual Generated` / `Actual Consumption` / `Turnover Rate` /
`New Hire Count` — a **target-vs-actual** model, not the mockup's gender/age/fuel-type breakdowns.
There is no gender dimension, no age band, no fuel type, no renewability, anywhere in live data.

### Also changed

- `gri_code` is now prefixed and inconsistent: `GRI-306-3`, `GRI-001`, `271-a`, `2-8a`. Our
  `trimGriCode()` strips trailing letters to get a tab root, producing `"271-"` and `"GRI-306-3"`,
  neither of which `resolveTab()` matches → `categoryCaption()` returns `""` for 7 of 8 tabs.
- `entity` no longer carries `code` (live sends `{id, name}` only), but
  `StrategicInsightGriItem['entity']` is typed `Ref2 & { code: string }` and `chart-spec.ts` renders
  `entities.map(e => e.code)` as the PT-comparison axis → `undefined` labels.
- Live has **1 entity** (`Sintesa`) and 2 periods, so `demoFallbackReason()` returns
  `"only 1 entity(ies)"` → **the page silently shows demo fixture data instead of the live data.**
- `category` is now sometimes multi-word: `"DIVERSITY & EQUAL OPPORTUNITY"`,
  `"TRAINING & EDUCATION"`. `CATEGORY_SLUGS` keys on `DIVERSITY`/`TRAINING`, so both miss the table
  and fall through to `{ id: "DIVERSITY & EQUAL OPPORTUNITY", name: … }` — an id that is a
  display string. Cosmetically fine today, wrong as an id.

### What still holds

- `summary[]` is exactly reproducible from `items[]` (verified: all 8 keys, SUM and AVERAGE, match
  to the cent). `summary[].key === slug(metric_name)` for every category.
- `aggregation` is present on `summary[]` and **live sends `AVERAGE` correctly** (`turnover_rate`
  → 23.8, a true mean, not a sum). The `AVERAGE_METRIC_KEYS` allow-list in `normalize.ts` was
  built for mockup metric names and matches none of the live ones, so the per-item `aggregation`
  we derive is now wrong for `turnover_rate` — but the BE-sent summary is right.

---

## Finding 2 — SDG: live data is real, and DEMO_PAD now corrupts it

Live SDG returns **3 entities** (1 HOLDING + 2 SUBSIDIARY), 24 actions, 5 distinct SDGs — a real
payload, unlike the single-row dummy it used to send.

Consequences:

- **`DEMO_PAD = true` fabricates 19 of the 43 drill-down rows** (measured). It was written when
  live returned 2 actions; now it is injecting fake entities (`Widjajatunggal Sejahtera (WS)`,
  `Sintesa Duta Sejahtera (SDS)`…) and fake Take/Skip decisions **alongside real ones**, with no
  visual distinction. This is now a correctness problem, not a demo aid.
- **The duplicate-`sdg_id.id` trap is gone.** Live ids are 1:1 with SDG numbers (verified both
  directions). The `groupByNumber()` workaround and its mutation test still work, but the comment
  calling it a live-data trap is now stale.
- `plan_origin` is `HOLDING` for **all 24 actions** — `SUBSIDIARY`/`INITIATE` never appear, so
  `bottom_up_initiatives` is 0 and `initiated_count` is 0 on every real row. Every non-zero
  `init=` in the current render comes from padding.
- `adoption_status` observed `TAKE` and `PENDING`. `SKIP` never appears. Our `TakeSkipDecision`
  maps `PENDING` → `null`, which is right, but A1 in the gaps doc asked for `INITIATED` and the
  real third state is `PENDING`.
- **BE data bug**: `sdg_id: { name: "SDG 10", number: 19 }`. `number` is 19 for SDG 10. Since
  `normalize-sdg.ts` groups on `number`, this renders a phantom "SDG 19" row labelled "SDG 10".

---

## Finding 3 — master endpoints return 403

`/v1/master-entity/index`, `/v1/master-period/index`, `/v1/master-category/index` all return
**HTTP 403 ERR_UNAUTHORIZED** for the harness's service account. The filter dropdowns and the
`category_id` resolution both depend on these. Unclear whether this is account-scoped or global.

---

## Proposed work

Ordered by "page is wrong on screen" first. Each step is independently shippable.

### Step 1 — Type definitions follow live wire (the literal ask)

`src/services/strategic-insight/types.d.ts`:

- `StrategicInsightGriWireItem.entity`: `Ref2 & { code: string }` → `Ref2` (live has no `code`).
- Add `StrategicInsightGriWireSummary.aggregation` is already correct; document that `AVERAGE` is
  live-observed, not theoretical.
- `StrategicInsightGriItem.entity`: drop the required `code`, or make it `code?: string`, and fix
  `aggregate.ts:104` + `chart-spec.ts:192` which read `.code` unconditionally.
- Annotate `description` as "GRI disclosure prose, NOT a dimension member label" — the single most
  load-bearing wrong assumption in the file.
- Widen `adoption_status` to include `PENDING` (done today) and drop the stale "duplicate id trap"
  comment on `sdg_id`.

### Step 2 — Decide the charting model (needs your input, see questions)

The dimension/label model cannot be derived from live data. Two options:

- **(a) Re-key charts on `metric_name` per `gri_code`.** Matches live data exactly. Means
  rewriting `chart-spec.ts`'s 8 hand-built tab layouts into one generic
  "series per metric, x-axis = period, one card per gri_code" renderer. Loses the mockup's designed
  layouts, but renders real numbers today.
- **(b) Keep the mockup layouts and wait for BE to send `dimensions[]`/`labels{}`.** Page keeps
  showing demo data until then. Zero FE work now, indefinite wait.

I recommend **(a)**, with the generic renderer replacing `genericCards()` as the default and the
8 bespoke builders kept behind the `gri_codes` resolver for when/if real dimensional data arrives.

### Step 3 — Turn DEMO_PAD off for SDG

Live SDG data is real and multi-entity. Padding now injects fabricated rows into a real dataset.
Flip `DEMO_PAD = false`, delete the padding block and `ROADMAP_SDGS`/`PAD_ENTITIES`/`PAD_PERIODS`,
and update `normalize-sdg.check.ts`'s Phase 3 to assert the real payload instead. `sdgName()`
currently sources UN goal titles from `ROADMAP_SDGS`, so keep that one table (it is real reference
data, not fabrication) or accept the bare `"SDG 9"` labels live sends.

### Step 4 — Fix `gri_code` / `category` parsing against live values

- `trimGriCode()`: handle the `GRI-` prefix and the `271-a` form so `resolveTab()` can match.
- `CATEGORY_SLUGS`: key on the live strings (`DIVERSITY & EQUAL OPPORTUNITY`,
  `TRAINING & EDUCATION`) or normalize before lookup.

### Step 5 — Revisit the demo fallback

`demoFallbackReason()` swaps in fixture data whenever live has <2 entities. Live has exactly 1, so
**the dashboard is showing fake numbers right now even though real ones arrived.** Either relax the
rule, or make the demo state visually unmistakable on screen rather than a console warning.

### Step 6 — Report back to BE

- `sdg_id.number` is 19 for "SDG 10".
- `items[].entity` lost its `code`; the PT-comparison chart needs it.
- 5 of 8 GRI categories return zero items — is that real (no data entered) or a query bug?
- Master endpoints 403.

---

## Questions for you

1. **Charting model — (a) or (b)?** This is the big one. Rewriting `chart-spec.ts` to the live
   target-vs-actual model is real work, and it throws away layouts that were built and browser-
   verified against the mockup. Is the mockup still the design target, or has the product moved to
   the target-vs-actual model the live data implies?
2. **Is the mockup's dimensional data (gender/age/fuel/renewability) ever coming?** If BE plans to
   ship `dimensions[]`/`labels{}`, option (b) is cheap and correct. If not, the vocabulary block in
   `normalize.ts` (~180 lines) is dead code to delete.
3. **Should the dashboards show real-but-sparse data, or keep the demo fixture?** With 1 entity and
   5 empty categories, live data renders a fairly bare page. Is there a demo/review deadline that
   still needs the fixture, or do we cut over to real data now?
4. **Is the 403 on master endpoints expected** for this service account, or a real permissions bug
   worth raising?
5. **SDG `plan_origin` is always `HOLDING`** — is subsidiary-originated data coming, or should the
   Bottom-Up Initiatives KPI and the Alignment Gap chart be hidden rather than always showing 0?

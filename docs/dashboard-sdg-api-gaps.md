# Dashboard · SDG — Contract Gaps & Proposal

Scope: `GET /v1/strategic-insight/sdg`, consumed by `src/pages/dashboard/SdgPage.vue` via
`src/services/strategic-insight/`.

Two sources of truth compared here:

- **Contract**: `api/Dashboard/SDG.yml` — ships a single `Response Dummy` example, the BE-authored
  one, carrying the full `{code, error, message, data}` envelope (this supersedes the "no example
  response" claim in `docs/sustainability-reporting-portal-open-gaps.md` G2 for the SDG endpoint).
- **Mockup**: <https://melodic-donut-a45fa9.netlify.app/> — single-file HTML, all fixture data
  inline in its `<script>` block (`baselineData`, `detailedActionPlans`, the `.matrix` table markup).

The contract was clearly authored from this mockup: `summary[].description` matches the KPI
subtitles verbatim ("Actions mapped to Holding SDGs", "Overall 'Take' ratio on mandates").

**`src/services/strategic-insight/types.d.ts` matches neither.** It is an independent invention
(`kpi` object, `matrix[].sdg`, top-level `detail[]`). Rewriting it is a prerequisite to any of this
— tracked as G2, not repeated here.

---

## What the contract already covers

| Mockup widget | Contract source | Notes |
|---|---|---|
| KPI · Holding SDG Roadmap `9 / 17` | `summary[key=sdg_roadmap]` `{value, total}` | exact |
| KPI · Strategic Alignment `82%` | `summary[key=strategic_alignment].value` | exact |
| KPI · Avg. Execution Rate `74%` | `summary[key=execution_rate].value` | exact |
| KPI · Bottom-Up Initiatives `28` | `summary[key=bottom_up_initiatives].value` | exact |
| Matrix · "Total Execution" column | `matrix[].execution_percentage` | exact |
| Matrix · row label | `matrix[].entity_id.name` | exact |
| Drill-down · SDG column | `actions[].sdg_id.name` | exact |
| Drill-down · Initiative column | `actions[].key_business_action` | exact |
| Drill-down · Origin badge | `actions[].plan_origin` | `HOLDING` → "Holding Mandate", else "Local Innovation" |
| Drill-down · Status badge | `actions[].adoption_status` | partial — see A1 |
| Alignment Gap chart (aligned vs bottom-up) | count `actions[].plan_origin` | derived, not sent — acceptable |
| Impact Focus filter | `actions[].impact` | derived, not sent — acceptable |

The drill-down panel is fully served today. The KPI row is fully served for the unfiltered case.

---

## Gaps

Severity: **A** = blocks the mockup, backend change required. **B** = FE can absorb, needs a written
guarantee. **C** = out of scope of this endpoint.

### A1 · `adoption_status` has no `INITIATED` — blocks

The mockup has three states, not two: `Take` / `Skip` / **`Initiated`** (amber `sparkles` badge in
the drill-down, amber `New` cell in the matrix). Every bottom-up row in `detailedActionPlans` uses
it. The string `INITIATED` appears nowhere in the collection — `grep -rn "INITIATED" api/` is empty;
the example only ever shows `"TAKE"`.

Inferring it FE-side (`plan_origin === 'SUBSIDIARY' && adoption_status == null`) conflates "a
subsidiary proposed this and nobody has decided" with "a subsidiary proposed this and Holding
skipped it" — the second is a real state the mockup renders differently. Needs the enum value.

### A2 · Nothing says which SDGs are on the Holding roadmap — blocks

The matrix header splits its 10 SDG columns into two column groups: **"Holding Adopted SDGs (Core
Roadmap)"** (SDG-5, 7, 8, 12, 13, 16) and **"Non-Adopted SDGs (Bottom-Up)"** (SDG-1, 3, 14, 15).
The response carries no adopted flag and no roadmap list.

The only inference available is "collect `actions[].sdg_id` from the row where
`entity_type === 'HOLDING'`" — which requires that row to always be present, requires its `actions[]`
to be complete, and silently produces the wrong column split if a Holding SDG happens to have no
action plans yet.

Also unresolved: the KPI says **9** adopted, the matrix shows **6** core columns. The mockup
contradicts itself. Whichever is right, the FE cannot tell without the list.

### A3 · No SDG dimension — number, short label, column order — blocks

Columns render as `SDG-5` over a caption `Gender Eq.`, in a fixed order. The contract gives only
`sdg_id: {id, name: "SDG 12"}`.

- The number would have to be string-parsed out of `name`.
- The short caption ("Gender Eq.", "Clean Energy", "Resp. Cons.") has **no source anywhere in the
  collection** — `grep -rli sdg api/` returns `api/Dashboard/SDG.yml` and nothing else. There is no
  SDG master endpoint.
- Column order is currently a hardcoded array in the mockup's HTML.

### B1 · Per-cell take rate is not sent

Each matrix cell is a per-entity-per-SDG percentage (`MDD × SDG-12 → 75%`). The contract sends
`adoption_take_count` / `adoption_skip_count` at **row** level (per entity), not per cell.

FE can compute cells by grouping `actions[]` on `sdg_id.id` and counting `adoption_status` — cheap,
and it makes the two row-level counts redundant. This is the recommended resolution, but it is only
correct if `actions[]` is the complete unpaginated set for that entity+filter. Needs that stated.

### B2 · Query parameters are undeclared

`SDG.yml` declares no params. The FE currently sends `?period=&entity_id=`, and the mockup adds a
third filter (Impact Focus). Whether the backend honours them is unknown.

This is not cosmetic: **`sdg_roadmap` and `strategic_alignment` cannot be recomputed FE-side under a
filter.** `strategic_alignment` needs a total-actions denominator that spans entities outside the
current selection. The mockup dodges this entirely — it fakes filtered KPIs with hardcoded
multipliers (`periodMultiplier = 0.8`, `impactFactors`). So either the backend filters and
recomputes `summary[]`, or those two KPIs are wrong whenever a filter is active.

### B3 · Matrix row coverage is unstated

The example returns exactly one row, `entity_type: "HOLDING"`. The mockup's matrix rows are four
subsidiaries, no holding row. Does the payload contain both? If A2 is resolved by inference, it
must; if A2 is resolved properly, it need not.

### C1 · Export has no endpoint

The mockup header has an **Export** button. Nothing in `api/` serves it. Out of scope for
`/strategic-insight/sdg`; route it to the `data-export` module or drop the button.

---

## Proposed contract

Additive. Keeps every field the current example already has, so the drill-down and KPI work needs no
rewrite. Three additions (`sdgs[]`, the `INITIATED` enum value, declared params) close A1–A3 and B2.

```yaml
GET {{base_url}}/v1/strategic-insight/sdg
  ?period=2026          # optional; omitted = all periods
  &entity_id=Ks6Bg...   # optional; omitted = all entities
  &impact=OPERATION     # optional; OPERATION | INVESTMENT; omitted = all
```

Filters are applied **server-side**, and `summary[]` is recomputed under them (B2).

```jsonc
{
  "code": 200,
  "error": false,
  "message": "Success get data SDG",
  "data": {
    // NEW (A2, A3) — the SDG dimension. Drives matrix column order, labels, and the
    // Adopted / Non-Adopted column-group split. Ordered; FE renders as given.
    "sdgs": [
      { "id": "s6X9n1U8Bjl0", "number": 5,  "name": "Gender Equality",
        "short_name": "Gender Eq.", "adopted": true },
      { "id": "a1B2c3D4e5F6", "number": 7,  "name": "Affordable and Clean Energy",
        "short_name": "Clean Energy", "adopted": true },
      { "id": "g7H8i9J0k1L2", "number": 1,  "name": "No Poverty",
        "short_name": "No Poverty", "adopted": false }
      // ... only SDGs with data, or all 17 — state which
    ],

    // UNCHANGED — already matches the mockup's KPI row 1:1.
    // `total` present only where the card shows a denominator (sdg_roadmap).
    "summary": [
      { "key": "sdg_roadmap", "name": "Holding SDG Roadmap",
        "description": "Adopted dari total 17 SDG PBB", "value": 9, "total": 17 },
      { "key": "strategic_alignment", "name": "Strategic Alignment",
        "description": "Actions mapped to Holding SDGs", "value": 82 },
      { "key": "execution_rate", "name": "Avg. Execution Rate",
        "description": "Overall 'Take' ratio on mandates", "value": 74 },
      { "key": "bottom_up_initiatives", "name": "Bottom-Up Initiatives",
        "description": "Actions outside Holding Roadmap", "value": 28 }
    ],

    // UNCHANGED shape. One row per entity rendered in the matrix.
    // B3: state whether the HOLDING row is included. FE renders every row it receives.
    // B1: `actions[]` MUST be the complete unpaginated set for this entity under the active
    //     filter — FE derives each matrix cell from it by grouping on sdg_id.id.
    "matrix": [
      {
        "entity_id": { "id": "1", "name": "Sintesa" },
        "entity_type": "HOLDING",              // HOLDING | SUBSIDIARY
        "period": 2026,
        "execution_percentage": 10,            // "Total Execution" column
        "adoption_take_count": 9,              // redundant once B1 is FE-derived; keep or drop
        "adoption_skip_count": 1,
        "actions": [
          {
            "ids": "123",
            "sdg_id": { "id": "s6X9n1U8Bjl0", "name": "SDG 12" },
            "adoption_status": "TAKE",         // CHANGED (A1): TAKE | SKIP | INITIATED
            "plan_origin": "HOLDING",          // HOLDING | SUBSIDIARY
            "impact": "Operations Impact",
            "key_business_action": "Kerjasama dengan mitra kerja ...",
            "detail_action_solution": "Berinvestasi pada energi terbarukan",
            "baseline": "baseline sekarang",
            "target": "target nanti",
            "indicator_id": { "id": "oP229ralLrzM", "name": "Sustainability Investment",
                              "evidence": "Required" },
            "pillar_id": { "id": "qT4ROSu3d1NL", "name": "Operation" },
            "sdg_ambition_esg_alignment": "SDG 1",
            "created_at": null,
            "updated_at": null
          }
        ]
      }
    ]
  }
}
```

### Deliberately not proposed

- **Per-cell counts on the matrix row** (`cells[]` keyed by sdg_id). FE derives them from `actions[]`
  in a few lines; adding a second pre-aggregated source invites the two disagreeing. Add it only if
  `actions[]` turns out to be paginated or large enough to hurt.
- **An SDG master endpoint.** `sdgs[]` inline costs one array on a response the page already fetches;
  a separate endpoint is a second round-trip and a second cache to invalidate. Promote it only when
  a second screen needs the same list.
- **`impact` as a typed enum on `actions[]`.** Left as the free-text `"Operations Impact"` the
  current example ships, since only the filter param needs to be machine-readable.

---

## Open questions for backend

1. Is `INITIATED` a real `adoption_status`, or is "initiated" the absence of a decision? (A1)
2. Roadmap size — KPI says 9 adopted, matrix shows 6 columns. Which is authoritative? (A2)
3. Does `sdgs[]` list all 17, or only those with data? (A3)
4. Are `period` / `entity_id` / `impact` honoured server-side, and is `summary[]` recomputed under
   them? (B2)
5. Does `matrix[]` include the HOLDING row alongside subsidiaries? (B3)
6. Is `actions[]` complete and unpaginated per row? (B1)

Settle 1–6, then rewrite `src/services/strategic-insight/types.d.ts` and re-run
`node --experimental-strip-types src/services/strategic-insight/api.check.ts`.

## Backend answer (2026-09-15)

Not one of the six above, but a confirmed wire-shape change: **`period` moved off the matrix row
onto each action.** `entity_id`/`entity_type`/`execution_percentage`/`adoption_take_count`/
`adoption_skip_count` still live on the row; `period` does not — it now lives only on
`actions[].period`. BE's reasoning: the row-level copy "isn't needed", since every action already
carries its own. Live-verified against `GET /v1/strategic-insight/sdg` — the matrix row has no
`period` key, every action does.

`StrategicInsightSdgWireMatrixRow` in `types.d.ts` had `period: number`; removed. Added `period:
number` to `StrategicInsightSdgWireAction` (it also picked up the live payload's other nullable
fields — `baseline`, `target`, `indicator_id`, `sdg_ambition_esg_alignment` are all `string | null`
/ `Ref2 | null` on the wire, and `adoption_status` observed a third value, `PENDING`, alongside
`TAKE`/`SKIP`). `normalize-sdg.ts`'s `flattenActions()` now reads `action.period` instead of
`row.period`; the padded-demo generator (`paddedActionsFor`) sets both the `FlatAction.period` and
the cloned action's own `.period` so the two stay in sync. `fixtures/live-sdg.json` updated to
match (period moved from the row onto both example actions).


## FE fix (2026-09-25) — Holding vs Bottom-Up classification

Bug report: SDG 1 (not adopted) rendered under "Holding SDGs"; Strategic Alignment showed 164%;
the Alignment Gap chart showed 35–43 "Holding" per entity (the whole mandate pool) instead of
mandates actually taken.

- **A2 closed FE-side via `GET /v1/master-sdg/index`** (`api/Master SDG/Index.yml`, `status:
  Adopted | Not Adopted`). `getSdgInsight` fetches it alongside `/strategic-insight/sdg`; column
  group = adoption status, never `plan_origin`. Non-adopted group renders "Bottom-Up Initiatives".
- **`holding_count` = `plan_origin HOLDING && adoption_status TAKE`** (`isTakenMandate`). The
  Holding bar's drill-down uses the same predicate.
- **`summary[]` values recomputed FE-side** from the same filtered actions (name/description
  stay the backend's): `sdg_roadmap` = adopted / master total; `strategic_alignment` = % actions on
  adopted SDGs; `execution_rate` = taken / HOLDING-origin actions; `bottom_up_initiatives` = actions
  on non-adopted SDGs. Backend `summary[]` values are ignored — BE should fix its own 164% so the
  two don't diverge for other consumers.

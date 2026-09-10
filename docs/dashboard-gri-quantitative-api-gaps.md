# Dashboard · GRI Quantitative — Contract Gaps & Proposal

Scope: `GET /v1/strategic-insight/gri-quantitative`, consumed by
`src/pages/dashboard/GriQuantitativePage.vue` via `src/services/strategic-insight/`.

Two sources of truth compared here:

- **Contract**: `api/Dashboard/GRI - Quantitative.yml` — ships `Response Dummy` (the enriched,
  normative example) + `Legacy Response (pre dimensions/labels)` examples covering two categories
  (`GENERAL`, `ENERGY`).
- **Mockup**: <https://curious-marigold-7934ec.netlify.app/> — single-file HTML, all fixture data
  inline in its `<script>` block (`RAW`, `ENERGY`, `WASTE`, `WATER`, `DIVERSITY`, `EMPLOYMENT`,
  `OHS`, `TRAINING`), 15 entities × 3 years (2023–2025).

Sibling analysis for the other dashboard tab: `docs/dashboard-sdg-api-gaps.md`.

**`src/services/strategic-insight/types.d.ts` now matches the proposed contract below.** Its
`StrategicInsightGriQuantitativeResponse` was previously an independent invention
(`metrics[].rows[]`), and `GriQuantitativePage.vue` keyed tabs on a `gri_code` prefix (`'2-7'`)
which never matches the leaf codes the contract sends (`'2-7a'`) — every tab rendered its empty
state against a perfectly good payload. Both are fixed; `contract.check.ts` reads the Bruno
collection at run time and asserts all 8 tabs, 32 KPI cards and 18 dimension charts resolve, so
this cannot silently regress. The SDG types are still an invention — that stays G2.

---

## Mockup inventory

8 tabs, 2 global filters (Perusahaan, Tahun), 32 KPI cards, 27 charts (26 `<canvas>` + the
`pt-bars` div), split across 18 grouping dimensions. Every one is traced individually in
`src/services/strategic-insight/contract.check.ts` (`mockupCharts`).

| Tab | GRI codes in header | KPI cards | Charts |
|---|---|---|---|
| General | 2-7 · 2-8 | Total Karyawan, Laki-laki, Perempuan, Karyawan Tetap, Karyawan Kontrak | gender/yr, status/yr, trend, gender donut, PT comparison, worker type, status pie |
| Energy | 302-1 | Total Non-Renewable (GJ), Total Renewable (GJ), % Energi Terbarukan | non-ren vs ren /yr, total trend, fuel breakdown |
| Waste | 306-4 · 306-5 | Total Divert (ton), Total Disposal (ton), Recycled (ton), Landfill (ton) | divert stacked, disposal stacked, trend |
| Water | 303-3 · 303-4 | Total Withdrawal (ML), Total Discharge (ML), Surface (ML), Third-party (ML) | withdrawal stacked, discharge stacked, trend |
| Diversity | 405-1 · 405-2 | Governance Pria (%), Governance Wanita (%), Rasio Gaji F/M Senior, Rasio Gaji F/M Junior | gov gender, age bands stacked, salary ratio |
| Employment | 401-1 · 401-3 | Karyawan Baru Pria, Karyawan Baru Wanita, Hak Cuti Pria, Hak Cuti Wanita | new hires, parental leave funnel |
| OHS | 403-9 | Kematian, Cedera berat, Kecelakaan tercatat, Total jam kerja | incidents/yr, tetap vs kontrak, trend |
| Training | 404-1 | Avg jam Pria, Avg jam Wanita, jam Senior, jam Junior | per gender, per category, trend |

---

## What the contract already covers

| Mockup widget | Contract source | Notes |
|---|---|---|
| Tab grouping | `data[].category` | shape is right, enum is not — see A1 |
| Energy KPI · Total Non-Renewable | `summary[key=total_non_renewable]` | exact |
| Energy KPI · Total Renewable | `summary[key=total_renewable]` | exact |
| Energy KPI · % Energi Terbarukan | `summary[key=renewable_ratio]` | exact |
| General KPI · Total Karyawan / Laki-laki / Perempuan | `summary[key=total_employee\|male\|female]` | exact |
| Chart x-axis (years) | `items[].period` | exact, subject to A4 |
| PT comparison bar labels | `items[].entity.{code,name}` | exact, subject to A4 |
| Value + unit rendering | `items[].value`, `items[].unit_id` | see B1 |
| Non-numeric disclosures | `items[].input_type` = TEXT/DATE/BOOLEAN | no widget consumes them — C1 |

The Energy tab's KPI row is fully served. Nothing else is.

---

## Gaps

Severity: **A** = blocks the mockup, backend change required. **B** = FE can absorb, needs a written
guarantee. **C** = out of scope of this endpoint.

Five blockers (A1-A5), four absorbable (B1-B4), two out of scope (C1-C2).

### A1 · Only 2 of 8 categories exist, and `category` is an unaligned free string — blocks

The example ships `GENERAL` and `ENERGY`. The mockup has eight tabs. `WASTE`, `WATER`,
`DIVERSITY`, `EMPLOYMENT`, `OHS`, `TRAINING` appear nowhere in the collection —
`grep -rn "TRAINING\|OHS" api/` is empty.

Worse, the values that do exist do not match the master:
`GET /v1/master-category/index` returns `{"id": "gbqp0oQHcJ5", "name": "General"}`,
`{"name": "Diversity & Equal Opportunity"}` — title case, with an id. The dashboard sends
`"category": "GENERAL"` — a bare uppercase string with no id and no defined mapping back to the
master. The FE cannot key tabs on it without hardcoding a translation table that silently breaks
when a category is renamed.

Send the master reference, same `Ref2` shape every other endpoint in the collection uses.

### A2 · No dimensional keys — every chart series is split on localized free text — blocks

This is the central problem. Every chart in the mockup is a *breakdown*, not a single series:

| Tab | Dimension the chart splits on | Members |
|---|---|---|
| General | gender | Laki-laki / Perempuan |
| General | employment status | Tetap / Kontrak |
| General | non-employee worker type | Kontraktor / Magang / Sukarela / Outsource |
| Energy | renewability | Non-Renewable / Renewable |
| Energy | fuel type | Solar / Biodiesel / Grid-Batubara |
| Waste | diverted composition | Recycled / Composted / Recovery |
| Waste | disposal route | Landfill / Incineration / Other |
| Water | source & destination | Surface / Groundwater / Seawater / Third-party |
| Diversity | governance gender | Pria / Wanita |
| Diversity | age band | <30 / 30–50 / >50 |
| Diversity | employee category | Senior / Mid / Junior |
| Employment | gender × age band | Pria / Wanita, <30 / 30–50 / >50 |
| Employment | parental leave stage | Berhak / Mengambil / Kembali |
| OHS | incident type × employment type | Fatality / High-consequence / Recordable × Tetap / Kontrak |
| Training | gender, employee category | Pria / Wanita, Senior / Mid / Junior / Staff |

The contract's only discriminator is `description`, a free-text Indonesian display string
(`"Laki-laki"`, `"Non-Renewable"`). Grouping chart series by that means:

- the series break the moment someone edits an MKI row label or the app is localized;
- `"Perempuan"` and `"Wanita"` (both used in the mockup, for employees and governance members) are
  the same dimension member in two spellings;
- a two-dimensional split (OHS: incident type × employment type) is not expressible at all in one
  flat string.

**The data model to fix this already exists one module over.** `api/Master Key Indicator/GRI -
Quantitative/V2/Create.yml` defines exactly this: `columns[] {key, name}` declaring the dimensions,
`rows[].labels {}` giving each row's coordinate, and `metrics[] {key, name, input_type, unit}`.
The dashboard endpoint flattens all of it away into `description`. Surface it instead — see the
proposed contract.

### A3 · `summary[]` keys are defined for 2 categories; 26 of 32 KPI cards have no source — blocks

Defined: `total_employee`, `male`, `female`, `total_non_renewable`, `total_renewable`,
`renewable_ratio`. That is 6 keys for 32 cards, and even General is short two —
**Karyawan Tetap** and **Karyawan Kontrak** have no key.

Every card is a fixed, named, backend-computed figure; the FE must not guess these keys. Full
required set in the proposed contract below.

Three of them are not sums and cannot be derived by summing rows:

- `governance_male_ratio` / `governance_female_ratio` — a share of the governance-body population,
  not of employees.
- `salary_ratio_senior` / `salary_ratio_junior` — a mean of per-entity ratios (the mockup averages
  across entities, then across years).
- `avg_training_hours_*` — a mean of per-entity averages.

`aggregation` currently admits `SUM` and `PERCENTAGE`. It needs `AVERAGE`, and the enum needs to be
declared rather than inferred from two examples (B2).

### A4 · The filters and the trend charts want different scopes — blocks

Read the mockup's `buildGeneral()` carefully:

- KPI cards use `ys` — the **filtered** year set.
- Every trend/grouped-bar chart uses the `YEARS` constant — **always all three years**, regardless
  of the Tahun filter.
- The PT comparison bar chart uses `Object.keys(RAW)` — **always all 15 entities**, regardless of
  the Perusahaan filter, and always period 2025.

So a server-side `period=2024` filter that prunes `items[]` silently empties every chart on the
page, and `entity_id=` breaks the comparison chart. One request cannot satisfy both scopes unless
the contract states which one it honours.

Recommended resolution: **`items[]` is never filtered by `period`; `summary[]` is.** Then the FE
filters `items[]` itself for the KPI-adjacent widgets and keeps the full set for trends. Whatever
is chosen has to be written down — this is the difference between a working page and blank charts.

### A5 · Nothing on an item says whether it sums or averages — blocks

`aggregation` existed only on `summary[]`. But the FE has to aggregate `items[]` itself whenever a
selection spans several entities or periods (AC-75, and unavoidable here because `items[]` is
returned unfiltered per A4). Three metrics are inherently averages:

| Metric | `input_type` | Correct combine |
|---|---|---|
| `salary_ratio_female_to_male` (405-2) | `NUMBER` | AVERAGE |
| `avg_training_hours` (404-1) | `NUMBER` | AVERAGE |
| everything else | `NUMBER` | SUM |

They are plain `NUMBER`s, not `PERCENTAGE`s — a salary ratio is `0.95`, not `95%`. So the combine
rule **cannot be inferred from `input_type`**, and inferring it produced visible nonsense: two
entities each reporting a 0.94 senior salary ratio rendered **1.88**, and average training hours
summed across 15 entities read **~450 hours** instead of ~30. Two of eight tabs, wrong.

`input_type` describes how a value is entered and rendered; `aggregation` describes how it
combines. Resolved by putting `aggregation` on each item as well, so the FE never guesses.
Regression-tested in both `api.check.ts` and `contract.check.ts`.

### B1 · `unit_id` holds a unit object, and the units the mockup shows do not exist

Two problems.

*Naming*: the field is `unit_id` but its value is `null` or `{"id": "9", "name": "%"}` — an object,
not an id. Every other module in the collection calls that shape `unit` (see MKI V2
`metrics[].unit`). Rename to `unit` for consistency, or the FE gets `unit_id.name` in its templates.

*Vocabulary*: the mockup renders `GJ`, `ton`, `ML`, `jam`, `%`. `GET /v1/master-unit/index` returns
Cubic Meter (m3), Metric Ton (ton), Kilogram (kg), MMBtu, Litre, KiloWatt Hours. **GJ, ML, and jam
(hours) are missing**, and the dashboard example invents ids (`"id": "3"` = GJ, `"id": "9"` = %)
that are not in the master and do not even follow its 12-char id format. Either add the units to the
master or state that the dashboard's unit labels are display-only and unresolvable against it.

### B2 · Enums are undeclared

`aggregation` (`SUM`, `PERCENTAGE`, + `AVERAGE` per A3), `input_type` (`NUMBER`, `PERCENTAGE`,
`TEXT`, `DATE`, `BOOLEAN` observed — MKI V2 uses `YES_NO` for the same concept, so those two
disagree), and `category` (A1). None are written down; all were reverse-engineered from example
bodies. `input_type` disagreeing with MKI's `YES_NO` is a real inconsistency, not a documentation
nit.

### B3 · Query parameters are undeclared

`GRI - Quantitative.yml` declares no params. The FE already sends `?period=&entity_id=`. See A4 for
why the semantics matter more than the names here.

### B4 · The two examples disagreed on the envelope — resolved

The example we had labeled "Contract" (our own FE-side label, not a BE naming) returned a bare
`{"data": ...}`, while `Response Dummy` — the BE-authored example — carried the full
`{code, data, error, message}` envelope that `src/lib/http.ts` and `unwrap<T>()` expect. Because
our example was enriched (8 categories, `dimensions[]`, `labels{}`) it read as the more complete
example, so it was the one a reader treated as normative, even though the envelope it modeled was
wrong. The deeper issue was the naming: our label had displaced the BE's own reference example as
the apparent source of truth. Settled by renaming — the enriched, normative example is now
`Response Dummy` (matching BE naming) and the old 2-category BE dump is
`Legacy Response (pre dimensions/labels)`. No example named "Contract" remains.

### C1 · TEXT / DATE / BOOLEAN disclosures have no widget

The `GENERAL` example ships four of them (`2-2` boundary note, `2-3` period end date, `2-23` policy
flag). The mockup renders no qualitative content on this page — that is the separate GRI Qualitative
dashboard, which **has no endpoint in `api/Dashboard/` at all** (only `SDG.yml` and
`GRI - Quantitative.yml` exist, yet `strategicInsightApi.getGriQualitativeInsight()` calls
`/v1/strategic-insight/gri-qualitative`). Either drop non-numeric items from this response or state
that the FE filters them out.

### C2 · Entity master data will not populate the Perusahaan dropdown

The mockup lists 15 named PTs (WS, SDS, MEPPO, SBG, SGE, TES, MPRD, MD, TA, TRS, MPH, SPP, SPM,
GSME, PMB). `GET /v1/master-entity/index` returns 7 rows, with `code: "MG"` appearing twice under
different ids and `name: "Sintesa"` repeated across unrelated entities. Not this endpoint's problem,
but the dashboard cannot render its filter or its PT-comparison chart correctly until the entity
master is real.

---

## Proposed contract

Additive where possible. `category` and `unit_id` are the only breaking renames, and both align this
endpoint with conventions the rest of the collection already follows.

```yaml
GET {{base_url}}/v1/strategic-insight/gri-quantitative
  ?period=2025          # optional; omitted = all periods. Narrows summary[] only (A4).
  &entity_id=Ks6Bg...   # optional; omitted = all entities. Narrows summary[] only (A4).
  &category_id=QRHw...  # optional; omitted = all 8 categories
```

```jsonc
{
  "code": 200,
  "error": false,
  "message": "Success get data GRI",
  "data": [
    {
      // CHANGED (A1): Ref2 from /v1/master-category/index, not a bare uppercase string.
      "category_id": { "id": "gbqp0oQHcJ5", "name": "General" },
      "gri_codes": ["2-7", "2-8"],   // NEW: the tab's header caption ("GRI 2-7 · 2-8")
      "sequence": 1,                 // NEW: tab order; FE renders as given

      // NEW (A2): the dimensions this category's items[] are split on, in display order.
      // Mirrors MKI V2 columns[]. Drives every chart's series split.
      "dimensions": [
        { "key": "gender", "name": "Gender",
          "members": [
            { "key": "MALE",   "name": "Laki-laki" },
            { "key": "FEMALE", "name": "Perempuan" }
          ]
        },
        { "key": "employment_status", "name": "Status Karyawan",
          "members": [
            { "key": "PERMANENT", "name": "Tetap" },
            { "key": "CONTRACT",  "name": "Kontrak" }
          ]
        }
      ],

      // CHANGED (A3): one entry per KPI card the tab renders. Backend-computed under the
      // active filter. `total` only where the card shows a denominator.
      "summary": [
        { "key": "total_employee",    "name": "Total Karyawan",  "value": 8614, "unit": null, "aggregation": "SUM" },
        { "key": "male",              "name": "Laki-laki",       "value": 4477, "unit": null, "aggregation": "SUM" },
        { "key": "female",            "name": "Perempuan",       "value": 4137, "unit": null, "aggregation": "SUM" },
        { "key": "permanent_employee","name": "Karyawan Tetap",  "value": 7102, "unit": null, "aggregation": "SUM" },
        { "key": "contract_employee", "name": "Karyawan Kontrak","value": 1512, "unit": null, "aggregation": "SUM" }
      ],

      "items": [
        {
          "id": "123",
          "period": 2025,
          "entity": { "id": "Ks6BgE75YiQ1", "code": "WS", "name": "Waskita Sintesa" },
          "gri_code": "2-7a",
          "metric_key": "employee_headcount",   // NEW (A2): stable key, mirrors MKI metrics[].key
          "metric_name": "Employee Headcount",
          "labels": { "gender": "MALE" },       // NEW (A2): coordinate in dimensions[]. Mirrors MKI rows[].labels.
          "description": "Laki-laki",           // UNCHANGED: display only, never a grouping key
          "value": 880,
          "unit": null,                         // RENAMED from unit_id (B1); Ref2 or null
          "input_type": "NUMBER",               // NUMBER | PERCENTAGE | TEXT | DATE | BOOLEAN (B2)
          "aggregation": "SUM"                  // NEW (A5): SUM | AVERAGE — how this metric combines
                                                // across entities/periods. NOT derivable from
                                                // input_type: salary ratios and average training
                                                // hours are NUMBERs that must still AVERAGE.
        }
      ]
    }
  ]
}
```

### Required `summary[]` keys, all 8 categories (32 total)

Naming follows the existing `total_non_renewable` / `renewable_ratio` style.

| Category | keys | aggregation |
|---|---|---|
| General | `total_employee`, `male`, `female`, `permanent_employee`, `contract_employee` | SUM |
| Energy | `total_non_renewable`, `total_renewable` | SUM |
| Energy | `renewable_ratio` | PERCENTAGE |
| Waste | `total_divert`, `total_disposal`, `total_recycled`, `total_landfill` | SUM |
| Water | `total_withdrawal`, `total_discharge`, `surface_water`, `third_party_water` | SUM |
| Diversity | `governance_male_ratio`, `governance_female_ratio` | PERCENTAGE |
| Diversity | `salary_ratio_senior`, `salary_ratio_junior` | AVERAGE |
| Employment | `new_hire_male`, `new_hire_female`, `parental_entitled_male`, `parental_entitled_female` | SUM |
| OHS | `work_related_fatalities`, `high_consequence_injuries`, `recordable_injuries`, `total_hours_worked` | SUM |
| Training | `avg_training_hours_male`, `avg_training_hours_female`, `avg_training_hours_senior`, `avg_training_hours_junior` | AVERAGE |

### Required `dimensions[]` per category

| Category | dimension keys |
|---|---|
| General | `gender`, `employment_status`, `worker_type` (CONTRACTOR / INTERN / VOLUNTEER / OUTSOURCED) |
| Energy | `renewability` (NON_RENEWABLE / RENEWABLE), `fuel_type` (DIESEL / BIODIESEL / GRID) |
| Waste | `waste_route` (RECYCLED / COMPOSTED / RECOVERY / LANDFILL / INCINERATION / OTHER) |
| Water | `water_flow` (WITHDRAWAL / DISCHARGE), `water_source` (SURFACE / GROUNDWATER / SEAWATER / THIRD_PARTY) |
| Diversity | `gender`, `age_band` (UNDER_30 / BETWEEN_30_50 / OVER_50), `employee_category` (SENIOR / MID / JUNIOR / STAFF) |
| Employment | `gender`, `age_band`, `parental_stage` (ENTITLED / TOOK / RETURNED) |
| OHS | `incident_type` (FATALITY / HIGH_CONSEQUENCE / RECORDABLE / HOURS_WORKED), `employment_status` |
| Training | `gender`, `employee_category` |

### Deliberately not proposed

- **Pre-aggregated chart series** (`charts[]` keyed by widget). Once `dimensions[]` + `labels{}`
  exist the FE groups `items[]` in a few lines, and a second pre-aggregated source invites the two
  disagreeing. The same call was made for the SDG matrix cells.
- **A separate SDG-style master endpoint for dimensions.** Inline costs one array on a response the
  page already fetches. Promote it when a second screen needs the same list.
- **Dropping `description`.** It stays as the display label; it just stops being load-bearing.
- **Localizing `dimensions[].members[].name` server-side.** Indonesian, as the mockup renders,
  matching how `summary[].name` already ships.

---

## Open questions for backend

1. Does `items[]` respect `period` / `entity_id`, or only `summary[]`? The trend and PT-comparison
   charts need the unfiltered set. (A4)
2. Can `category_id` be the `Ref2` from `/v1/master-category/index` rather than a bare string? (A1)
3. Can the MKI V2 `columns[]` / `rows[].labels` model be surfaced here as `dimensions[]` /
   `labels{}`, or is `description` the only discriminator the storage layer can produce? (A2)
4. Are the 32 `summary[]` keys above acceptable, and is `AVERAGE` a supported aggregation? (A3)
5. Will GJ, ML, and hours be added to `/v1/master-unit/index`, or are dashboard unit labels
   display-only? (B1)
6. Is `input_type` `BOOLEAN` here and `YES_NO` in MKI V2 intentional? (B2)
7. Is `aggregation` correct per item, and is the AVERAGE set exactly
   {`salary_ratio_female_to_male`, `avg_training_hours`}? Any other metric that must not sum? (A5)
8. Is there an endpoint planned for the GRI Qualitative dashboard tab? The FE already calls
   `/v1/strategic-insight/gri-qualitative` and nothing in `api/` defines it. (C1)
9. When will `/v1/master-entity/index` carry the 15 real PTs? (C2)

Settle 1–9 above. The FE is already aligned with the proposed contract, so answers that confirm it
need no code change; answers that diverge should be applied to
`api/Dashboard/GRI - Quantitative.yml` first, then caught by
`node --experimental-strip-types src/services/strategic-insight/contract.check.ts`, which reads
that file at run time rather than a copied fixture.

Verify with:

```sh
node --experimental-strip-types src/services/strategic-insight/api.check.ts       # aggregate.ts unit behaviour
node --experimental-strip-types src/services/strategic-insight/contract.check.ts  # real contract -> all 32 KPIs, 18 charts
node_modules/.bin/tsc -p tsconfig.check.json --noEmit
pnpm build
```

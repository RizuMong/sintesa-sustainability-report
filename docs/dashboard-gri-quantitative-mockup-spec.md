# Dashboard · GRI Quantitative — Mockup Layout Spec

Source of truth for the rebuild of `src/pages/dashboard/GriQuantitativePage.vue`.

Mockup: <https://curious-marigold-7934ec.netlify.app/> (single-file HTML, Tailwind + Chart.js).
Contract: `api/Dashboard/GRI - Quantitative.yml`, typed in `src/services/strategic-insight/types.d.ts`.
Gap analysis: `docs/dashboard-gri-quantitative-api-gaps.md`.

## 1. Page layout (mockup, top to bottom)

```
┌─ Header (dark brand bar) ───────────────────────────────────────────┐
│ "Dashboard ESG"  ·  subtitle "Sintesa Group · 2023–2025 · GRI"      │
│                                     [ Perusahaan ▾ ] [ Tahun ▾ ]    │
├─ Sticky tab strip (8 tabs, horizontally scrollable) ────────────────┤
│ General | Energy | Waste | Water | Diversity | Employment | OHS |   │
│ Training & Education                                                │
├─ Main (max-w-7xl, vertical rhythm 24px) ────────────────────────────┤
│ subtitle: "Menampilkan: <entity> · <period>"                        │
│ GRI badge chip + one-line category description                      │
│ KPI row      — 3..5 cards, responsive grid                          │
│ Chart row 1  — 2 cards side by side (50/50)                         │
│ Chart row 2  �� 2 cards side by side (50/50)   (General only)        │
│ Wide card    — 1 full-width card                                    │
│ Chart row 3  — 2 cards side by side (50/50)   (General only)        │
└─────────────────────────────────────────────────────────────────────┘
```

Every chart lives in its own card: white surface, 1px border, rounded, padding 20px,
title (`h2`, semibold, small) + GRI caption (label-small, secondary) + chart at fixed
height (200px in General, 220px elsewhere) + a legend row underneath.

## 2. Per-tab inventory

Legend for `Chart type`: `bar` = grouped bars, `bar-stacked` = stacked bars,
`bar-single` = one dataset, categorical x-axis, `line` = trend, `donut`/`pie`.
`x` is the axis; `series` are the datasets. `dim:<key>` refers to
`category.dimensions[].key` in the contract (verified against the `Response Dummy` example).

### General — GRI 2-7 · 2-8 — "Total karyawan & pekerja non-karyawan"

KPI (5): `total_employee`, `male`, `female`, `permanent_employee`, `contract_employee`

| # | Title | Caption | Type | x | Series | Width |
|---|---|---|---|---|---|---|
| 1 | Gender per tahun | GRI 2-7a | bar | periods | dim:`gender` (MALE, FEMALE) | 1/2 |
| 2 | Status karyawan per tahun | GRI 2-7b | bar | periods | dim:`employment_status` | 1/2 |
| 3 | Tren jumlah karyawan | — | line | periods | Total (all), Tetap (PERMANENT) | 1/2 |
| 4 | Komposisi gender (%) | — | donut | dim:`gender` members | one dataset, all periods summed | 1/2 |
| 5 | Perbandingan total karyawan antar PT | — | bar-single, horizontal | entity codes | total per entity | full |
| 6 | Tipe pekerja non-karyawan | GRI 2-8a | bar-single | dim:`worker_type` members | one dataset | 1/2 |
| 7 | Komposisi status karyawan (%) | — | pie | dim:`employment_status` | one dataset | 1/2 |

### Energy — GRI 302-1 — "Konsumsi energi dalam organisasi"

KPI (3): `total_non_renewable`, `total_renewable`, `renewable_ratio`

| # | Title | Caption | Type | x | Series | Width |
|---|---|---|---|---|---|---|
| 1 | Konsumsi energi per tahun (GJ) | GRI 302-1a/b — Non-renewable vs Renewable | bar | periods | dim:`renewability` | 1/2 |
| 2 | Tren konsumsi energi | GRI 302-1 — Total energi per tahun | line | periods | Total | 1/2 |
| 3 | Breakdown jenis bahan bakar non-renewable | GRI 302-1a | bar-single | dim:`fuel_type` members | one dataset | full |

### Waste — GRI 306-4 · 306-5 — "Pengelolaan limbah"

KPI (4): `total_divert`, `total_disposal`, `total_recycled`, `total_landfill`

| # | Title | Caption | Type | x | Series | Width |
|---|---|---|---|---|---|---|
| 1 | Limbah dialihkan dari pembuangan (ton) | GRI 306-4a — Berdasarkan komposisi | bar-stacked | periods | dim:`waste_route` ∩ RECYCLED/COMPOSTED/RECOVERY | 1/2 |
| 2 | Limbah dibuang (ton) | GRI 306-5a — Berdasarkan komposisi | bar-stacked | periods | dim:`waste_route` ∩ LANDFILL/INCINERATION/OTHER | 1/2 |
| 3 | Tren total limbah per tahun (ton) | GRI 306-4 & 306-5 — Divert vs Disposal | line | periods | Divert total, Disposal total | full |

### Water — GRI 303-3 · 303-4 — "Penarikan & pembuangan air"

KPI (4): `total_withdrawal`, `total_discharge`, `surface_water`, `third_party_water`

| # | Title | Caption | Type | x | Series | Width |
|---|---|---|---|---|---|---|
| 1 | Penarikan air per sumber (ML) | GRI 303-3a | bar-stacked | periods | dim:`water_source`, items where `water_flow=WITHDRAWAL` | 1/2 |
| 2 | Pembuangan air per tujuan (ML) | GRI 303-4a | bar-stacked | periods | dim:`water_source`, items where `water_flow=DISCHARGE` | 1/2 |
| 3 | Tren penggunaan air (ML) | GRI 303-3 & 303-4 | line | periods | Withdrawal, Discharge (from dim:`water_flow`) | full |

### Diversity & Equal Opportunity — GRI 405-1 · 405-2

KPI (4): `governance_male_ratio`, `governance_female_ratio`, `salary_ratio_senior`, `salary_ratio_junior`

| # | Title | Caption | Type | x | Series | Width |
|---|---|---|---|---|---|---|
| 1 | Komposisi governance bodies berdasarkan gender | GRI 405-1a | bar | periods | dim:`gender`, metric `governance_body_composition` | 1/2 |
| 2 | Distribusi kelompok umur karyawan | GRI 405-1b | bar-stacked | periods | dim:`age_band` | 1/2 |
| 3 | Rasio gaji perempuan terhadap laki-laki per kategori | GRI 405-2a | bar | periods | dim:`employee_category`, metric `salary_ratio_female_to_male` | full |

### Employment — GRI 401-1 · 401-3

KPI (4): `new_hire_male`, `new_hire_female`, `parental_entitled_male`, `parental_entitled_female`

| # | Title | Caption | Type | x | Series | Width |
|---|---|---|---|---|---|---|
| 1 | Karyawan baru berdasarkan gender & kelompok usia | GRI 401-1a | bar | periods | dim:`gender`, metric `new_employee_hires` | 1/2 |
| 2 | Cuti orang tua — berhak, diambil, dan kembali | GRI 401-3a/b/c | bar | dim:`parental_stage` members | dim:`gender` | 1/2 |

### OHS — GRI 403-9

KPI (4): `work_related_fatalities`, `high_consequence_injuries`, `recordable_injuries`, `total_hours_worked`

| # | Title | Caption | Type | x | Series | Width |
|---|---|---|---|---|---|---|
| 1 | Insiden keselamatan kerja per tahun | GRI 403-9a | bar | periods | dim:`incident_type` minus HOURS_WORKED | 1/2 |
| 2 | Insiden tetap vs kontrak | GRI 403-9a | bar | periods | dim:`employment_status`, items where `incident_type=RECORDABLE` | 1/2 |
| 3 | Tren jam kerja & tingkat kecelakaan | GRI 403-9a | line | periods | Recordable injuries | full |

### Training & Education — GRI 404-1

KPI (4): `avg_training_hours_male`, `avg_training_hours_female`, `avg_training_hours_senior`, `avg_training_hours_junior`

| # | Title | Caption | Type | x | Series | Width |
|---|---|---|---|---|---|---|
| 1 | Rata-rata jam pelatihan per gender | GRI 404-1a | bar | periods | dim:`gender` | 1/2 |
| 2 | Rata-rata jam pelatihan per kategori karyawan | GRI 404-1a | bar | periods | dim:`employee_category` | 1/2 |
| 3 | Tren jam pelatihan per tahun | GRI 404-1 | line | periods | dim:`gender` | full |

Totals: 8 tabs, 32 KPI cards, 24 chart cards (excluding the PT-comparison card = 25 with it).

## 3. Mekari / repo styling rules (replaces the mockup's Tailwind)

The mockup's palette is **not** carried over. Map to Pixel 3 semantic tokens:

| Mockup | Use instead |
|---|---|
| `bg-brand` dark header | `backgroundColor="background.surface"` header block, same as `SdgPage.vue` today |
| Tailwind cards | `MpFlex` with `backgroundColor="background.surface"`, `borderWidth="1px"`, `borderColor="border.default"`, `rounded="md"`, `padding="20px"` |
| Tailwind grid | `MpFlex wrap="wrap"` or `css({ display:'grid', gridTemplateColumns:{base:'1fr', md:'1fr 1fr'}, gap:'4' })` from `@mekari/pixel3` |
| KPI card | existing `src/components/SummaryBox.vue` (`variant` blue/green/orange/gray) |
| chart colors | leave to `MpChart`'s own `colorPattern`; do NOT hardcode hex |
| `text-ink-muted` | `MpText color="text.secondary"` |
| tab strip | `MpTabs`/`MpTabList`/`MpTab` if verified, else the existing `MpButtonGroup` toggle already in the page |

Hard rules:

- Import components from `@mekari/pixel3` only. No raw `<div>` with inline CSS except via `css()`.
- No new npm dependency. Charts go through `MpChart` (Pixel 3 wraps Chart.js).
- `MpChart` verified props: `id`, `title`, `type`, `data`, `options`, `widthChart`,
  `heightChart`, `widthContainer`, `heightContainer`, `isStacked`, `isHorizontal`,
  `isShowLegend`, `isShowDataLabels`, `isArea`, `legendPosition`, `colorPattern`.
  Use `isStacked` for stacked bars and `isHorizontal` for the PT-comparison bar.
- Keep the existing text mirror under each chart (every plotted value repeated as text) —
  it is what makes the page readable with no hover and on paper. See the current page's
  `describeSeries`.
- The page stays in the original (2.1) token theme: do **not** add `meta: { nextTheme: true }`
  to its route.
- Language: chart titles and captions stay in Indonesian, matching the mockup and the
  existing page. Page chrome (filter labels) stays English, matching the sibling dashboards.

## 4. Data rules (do not violate)

- Series are grouped on `items[].labels[<dimensionKey>]`, **never** on `items[].description`.
- Combine values only via `aggregateItems()` — it honours `items[].aggregation`
  (SUM vs AVERAGE). Never sum ratios.
- KPI values are read straight from `category.summary[]` via `summaryValue()`; never derived FE-side.
  A missing key renders an em-dash, not `0`.
- `items[]` is unfiltered by period/entity: trend and PT-comparison charts intentionally plot
  every period/entity regardless of the active filter.
- Tabs come from the payload ordered by `sequence`; never hardcode the tab list.
- A chart whose series are all zero/absent is hidden rather than plotted as a flat zero.

## 5. Verification

- `pnpm build` must pass (runs `vue-tsc -b`).
- `node --experimental-strip-types src/services/strategic-insight/contract.check.ts` must pass.
- New pure logic gets a co-located `*.check.ts` using `node:assert/strict`.
- `bash scripts/run-dashboard-acceptance.sh` must pass — the browser acceptance run.

### Requirement → evidence

Every explicit requirement of this rebuild, mapped to the check that proves it and the
result observed on the last run. "Acceptance" = `scripts/run-dashboard-acceptance.sh`,
which renders the real page in headless Chrome against the real contract payload.

| # | Requirement | Check | Observed |
|---|---|---|---|
| R1 | 8 tabs, mockup order | Acceptance: `[role=tab]` labels vs `EXPECTED` keys | 8 tabs, exact order |
| R2 | Per-tab chart set matches §2 | Acceptance: `<h2>` titles per tab, after clicking each | all titles present on all 8 tabs |
| R3 | Charts actually draw | Acceptance: per-canvas non-transparent-pixel scan | 26 canvases painted |
| R4 | KPI cards per tab | Acceptance: `[data-slot=root]` count; `contract.check.ts` | 32 KPI keys resolve |
| R5 | Page mounts, console clean | Acceptance: CDP console + exception events | 0 errors, 0 Vue warnings |
| R6 | Series grouped on `labels`, never `description` | `chart-spec.check.ts` | 26 cards traced from real contract |
| R7 | AVERAGE metrics not summed | `chart-spec.check.ts` ratio-range assert; rendered values | salary ratios 0.93 / 0.99 |
| R8 | Tab list from payload, not hardcoded | `chart-spec.ts` resolves on `gri_codes`; generic fallback | fallback verified in check |
| R9 | Tab strip survives filter change | `tab-index.check.ts` | reorder/shrink/vanish/empty + in-range invariant |
| R10 | Mekari styling, no raw hex | `grep -E '#[0-9a-f]{3,6}'` over the 4 changed files | zero matches |
| R11 | No new dependency | `git diff` on `package.json` across all commits | untouched |
| R12 | Follows app patterns | shared `useStrategicInsightFilterState`, reused `SummaryBox`, same header block as `SdgPage` | all 3 dashboards agree |
| R13 | Stays in original token theme | route has no `meta.nextTheme` | unchanged |
| R14 | 2-col grid with full-width rows (§1) | Acceptance: measures each card's width vs the grid | 2 × 688px in a 1392px grid; 6 full cards at 1392px |
| R15 | No duplicated titles / clipped KPI cards | Acceptance: per-tab title dedupe + `scrollHeight > clientHeight` | 0 of each |

The acceptance assertions are mutation-tested, so they are load-bearing rather than
vacuously green:

| Sabotage | Caught as |
|---|---|
| trim one card from `chartCardsFor()` | 5 of 8 tabs fail, by chart title |
| re-add the duplicate unit caption | 5 of 8 tabs fail, with exact clipped counts |
| delete the `data-span="full"` grid rule | all 6 full cards fail at 49% of the grid |

**Not covered:** pixel-level visual fidelity — colors, spacing, type scale. The checks assert
structure and geometry (which charts, of what kind, with what data, at what width, painting
at all), not that it *looks* like the mockup screenshot. Use
`bash scripts/screenshot-dashboard.sh` and eyeball `.temp/shots/`.

Also note the acceptance run pins the viewport to 1440×2400. The grid is responsive and
collapses to a single column at narrow widths by design, so the 2-column layout is only
exercised at or above the `md` breakpoint.

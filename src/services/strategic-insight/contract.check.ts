// run: node --experimental-strip-types src/services/strategic-insight/contract.check.ts
//
// Feeds the REAL contract example — all 8 categories, read from
// api/Dashboard/GRI - Quantitative.yml at run time, not a hand-copied fixture — through the same
// aggregate.ts helpers GriQuantitativePage.vue uses, and asserts the page would render every
// widget the mockup has.
//
// This is the check that would have caught the original mismatch: the old page keyed tabs on a
// `gri_code` prefix ('2-7') that never matches the leaf codes the API sends ('2-7a'), so every
// tab rendered its empty state against a perfectly good payload.
import assert from 'node:assert/strict'
import {
  aggregateItems,
  orderedCategories,
  periodsOf,
  seriesByDimension,
  summaryValue,
  totalsByEntity,
} from './aggregate.ts'
// Loader lives in scripts/lib because scripts/verify-api.ts (live-backend side) needs the same
// "read the committed example off disk" logic this check uses on the fixture side. Kept as one
// implementation rather than two subtly-diverging shell-outs to python3+PyYAML.
import { loadContractExample } from '../../../scripts/lib/gri-contract-diff.ts'

const contract = loadContractExample()

// ---- the 8 mockup tabs, in mockup order ----
const tabs = orderedCategories(contract)
assert.deepEqual(
  tabs.map((c) => c.category_id.name),
  [
    'General',
    'Energy',
    'Waste',
    'Water',
    'Diversity & Equal Opportunity',
    'Employment',
    'OHS',
    'Training & Education',
  ],
  'tab list and order must match the mockup',
)

// ---- every tab renders: a GRI caption, at least one KPI, at least one chart ----
// The 32 expected KPI keys per category, transcribed from the mockup's cards.
const expectedKpis: Record<string, string[]> = {
  General: ['total_employee', 'male', 'female', 'permanent_employee', 'contract_employee'],
  Energy: ['total_non_renewable', 'total_renewable', 'renewable_ratio'],
  Waste: ['total_divert', 'total_disposal', 'total_recycled', 'total_landfill'],
  Water: ['total_withdrawal', 'total_discharge', 'surface_water', 'third_party_water'],
  'Diversity & Equal Opportunity': [
    'governance_male_ratio',
    'governance_female_ratio',
    'salary_ratio_senior',
    'salary_ratio_junior',
  ],
  Employment: [
    'new_hire_male',
    'new_hire_female',
    'parental_entitled_male',
    'parental_entitled_female',
  ],
  OHS: [
    'work_related_fatalities',
    'high_consequence_injuries',
    'recordable_injuries',
    'total_hours_worked',
  ],
  'Training & Education': [
    'avg_training_hours_male',
    'avg_training_hours_female',
    'avg_training_hours_senior',
    'avg_training_hours_junior',
  ],
}

let kpiCount = 0
let chartCount = 0

for (const tab of tabs) {
  const name = tab.category_id.name

  // GRI code caption ("GRI 2-7 · 2-8")
  assert.ok(tab.gri_codes.length > 0, `${name}: no gri_codes for the tab caption`)

  // KPI cards — every key the mockup shows, resolvable by the page's lookup
  for (const key of expectedKpis[name] ?? []) {
    const kpi = summaryValue(tab, key)
    assert.ok(kpi, `${name}: KPI card '${key}' has no summary entry`)
    assert.equal(typeof kpi.value, 'number', `${name}.${key}: value must be numeric`)
    assert.ok(
      ['SUM', 'PERCENTAGE', 'AVERAGE'].includes(kpi.aggregation),
      `${name}.${key}: undeclared aggregation ${kpi.aggregation}`,
    )
    kpiCount++
  }

  // Charts — every declared dimension must produce named series over real periods
  assert.ok(tab.dimensions.length > 0, `${name}: no dimensions, so no chart can be grouped`)
  const periods = periodsOf(tab.items)
  assert.ok(periods.length > 0, `${name}: no periods, so no chart has an x-axis`)

  for (const dimension of tab.dimensions) {
    const series = seriesByDimension(tab, dimension.key)
    assert.equal(
      series.length,
      dimension.members.length,
      `${name}/${dimension.key}: one series per declared member`,
    )
    for (const s of series) {
      assert.ok(s.name.length > 0, `${name}/${dimension.key}: series has no display label`)
      assert.equal(
        s.data.length,
        periods.length,
        `${name}/${dimension.key}/${s.key}: one point per period`,
      )
      assert.ok(
        s.data.every((v) => Number.isFinite(v)),
        `${name}/${dimension.key}/${s.key}: non-finite point (NaN leaked)`,
      )
    }
    chartCount++
  }

  // Every item's label must be groupable — an item whose labels are all undeclared would
  // silently vanish from every chart on the tab.
  const declared = new Set(tab.dimensions.map((d) => d.key))
  for (const item of tab.items) {
    const keys = Object.keys(item.labels)
    if (keys.length === 0) {
      // permitted only for the non-numeric disclosures, which no chart plots
      assert.ok(
        ['TEXT', 'DATE', 'BOOLEAN'].includes(item.input_type),
        `${name}: numeric item ${item.id} has no labels, so no chart can place it`,
      )
      continue
    }
    for (const key of keys) {
      assert.ok(declared.has(key), `${name}: item ${item.id} uses undeclared dimension '${key}'`)
    }
  }

  // PT-comparison chart
  assert.ok(totalsByEntity(tab.items).length > 0, `${name}: no entity totals`)
}

assert.equal(kpiCount, 32, 'all 32 mockup KPI cards must resolve')
assert.equal(chartCount, 18, 'all 18 mockup chart dimensions must resolve')

// ---- chart-level traceability: all 27 charts the mockup actually draws ----
// The 18 dimensions above are the *grouping axes*, not the charts. The mockup draws 27 (26
// <canvas> + the pt-bars div). Each is listed here with the contract field that feeds it, so a
// chart with no source cannot hide behind an aggregate count.
type ChartSource =
  | { via: 'dimension'; category: string; dimension: string }
  | { via: 'trend'; category: string; dimension: string } // same dimension, plotted over periods
  | { via: 'entities'; category: string } // pt-bars / PT comparison
  | { via: 'derived'; category: string; dimension: string; note: string } // FE computes % from a dimension

const mockupCharts: { id: string; title: string; source: ChartSource }[] = [
  // General (7)
  { id: 'c-gender', title: 'Gender by year', source: { via: 'dimension', category: 'General', dimension: 'gender' } },
  { id: 'c-status', title: 'Employment status by year', source: { via: 'dimension', category: 'General', dimension: 'employment_status' } },
  { id: 'c-trend', title: 'Employee headcount trend', source: { via: 'trend', category: 'General', dimension: 'gender' } },
  { id: 'c-donut', title: 'Gender composition (%)', source: { via: 'derived', category: 'General', dimension: 'gender', note: 'share of total' } },
  { id: 'pt-bars', title: 'Total employees comparison across entities', source: { via: 'entities', category: 'General' } },
  { id: 'c-worker', title: 'Non-employee worker type', source: { via: 'dimension', category: 'General', dimension: 'worker_type' } },
  { id: 'c-pie', title: 'Employment status composition (%)', source: { via: 'derived', category: 'General', dimension: 'employment_status', note: 'share of total' } },
  // Energy (3)
  { id: 'c-energy-bar', title: 'Energy consumption by year (GJ)', source: { via: 'dimension', category: 'Energy', dimension: 'renewability' } },
  { id: 'c-energy-trend', title: 'Energy consumption trend', source: { via: 'trend', category: 'Energy', dimension: 'renewability' } },
  { id: 'c-energy-fuel', title: 'Non-renewable fuel type breakdown', source: { via: 'dimension', category: 'Energy', dimension: 'fuel_type' } },
  // Waste (3) — divert vs disposal are two slices of one route dimension
  { id: 'c-waste-divert', title: 'Waste diverted from disposal (ton)', source: { via: 'dimension', category: 'Waste', dimension: 'waste_route' } },
  { id: 'c-waste-disposal', title: 'Waste directed to disposal (ton)', source: { via: 'dimension', category: 'Waste', dimension: 'waste_route' } },
  { id: 'c-waste-trend', title: 'Total waste trend by year (ton)', source: { via: 'trend', category: 'Waste', dimension: 'waste_route' } },
  // Water (3)
  { id: 'c-water-withdraw', title: 'Water withdrawal by source (ML)', source: { via: 'dimension', category: 'Water', dimension: 'water_source' } },
  { id: 'c-water-discharge', title: 'Water discharge by destination (ML)', source: { via: 'dimension', category: 'Water', dimension: 'water_source' } },
  { id: 'c-water-trend', title: 'Water usage trend (ML)', source: { via: 'trend', category: 'Water', dimension: 'water_flow' } },
  // Diversity (3)
  { id: 'c-div-gov-gender', title: 'Governance body composition by gender', source: { via: 'dimension', category: 'Diversity & Equal Opportunity', dimension: 'gender' } },
  { id: 'c-div-age', title: 'Employee age group distribution', source: { via: 'dimension', category: 'Diversity & Equal Opportunity', dimension: 'age_band' } },
  { id: 'c-div-salary', title: 'Female-to-male salary ratio by category', source: { via: 'dimension', category: 'Diversity & Equal Opportunity', dimension: 'employee_category' } },
  // Employment (2)
  { id: 'c-emp-new', title: 'New employees by gender & age group', source: { via: 'dimension', category: 'Employment', dimension: 'gender' } },
  { id: 'c-emp-parental', title: 'Parental leave — entitled, took, and returned', source: { via: 'dimension', category: 'Employment', dimension: 'parental_stage' } },
  // OHS (3)
  { id: 'c-ohs-incident', title: 'Occupational safety incidents by year', source: { via: 'dimension', category: 'OHS', dimension: 'incident_type' } },
  { id: 'c-ohs-type', title: 'Permanent vs contract incidents', source: { via: 'dimension', category: 'OHS', dimension: 'employment_status' } },
  { id: 'c-ohs-trend', title: 'Hours worked & accident rate trend', source: { via: 'trend', category: 'OHS', dimension: 'incident_type' } },
  // Training (3)
  { id: 'c-train-gender', title: 'Average training hours by gender', source: { via: 'dimension', category: 'Training & Education', dimension: 'gender' } },
  { id: 'c-train-category', title: 'Average training hours by employee category', source: { via: 'dimension', category: 'Training & Education', dimension: 'employee_category' } },
  { id: 'c-train-trend', title: 'Training hours trend by year', source: { via: 'trend', category: 'Training & Education', dimension: 'gender' } },
]

assert.equal(mockupCharts.length, 27, 'the mockup draws 27 charts (26 canvas + pt-bars)')

const byName = new Map(tabs.map((c) => [c.category_id.name, c]))
for (const chart of mockupCharts) {
  const category = byName.get(chart.source.category)
  assert.ok(category, `${chart.id}: category '${chart.source.category}' missing from payload`)

  if (chart.source.via === 'entities') {
    assert.ok(
      totalsByEntity(category.items).length > 0,
      `${chart.id} (${chart.title}): no entity data to plot`,
    )
    continue
  }

  const series = seriesByDimension(category, chart.source.dimension)
  assert.ok(
    series.length > 0,
    `${chart.id} (${chart.title}): dimension '${chart.source.dimension}' yields no series`,
  )
  // a trend chart needs an x-axis of periods; a breakdown needs at least two members to compare
  if (chart.source.via === 'trend') {
    assert.ok(periodsOf(category.items).length > 0, `${chart.id}: no periods for a trend x-axis`)
  } else {
    assert.ok(series.length >= 2, `${chart.id}: a breakdown needs >=2 members, got ${series.length}`)
  }
}

// ---- REGRESSION: AVERAGE metrics must not be summed across entities ----
// The bug this caught: salary ratios and training hours are `input_type: NUMBER`, so inferring
// the combine rule from the input type summed them into nonsense (a "1.88" salary ratio).
for (const name of ['Diversity & Equal Opportunity', 'Training & Education']) {
  const tab = byName.get(name)!
  const avgItems = tab.items.filter((i) => i.aggregation === 'AVERAGE')
  assert.ok(avgItems.length > 0, `${name}: expected AVERAGE items in the contract`)

  // duplicate every AVERAGE item under a second entity, as All-Entities would return
  const doubled: StrategicInsightGriCategory = {
    ...tab,
    items: [
      ...tab.items,
      ...avgItems.map((i) => ({
        ...i,
        id: `${i.id}-b`,
        entity: { id: 'second-entity', code: 'SDS', name: 'Sintesa Duta Sejahtera' },
      })),
    ],
  }

  for (const dimension of tab.dimensions) {
    const before = seriesByDimension(tab, dimension.key)
    const after = seriesByDimension(doubled, dimension.key)
    for (let i = 0; i < before.length; i++) {
      const b = before[i]!
      const a = after[i]!
      // only assert on series actually made of AVERAGE items
      const members = avgItems.filter((it) => it.labels[dimension.key] === b.key)
      if (members.length === 0) continue
      assert.deepEqual(
        a.data,
        b.data,
        `${name}/${dimension.key}/${b.key}: adding a second entity changed an AVERAGE series ` +
          `(${b.data} -> ${a.data}) — ratios were summed instead of averaged`,
      )
    }
  }
}

// ---- every item declares how it aggregates ----
for (const tab of tabs) {
  for (const item of tab.items) {
    assert.ok(
      ['SUM', 'PERCENTAGE', 'AVERAGE'].includes(item.aggregation),
      `${tab.category_id.name}: item ${item.id} has no/invalid aggregation`,
    )
  }
}

// ---- the two-axis case survives a round trip through the real payload ----
const ohs = tabs.find((c) => c.category_id.name === 'OHS')!
const recordable = ohs.items.filter((i) => i.labels['incident_type'] === 'RECORDABLE')
assert.equal(aggregateItems(recordable), 8, 'OHS recordable, permanent only, from the contract')
// the same items split on the other axis
assert.deepEqual(
  seriesByDimension(ohs, 'employment_status').map((s) => s.name),
  ['Permanent Employee', 'Contract Employee'],
)

// ---- AVERAGE KPIs are not re-summed ----
const diversity = tabs.find((c) => c.category_id.name === 'Diversity & Equal Opportunity')!
const salarySenior = summaryValue(diversity, 'salary_ratio_senior')!
assert.equal(salarySenior.aggregation, 'AVERAGE')
assert.ok(salarySenior.value > 0 && salarySenior.value <= 2, 'a salary ratio, not a sum')

console.log(
  `ok — 8 tabs, ${kpiCount} KPI cards, ${chartCount} dimensions, ${mockupCharts.length} charts traced`,
)

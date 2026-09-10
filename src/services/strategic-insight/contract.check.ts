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
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import {
  aggregateItems,
  orderedCategories,
  periodsOf,
  seriesByDimension,
  summaryValue,
  totalsByEntity,
} from './aggregate.ts'

// fileURLToPath, not .pathname — the path contains a space, which .pathname percent-encodes.
const COLLECTION = fileURLToPath(
  new URL('../../../api/Dashboard/GRI - Quantitative.yml', import.meta.url),
)

// The collection is a Bruno .yml with JSON embedded in a string field, and this repo has no YAML
// parser dependency. Python is already required by the repo's tooling, so shell out rather than
// add one for a single check.
function loadContract(): StrategicInsightGriQuantitativeResponse {
  const out = execFileSync(
    'python3',
    [
      '-c',
      [
        'import yaml,json,sys',
        'd=yaml.safe_load(open(sys.argv[1]))',
        "ex=[e for e in d['examples'] if e['name']=='Contract'][0]",
        "sys.stdout.write(json.dumps(json.loads(ex['response']['body']['data'])['data']))",
      ].join('\n'),
      COLLECTION,
    ],
    { encoding: 'utf8' },
  )
  return JSON.parse(out) as StrategicInsightGriQuantitativeResponse
}

const contract = loadContract()

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

// ---- the two-axis case survives a round trip through the real payload ----
const ohs = tabs.find((c) => c.category_id.name === 'OHS')!
const recordable = ohs.items.filter((i) => i.labels['incident_type'] === 'RECORDABLE')
assert.equal(aggregateItems(recordable), 8, 'OHS recordable, permanent only, from the contract')
// the same items split on the other axis
assert.deepEqual(
  seriesByDimension(ohs, 'employment_status').map((s) => s.name),
  ['Karyawan Tetap', 'Karyawan Kontrak'],
)

// ---- AVERAGE KPIs are not re-summed ----
const diversity = tabs.find((c) => c.category_id.name === 'Diversity & Equal Opportunity')!
const salarySenior = summaryValue(diversity, 'salary_ratio_senior')!
assert.equal(salarySenior.aggregation, 'AVERAGE')
assert.ok(salarySenior.value > 0 && salarySenior.value <= 2, 'a salary ratio, not a sum')

console.log(`ok — 8 tabs, ${kpiCount} KPI cards, ${chartCount} dimension charts`)

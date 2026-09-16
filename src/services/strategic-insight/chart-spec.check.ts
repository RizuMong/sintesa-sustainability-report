// run: node --experimental-strip-types src/services/strategic-insight/chart-spec.check.ts
//
// Feeds the REAL contract (all 8 categories, from api/Dashboard/GRI - Quantitative.yml) through
// chart-spec.ts and asserts the returned cards match docs/dashboard-gri-quantitative-mockup-spec.md
// section 2 (titles, order) and section 4 (grouping rules, AVERAGE not summed, no all-zero cards).
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { orderedCategories } from './aggregate.ts'
import { categoryCaption, chartCardsFor } from './chart-spec.ts'
import { normalizeGriQuantitative } from './normalize.ts'

// fileURLToPath, not .pathname — the path contains a space, which .pathname percent-encodes.
const COLLECTION = fileURLToPath(
  new URL('../../../api/Dashboard/GRI - Quantitative.yml', import.meta.url),
)

// Same loading approach as contract.check.ts: the collection is a Bruno .yml with JSON embedded
// in a string field, and this repo has no YAML parser dependency; Python+PyYAML is already
// required by the repo's tooling.
//
// The committed example is wire-shape (bare `category` string, no `dimensions[]`/`labels{}`) —
// it now matches what the live backend actually sends (verified 2026-09-15), so it must go
// through normalizeGriQuantitative() the same way api.ts does before anything downstream reads
// `category_id`/`dimensions`/`labels`.
function loadContract(): StrategicInsightGriQuantitativeResponse {
  const out = execFileSync(
    'python3',
    [
      '-c',
      [
        'import yaml,json,sys',
        'd=yaml.safe_load(open(sys.argv[1]))',
        "name='Response Dummy'",
        "ex=[e for e in d['examples'] if e['name']==name]",
        "assert ex, f'example {name!r} not found in {sys.argv[1]}'",
        "sys.stdout.write(json.dumps(json.loads(ex[0]['response']['body']['data'])['data']))",
      ].join('\n'),
      COLLECTION,
    ],
    { encoding: 'utf8' },
  )
  const wire = JSON.parse(out) as StrategicInsightGriQuantitativeWireResponse
  return normalizeGriQuantitative(wire).categories
}

const contract = loadContract()
const tabs = orderedCategories(contract)

// Expected card titles per tab, in spec §2 order. The PT-comparison card is included only when
// the contract has more than one entity for that tab (this contract's example has a single
// entity, 'WS', so it is expected to be absent here — chart-spec.ts still emits it whenever a
// real multi-entity payload arrives).
const expectedTitles: Record<string, string[]> = {
  General: [
    'Gender by year',
    'Employment status by year',
    'Employee headcount trend',
    'Gender composition (%)',
    'Non-employee worker type',
    'Employment status composition (%)',
  ],
  Energy: [
    'Energy consumption by year (GJ)',
    'Energy consumption trend',
    'Non-renewable fuel type breakdown',
  ],
  Waste: [
    'Waste diverted from disposal (ton)',
    'Waste directed to disposal (ton)',
    'Total waste trend by year (ton)',
  ],
  Water: [
    'Water withdrawal by source (ML)',
    'Water discharge by destination (ML)',
    'Water usage trend (ML)',
  ],
  'Diversity & Equal Opportunity': [
    'Governance body composition by gender',
    'Employee age group distribution',
    'Female-to-male salary ratio by category',
  ],
  Employment: [
    'New employees by gender & age group',
    'Parental leave — entitled, took, and returned',
  ],
  OHS: [
    'Occupational safety incidents by year',
    'Permanent vs contract incidents',
    'Hours worked & accident rate trend',
  ],
  'Training & Education': [
    'Average training hours by gender',
    'Average training hours by employee category',
    'Training hours trend by year',
  ],
}

const expectedCaptions: Record<string, string> = {
  General: 'Total employees & non-employee workers',
  Energy: 'Energy consumption within the organization',
  Waste: 'Waste management',
  Water: 'Water withdrawal & discharge',
  'Diversity & Equal Opportunity': 'Diversity & equal opportunity',
  Employment: 'Recruitment & parental leave',
  OHS: 'Occupational health & safety',
  'Training & Education': 'Employee training & education',
}

let cardCount = 0
const cardsByTab = new Map<string, ReturnType<typeof chartCardsFor>>()

for (const tab of tabs) {
  const name = tab.category_id.name
  const cards = chartCardsFor(tab)
  cardsByTab.set(name, cards)

  assert.deepEqual(
    cards.map((c) => c.title),
    expectedTitles[name] ?? [],
    `${name}: card titles/order must match the spec`,
  )

  assert.equal(categoryCaption(tab), expectedCaptions[name] ?? '', `${name}: category caption line`)

  for (const c of cards) {
    assert.ok(c.datasets.length >= 1, `${name}/${c.title}: needs at least one dataset`)
    assert.equal(
      c.labels.length,
      c.datasets[0]!.data.length,
      `${name}/${c.title}: labels and first dataset length must match`,
    )
    // Not every individual series has to be nonzero (e.g. one dimension member may genuinely be
    // 0 in a given period) — spec §4 only requires the card as a whole not be all-zero, which
    // chartCardsFor() already enforces by dropping such cards before they reach here.
    assert.ok(
      c.datasets.some((ds) => ds.data.some((v) => v !== 0)),
      `${name}/${c.title}: card is entirely zero, should have been dropped`,
    )
    cardCount++
  }
}

// ---- Water withdrawal vs discharge must differ (different metric_key/water_flow filter) ----
const waterCards = cardsByTab.get('Water')!
const withdrawalCard = waterCards.find((c) => c.title === 'Water withdrawal by source (ML)')!
const dischargeCard = waterCards.find((c) => c.title === 'Water discharge by destination (ML)')!
assert.notDeepEqual(
  withdrawalCard.datasets,
  dischargeCard.datasets,
  'Water withdrawal and discharge cards must carry different data',
)

// ---- salary ratio stays a plausible ratio (AVERAGE honoured, not summed) ----
const diversity = tabs.find((c) => c.category_id.name === 'Diversity & Equal Opportunity')!
const salaryCard = cardsByTab
  .get('Diversity & Equal Opportunity')!
  .find((c) => c.title === 'Female-to-male salary ratio by category')!
for (const ds of salaryCard.datasets) {
  for (const v of ds.data) {
    if (v === 0) continue
    assert.ok(
      v >= 0.5 && v <= 1.5,
      `salary ratio ${v} outside plausible 0.5..1.5 range — looks summed, not averaged`,
    )
  }
}
void diversity // referenced above only for symmetry with contract.check.ts's style

// ---- unknown category falls back to the generic per-dimension renderer ----
const unknown: StrategicInsightGriCategory = {
  category_id: { id: 'x', name: 'Something New' },
  gri_codes: ['999-9'],
  sequence: 99,
  dimensions: [
    {
      key: 'foo',
      name: 'Foo breakdown',
      members: [
        { key: 'A', name: 'A' },
        { key: 'B', name: 'B' },
      ],
    },
  ],
  summary: [],
  items: [
    {
      id: 'i1',
      period: 2025,
      entity: { id: 'e1', code: 'WS', name: 'WS', },
      gri_code: '999-9a',
      metric_key: 'foo_metric',
      metric_name: 'Foo',
      labels: { foo: 'A' },
      description: '',
      value: 10,
      unit: null,
      input_type: 'NUMBER',
      aggregation: 'SUM',
    },
  ],
}
const genericCards = chartCardsFor(unknown)
assert.equal(genericCards.length, 1, 'unknown category: one card per declared dimension')
assert.equal(genericCards[0]!.title, 'Foo breakdown')
assert.equal(categoryCaption(unknown), '', 'unknown category: no caption line')

console.log(`ok — 8 tabs, ${cardCount} chart cards traced, generic fallback verified`)

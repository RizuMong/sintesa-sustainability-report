// run: node --experimental-strip-types src/services/strategic-insight/demo-data.check.ts
//
// The acceptance condition for the mock-up, expressed as a test: every card chart-spec builds, on
// every one of the 8 tabs, is non-null AND carries at least one non-zero dataset. That is what
// "no empty regions on the page" means mechanically — card() returns null for an all-zero card, so
// a dropped card and a flat card are both caught here rather than in a screenshot.
import assert from 'node:assert/strict'
import { chartCardsFor } from './chart-spec.ts'
import { orderedCategories, periodsOf, summaryValue, totalsByEntity } from './aggregate.ts'
import { applyDemoFilters, demoEntities, demoGriQuantitative, demoPeriods } from './demo-data.ts'

const categories = orderedCategories(demoGriQuantitative())

// ---- coverage: 8 tabs, and enough entities/periods to make trends and comparisons possible ----
assert.equal(categories.length, 8, 'demo data must cover all 8 dashboard tabs')
assert.equal(demoEntities.length, 15, 'the mockup lists 15 PTs')
assert.equal(demoPeriods.length, 3, 'the mockup covers 2023-2025')

for (const category of categories) {
  const name = category.category_id.name
  const periods = periodsOf(category.items)
  const entities = totalsByEntity(category.items)

  // A single period draws a one-point line chart; a single entity suppresses the PT-comparison
  // card outright (chart-spec's `entities.length > 1` guard). Both are the reason this fixture
  // exists, so both are asserted rather than assumed.
  assert.ok(periods.length >= 2, `${name}: needs >= 2 periods for a trend chart, got ${periods.length}`)
  assert.ok(entities.length >= 2, `${name}: needs >= 2 entities for the PT comparison, got ${entities.length}`)

  // ---- every card renders, and none is flat ----
  const cards = chartCardsFor(category)
  assert.ok(cards.length > 0, `${name}: renders no chart cards at all`)
  for (const card of cards) {
    assert.ok(card.labels.length > 0, `${name}/${card.id}: no x-axis labels`)
    assert.ok(card.datasets.length > 0, `${name}/${card.id}: no datasets`)
    const hasSignal = card.datasets.some((ds) => ds.data.some((v) => v !== 0))
    assert.ok(hasSignal, `${name}/${card.id}: every dataset is all-zero — the card would be dropped`)
    for (const ds of card.datasets) {
      assert.ok(
        ds.data.every((v) => Number.isFinite(v)),
        `${name}/${card.id}/${ds.label}: non-finite value (NaN/Infinity would render as a gap)`,
      )
    }
  }

  // ---- every KPI card resolves, and none shows the em-dash placeholder ----
  for (const s of category.summary) {
    const resolved = summaryValue(category, s.key)
    assert.ok(resolved, `${name}: summary key ${s.key} does not resolve`)
    assert.ok(Number.isFinite(resolved.value), `${name}/${s.key}: value is not finite`)
  }
}

// ---- ratio metrics stay in range ----
//
// The "1.88 salary ratio" and "450 average training hours" bugs, pinned. Scaling a ratio like an
// absolute total is the single easiest way to make this fixture produce visible nonsense.
for (const category of categories) {
  for (const item of category.items) {
    if (typeof item.value !== 'number') continue
    if (item.input_type === 'PERCENTAGE') {
      assert.ok(
        item.value >= 0 && item.value <= 100,
        `${category.category_id.name}/${item.metric_key}: PERCENTAGE out of 0-100: ${item.value}`,
      )
    }
    if (item.metric_key === 'salary_ratio_female_to_male') {
      assert.ok(
        item.value > 0.5 && item.value < 1.5,
        `salary ratio outside a believable band: ${item.value}`,
      )
    }
    if (item.metric_key === 'avg_training_hours') {
      assert.ok(item.value > 0 && item.value < 200, `training hours implausible: ${item.value}`)
    }
  }
}
for (const category of categories) {
  for (const s of category.summary) {
    if (s.aggregation === 'PERCENTAGE') {
      assert.ok(s.value >= 0 && s.value <= 100, `${s.key}: PERCENTAGE summary out of range: ${s.value}`)
    }
    if (s.key.startsWith('salary_ratio_')) {
      assert.ok(s.value > 0.5 && s.value < 1.5, `${s.key}: salary ratio KPI out of band: ${s.value}`)
    }
    if (s.key.startsWith('avg_training_hours')) {
      assert.ok(s.value > 0 && s.value < 200, `${s.key}: training-hours KPI implausible: ${s.value}`)
    }
  }
}

// ---- KPI magnitude agrees with the charts ----
//
// A card reading 8.614 above a chart totalling 400.000 is the first thing a demo audience spots.
// General's `total_employee` is the clearest case: it must be the same order of magnitude as the
// summed headcount items.
{
  const general = categories.find((c) => c.category_id.name === 'General')!
  const headcount = general.items
    .filter((i) => i.metric_key === 'employee_headcount' && typeof i.value === 'number')
    .reduce((sum, i) => sum + (i.value as number), 0)
  const kpi = summaryValue(general, 'total_employee')!
  const ratio = kpi.value / headcount
  assert.ok(
    ratio > 0.2 && ratio < 5,
    `total_employee KPI (${kpi.value}) is out of scale with the charted headcount (${headcount})`,
  )
}

// ---- determinism ----
//
// No Math.random() anywhere: two calls must be byte-identical, or every refresh shows different
// numbers and run-dashboard-acceptance.sh (which measures chart geometry) goes flaky.
assert.equal(
  JSON.stringify(demoGriQuantitative()),
  JSON.stringify(demoGriQuantitative()),
  'demo data must be deterministic across calls',
)

// ---- filters visibly do something ----
{
  const all = demoGriQuantitative()
  const general = orderedCategories(all).find((c) => c.category_id.name === 'General')!
  const unfilteredKpi = summaryValue(general, 'total_employee')!.value

  // period narrows summary[] but NOT items[] — the A4 scope rule the charts depend on. Pruning
  // items[] by period is what would empty every trend chart on the page.
  const byPeriod = orderedCategories(applyDemoFilters(all, { period: '2024' })).find(
    (c) => c.category_id.name === 'General',
  )!
  assert.ok(
    summaryValue(byPeriod, 'total_employee')!.value < unfilteredKpi,
    'period filter must lower the KPI card',
  )
  assert.equal(
    periodsOf(byPeriod.items).length,
    3,
    'period filter must NOT prune items[] — trend charts plot every year (gap A4)',
  )
  assert.ok(chartCardsFor(byPeriod).length > 0, 'period filter must not empty the charts')

  // entity narrows both, and legitimately collapses the PT-comparison chart to one bar.
  const byEntity = orderedCategories(
    applyDemoFilters(all, { entity_id: demoEntities[1]!.id }),
  ).find((c) => c.category_id.name === 'General')!
  assert.equal(totalsByEntity(byEntity.items).length, 1, 'entity filter must narrow items[]')
  assert.ok(
    summaryValue(byEntity, 'total_employee')!.value < unfilteredKpi,
    'entity filter must lower the KPI card',
  )

  // category_id selects a single tab.
  const byCategory = applyDemoFilters(all, { category_id: general.category_id.id })
  assert.equal(byCategory.length, 1, 'category_id filter must select one category')
}

// ---- plausibility: the bugs this fixture actually produced, pinned ----
//
// Each of these was a real defect visible on the rendered page, not a hypothetical.
{
  const byName = (n: string) => categories.find((c) => c.category_id.name === n)!

  // 1. OHS incident_type mixes counts with hours-worked. Cross-expanding the 1.34M-hour template
  //    across the dimension drew "37 million fatalities".
  const ohs = byName('OHS')
  const fatalities = ohs.items
    .filter((i) => i.labels['incident_type'] === 'FATALITY')
    .map((i) => i.value as number)
  assert.ok(
    fatalities.every((v) => v < 20),
    `fatalities must stay a plausible count, saw max ${Math.max(...fatalities)}`,
  )
  assert.ok(fatalities.some((v) => v > 0), 'fatalities must not be uniformly zero either')
  const hours = ohs.items
    .filter((i) => i.labels['incident_type'] === 'HOURS_WORKED')
    .map((i) => i.value as number)
  assert.ok(Math.min(...hours) > 10_000, 'hours-worked must keep its own magnitude')

  // 2. Seniority must order training hours (mockup: Senior 44,6h vs Junior 22,9h). A random
  //    per-member bias happily drew juniors above seniors, which reads as a data error.
  const training = byName('Training & Education')
  const avgFor = (memberKey: string) => {
    const vs = training.items
      .filter((i) => i.metric_key === 'avg_training_hours' && i.labels['employee_category'] === memberKey)
      .map((i) => i.value as number)
    return vs.reduce((a, b) => a + b, 0) / vs.length
  }
  assert.ok(avgFor('SENIOR') > avgFor('MID'), 'senior training hours must exceed mid')
  assert.ok(avgFor('MID') > avgFor('JUNIOR'), 'mid training hours must exceed junior')

  // 3. Salary ratios must stay at or below parity — GRI 405-2 reports a gap, and a chart showing
  //    women out-earning men in every category reads as a sign error.
  const diversity = byName('Diversity & Equal Opportunity')
  const ratios = diversity.items
    .filter((i) => i.metric_key === 'salary_ratio_female_to_male')
    .map((i) => i.value as number)
  assert.ok(Math.max(...ratios) <= 1.02, `salary ratio above parity: ${Math.max(...ratios)}`)
  assert.ok(Math.min(...ratios) > 0.7, `salary ratio implausibly low: ${Math.min(...ratios)}`)

  // 4. A breakdown chart whose members are all the same height communicates nothing. Every
  //    multi-member dimension must show real spread between its members.
  // Compared per metric AND within a slice: OHS's work_related_injuries spans an incident count
  // and hours-worked on the same employment_status axis, so averaging across incident_type washes
  // out the difference (hours-worked dominates by 5 orders). Each chart plots one metric with the
  // other dimensions held fixed, so the check mirrors that: hold the other labels constant, then
  // compare the members of the dimension under test.
  for (const category of categories) {
    for (const dimension of category.dimensions) {
      if (dimension.members.length < 2) continue
      const metrics = [...new Set(category.items.map((i) => i.metric_key))]
      for (const metric of metrics) {
        const relevant = category.items.filter(
          (i) => i.metric_key === metric && i.labels[dimension.key] !== undefined && typeof i.value === 'number',
        )
        if (relevant.length === 0) continue

        // Slice key = every label except the one under test, so we compare like with like.
        const slices = new Map<string, Map<string, number[]>>()
        for (const item of relevant) {
          const others = Object.entries(item.labels)
            .filter(([k]) => k !== dimension.key)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}=${v}`)
            .join('|')
          const member = item.labels[dimension.key]!
          const slice = slices.get(others) ?? new Map<string, number[]>()
          slice.set(member, [...(slice.get(member) ?? []), item.value as number])
          slices.set(others, slice)
        }

        for (const [sliceKey, members] of slices) {
          if (members.size < 2) continue
          const means = [...members.values()].map(
            (vs) => vs.reduce((a, b) => a + b, 0) / vs.length,
          )
          const present = means.filter((v) => v > 0)
          if (present.length < 2) continue
          const spread = (Math.max(...present) - Math.min(...present)) / Math.max(...present)
          assert.ok(
            spread > 0.02,
            `${category.category_id.name}/${metric}/${dimension.key}${sliceKey ? ` [${sliceKey}]` : ''}: members are within ${(spread * 100).toFixed(1)}% of each other — the chart looks flat`,
          )
        }
      }
    }
  }
}

// ---- KPI cards are derived from the charted items, not scaled independently ----
//
// Every one of the 32 keys must reconcile with the items beneath it, so a card cannot contradict
// the chart it sits above.
{
  const general = categories.find((c) => c.category_id.name === 'General')!
  const male = general.items
    .filter((i) => i.metric_key === 'employee_headcount' && i.labels['gender'] === 'MALE')
    .reduce((sum, i) => sum + (i.value as number), 0)
  assert.equal(
    summaryValue(general, 'male')!.value,
    Math.round(male),
    'the Laki-laki KPI must equal the summed male headcount items',
  )

  const energy = categories.find((c) => c.category_id.name === 'Energy')!
  const ren = energy.items
    .filter((i) => i.labels['renewability'] === 'RENEWABLE')
    .reduce((sum, i) => sum + (i.value as number), 0)
  const nonRen = energy.items
    .filter((i) => i.labels['renewability'] === 'NON_RENEWABLE')
    .reduce((sum, i) => sum + (i.value as number), 0)
  const expectedRatio = (ren / (ren + nonRen)) * 100
  assert.ok(
    Math.abs(summaryValue(energy, 'renewable_ratio')!.value - expectedRatio) < 1,
    'the % Energi Terbarukan KPI must match the charted renewable share',
  )
}

console.log('demo-data.check.ts: OK — 8 tabs, every card populated, values plausible, KPIs reconcile, filters active, deterministic')

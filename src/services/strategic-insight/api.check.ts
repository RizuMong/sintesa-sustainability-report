// run: node --experimental-strip-types src/services/strategic-insight/api.check.ts
//
// Fixture is lifted verbatim from the `Contract` example in api/Dashboard/GRI - Quantitative.yml
// (General + OHS categories). Kept in sync by hand: that file lives in a separate repo
// (~/Projects/vas-api-collection) that isn't importable from here.
import assert from 'node:assert/strict'
import {
  aggregateItems,
  isNumericItem,
  itemsAt,
  orderedCategories,
  periodsOf,
  seriesByDimension,
  summaryValue,
  totalsByEntity,
} from './aggregate.ts'

const WS = { id: 'Ks6BgE75YiQ1', code: 'WS', name: 'Waskita Sintesa' }
const SDS = { id: 'rvl0inOCklFE', code: 'SDS', name: 'Sintesa Duta Sejahtera' }

function item(over: Partial<StrategicInsightGriItem>): StrategicInsightGriItem {
  return {
    id: '1',
    period: 2025,
    entity: WS,
    gri_code: '2-7a',
    metric_key: 'employee_headcount',
    metric_name: 'Employee Headcount',
    labels: {},
    description: '',
    value: 0,
    unit: null,
    input_type: 'NUMBER',
    ...over,
  }
}

const general: StrategicInsightGriCategory = {
  category_id: { id: 'gbqp0oQHcJ5', name: 'General' },
  gri_codes: ['2-7', '2-8'],
  sequence: 1,
  dimensions: [
    {
      key: 'gender',
      name: 'Gender',
      members: [
        { key: 'MALE', name: 'Laki-laki' },
        { key: 'FEMALE', name: 'Perempuan' },
      ],
    },
  ],
  summary: [
    { key: 'total_employee', name: 'Total Karyawan', value: 8614, unit: null, aggregation: 'SUM' },
  ],
  items: [
    item({ id: '1', period: 2024, labels: { gender: 'MALE' }, description: 'Laki-laki', value: 350 }),
    item({ id: '2', period: 2024, labels: { gender: 'FEMALE' }, description: 'Perempuan', value: 510 }),
    item({ id: '3', period: 2025, labels: { gender: 'MALE' }, description: 'Laki-laki', value: 260 }),
    item({ id: '4', period: 2025, labels: { gender: 'FEMALE' }, description: 'Perempuan', value: 490 }),
    item({ id: '5', period: 2025, entity: SDS, labels: { gender: 'MALE' }, description: 'Laki-laki', value: 70 }),
    // a TEXT disclosure rides along in the same items[] — charts must skip it, not NaN on it
    item({
      id: '6',
      gri_code: '2-2',
      input_type: 'TEXT',
      value: 'Mencakup seluruh unit operasional',
      description: 'Cakupan entitas pelaporan',
    }),
  ],
}

// OHS is the case a flat `description` string could not express: two axes at once.
const ohs: StrategicInsightGriCategory = {
  category_id: { id: '6XnLWDcgkx1f', name: 'OHS' },
  gri_codes: ['403-9'],
  sequence: 7,
  dimensions: [
    {
      key: 'incident_type',
      name: 'Jenis Insiden',
      members: [
        { key: 'RECORDABLE', name: 'Kecelakaan tercatat' },
        { key: 'HOURS_WORKED', name: 'Total jam kerja' },
      ],
    },
    {
      key: 'employment_status',
      name: 'Status Karyawan',
      members: [
        { key: 'PERMANENT', name: 'Karyawan Tetap' },
        { key: 'CONTRACT', name: 'Karyawan Kontrak' },
      ],
    },
  ],
  summary: [
    { key: 'recordable_injuries', name: 'Kecelakaan tercatat', value: 11, unit: null, aggregation: 'SUM' },
  ],
  items: [
    item({
      id: '10',
      gri_code: '403-9a',
      labels: { incident_type: 'RECORDABLE', employment_status: 'PERMANENT' },
      value: 8,
    }),
    item({
      id: '11',
      gri_code: '403-9a',
      labels: { incident_type: 'RECORDABLE', employment_status: 'CONTRACT' },
      value: 3,
    }),
  ],
}

// ---- non-numeric disclosures are excluded, not coerced ----
assert.equal(isNumericItem(general.items[0]!), true)
assert.equal(isNumericItem(general.items[5]!), false, 'a TEXT disclosure is not chartable')

// ---- trend x-axis comes from the data, ascending, deduped ----
assert.deepEqual(periodsOf(general.items), [2024, 2025])

// ---- grouping is on labels, never on the display string ----
const male = itemsAt(general.items, 'gender', 'MALE')
assert.deepEqual(male.map((i) => i.id), ['1', '3', '5'])
// the TEXT item carries no `gender` label, so it belongs to no series
assert.equal(itemsAt(general.items, 'gender', 'FEMALE').length, 2)

// ---- aggregation: NUMBER sums ----
assert.equal(aggregateItems(male), 680) // 350 + 260 + 70
assert.equal(aggregateItems([]), 0, 'empty selection -> 0, not NaN')
assert.equal(aggregateItems([general.items[5]!]), 0, 'TEXT-only selection -> 0, not NaN')

// ---- aggregation: PERCENTAGE averages (AC-75 ratio rule) ----
const ratios = [
  item({ id: 'r1', input_type: 'PERCENTAGE', value: 100 }),
  item({ id: 'r2', input_type: 'PERCENTAGE', value: 50 }),
]
assert.equal(aggregateItems(ratios), 75)
// a lone ratio passes through untouched
assert.equal(aggregateItems([ratios[0]!]), 100)

// ---- series: one per declared member, in declared order, one point per period ----
const genderSeries = seriesByDimension(general, 'gender')
assert.deepEqual(genderSeries.map((s) => s.key), ['MALE', 'FEMALE'])
assert.deepEqual(genderSeries.map((s) => s.name), ['Laki-laki', 'Perempuan'])
// MALE: 2024 -> 350, 2025 -> 260 + 70 (both entities)
assert.deepEqual(genderSeries[0]!.data, [350, 330])
assert.deepEqual(genderSeries[1]!.data, [510, 490])
assert.deepEqual(seriesByDimension(general, 'no_such_dimension'), [], 'unknown dimension -> no series')

// ---- the two-axis case: same items split two different ways ----
const byIncident = seriesByDimension(ohs, 'incident_type')
assert.deepEqual(byIncident.map((s) => s.key), ['RECORDABLE', 'HOURS_WORKED'])
assert.deepEqual(byIncident[0]!.data, [11]) // 8 permanent + 3 contract, one period
assert.deepEqual(byIncident[1]!.data, [0]) // declared member with no data -> 0, still charted
const byStatus = seriesByDimension(ohs, 'employment_status')
assert.deepEqual(byStatus.map((s) => s.data), [[8], [3]])

// ---- PT-comparison chart: one bar per entity, first-seen order ----
const totals = totalsByEntity(general.items)
assert.deepEqual(totals.map((t) => t.code), ['WS', 'SDS'])
assert.equal(totals[0]!.value, 1610) // 350 + 510 + 260 + 490, TEXT excluded
assert.equal(totals[1]!.value, 70)

// ---- tabs render in declared order regardless of arrival order ----
assert.deepEqual(
  orderedCategories([ohs, general]).map((c) => c.category_id.name),
  ['General', 'OHS'],
)

// ---- KPI lookup distinguishes "zero" from "not sent" (gap A3) ----
assert.equal(summaryValue(general, 'total_employee')?.value, 8614)
assert.equal(
  summaryValue(general, 'permanent_employee'),
  undefined,
  'an unimplemented KPI key is undefined, not 0',
)

console.log('ok')

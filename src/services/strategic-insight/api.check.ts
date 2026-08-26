// run: node --experimental-strip-types src/services/strategic-insight/api.check.ts
import assert from 'node:assert/strict'
import { aggregateMetricRows } from './aggregate.ts'

const rows: StrategicInsightMetricRow[] = [
  { entity: { id: '1', name: 'PT A' }, period: '2025', value: 100 },
  { entity: { id: '2', name: 'PT B' }, period: '2025', value: 50 },
]

// absolute metric (e.g. total tons of waste, 306-4) -> sum across entities/periods
assert.equal(aggregateMetricRows(rows, false), 150)

// ratio metric (e.g. % renewable energy) -> average across entities/periods (AC-75)
assert.equal(aggregateMetricRows(rows, true), 75)

// single-row selection (a specific entity+period picked) -> value passes through either way
assert.equal(aggregateMetricRows([rows[0]!], false), 100)
assert.equal(aggregateMetricRows([rows[0]!], true), 100)

// no matching rows -> 0, not NaN
assert.equal(aggregateMetricRows([], true), 0)
assert.equal(aggregateMetricRows([], false), 0)

console.log('ok')

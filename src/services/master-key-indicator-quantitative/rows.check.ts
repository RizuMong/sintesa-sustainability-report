// run: node --experimental-strip-types src/services/master-key-indicator-quantitative/rows.check.ts
import assert from 'node:assert/strict'
import { dataRows, isSection, nextSequence, resolveUnit, stampSequences } from './rows.ts'

const section = { type: 'SECTION' as const }
const legacyRow = { type: undefined }
assert.equal(isSection(section), true)
assert.equal(isSection(legacyRow), false)

const rows = [{ type: undefined, id: 1 }, { type: 'SECTION' as const, id: 2 }, { type: undefined, id: 3 }]
assert.deepEqual(dataRows(rows).map((r) => r.id), [1, 3])

const metricUnit = { id: 'm', name: 'Meter' }
const rowUnit = { id: 'r', name: 'Row Unit' }
const uniformUnit = { id: 'u', name: 'Uniform Unit' }
const metric = { unit: metricUnit }

// AC 5 path — no unit_mode on the record falls back to the metric-level unit
assert.deepEqual(resolveUnit({ unit: rowUnit }, metric, undefined, uniformUnit), metricUnit)

assert.deepEqual(resolveUnit({ unit: rowUnit }, metric, 'PER_ROW', uniformUnit), rowUnit)
assert.equal(resolveUnit({ unit: null }, metric, 'PER_ROW', uniformUnit), null)

assert.deepEqual(resolveUnit({ unit: rowUnit }, metric, 'UNIFORM', uniformUnit), uniformUnit)

assert.equal(resolveUnit({ unit: rowUnit }, metric, 'NONE', uniformUnit), null)

// deleted-then-readded row never reuses a dead identity
assert.equal(nextSequence([{ sequence: 1 }, { sequence: 7 }]), 8)

// reorder leaves existing sequences untouched
assert.deepEqual(
  stampSequences([{ sequence: 3 }, { sequence: 1 }]).map((r) => r.sequence),
  [3, 1],
)
// only rows that arrive without one get stamped, using max + 1 upward
assert.deepEqual(
  stampSequences([{ sequence: 5 }, {}, {}]).map((r) => r.sequence),
  [5, 6, 7],
)

console.log('ok')

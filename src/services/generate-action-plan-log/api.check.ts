// run: node --experimental-strip-types src/services/generate-action-plan-log/api.check.ts
import assert from 'node:assert/strict'
import { buildRetriggeredLogRow } from './rules.ts'

// AC-38 + retrigger rule: re-triggering a failed row always appends a Manual-trigger, Success-status row
const row = buildRetriggeredLogRow({ submission_type: 'SDG_ACTION_PLAN', recipient_count: 12 })
assert.equal(row.trigger_type, 'Manual')
assert.equal(row.status, 'Success')
assert.equal(row.submission_type, 'SDG_ACTION_PLAN')
assert.equal(row.recipient_count, 12)
assert.equal(typeof row.timestamp, 'string')

console.log('ok')

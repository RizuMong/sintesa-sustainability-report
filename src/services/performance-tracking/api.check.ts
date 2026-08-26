// run: node --experimental-strip-types src/services/performance-tracking/api.check.ts
import assert from 'node:assert/strict'
import { canNudge, clampCompletion } from './validation.ts'

const overdueRow: TrackingRow = {
  entity: { id: 'e1', name: 'PT A' },
  period: { id: 'p1', name: '2025' },
  submission_type: 'GRI Quantitative',
  completion_percent: 40,
  status: 'Draft',
  is_overdue: true,
  unverified: false,
}

// nudge only for overdue, non-approved rows (AC-68)
assert.equal(canNudge(overdueRow), true)
assert.equal(canNudge({ ...overdueRow, is_overdue: false }), false, 'not overdue -> no nudge')
assert.equal(canNudge({ ...overdueRow, status: 'Approved' }), false, 'approved -> no nudge even if overdue')

// defensive clamp on a possibly-bad backend aggregate
assert.equal(clampCompletion(120), 100)
assert.equal(clampCompletion(-5), 0)
assert.equal(clampCompletion(63), 63)

console.log('ok')

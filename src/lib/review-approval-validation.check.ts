// run: node --experimental-strip-types src/lib/review-approval-validation.check.ts
import assert from 'node:assert/strict'
import { canReject, selectableApprovalIds } from './review-approval-validation.ts'

// reject-requires-notes (AC-60/61)
assert.equal(canReject(''), false)
assert.equal(canReject('   '), false)
assert.equal(canReject('Missing supporting evidence'), true)

// bulk-approve selection filter (AC-62) — only submitted/sent rows are selectable
const rows = [
  { id: '1', flow_status: 'submitted' },
  { id: '2', flow_status: 'draft' },
  { id: '3', flow_status: 'sent' },
  { id: '4', flow_status: 'approved' },
  { id: '5', flow_status: 'rejected' },
]
assert.deepEqual(selectableApprovalIds(rows), ['1', '3'])
assert.deepEqual(selectableApprovalIds([]), [])

console.log('ok')

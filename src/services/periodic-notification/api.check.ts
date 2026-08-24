// run: node --experimental-strip-types src/services/periodic-notification/api.check.ts
import assert from 'node:assert/strict'
import { buildDeactivatePayload, isValidDeadline } from './validation.ts'

// AC-35/37: deadline_month is 1-12, deadline_day is 1-31
assert.equal(isValidDeadline(1, 1), true)
assert.equal(isValidDeadline(12, 31), true)
assert.equal(isValidDeadline(0, 15), false)
assert.equal(isValidDeadline(13, 15), false)
assert.equal(isValidDeadline(6, 0), false)
assert.equal(isValidDeadline(6, 32), false)
assert.equal(isValidDeadline(6.5, 15), false)

// soft-delete rule: deactivate never hard-deletes, only flips status to Inactive
assert.deepEqual(buildDeactivatePayload('notif-1'), { id: 'notif-1', status: 'Inactive' })

console.log('ok')

// run: node --experimental-strip-types src/services/master-period/api.check.ts
import assert from 'node:assert/strict'
import { isDuplicatePeriodYear, toDeactivatedPeriod } from './validation.ts'

const items: MasterPeriod[] = [{ id: '1', year: 2026, status: 'Active', realization_window: 'Open' }]

// uniqueness-validation rule (FSD 1.2 — Year unik, numerik)
assert.equal(isDuplicatePeriodYear(items, 2026), true)
assert.equal(isDuplicatePeriodYear(items, 2026, '1'), false, 'editing itself is not a duplicate')
assert.equal(isDuplicatePeriodYear(items, 2027), false)

// soft-delete-not-hard-delete rule — deactivate flips status, keeps realization_window as-is
const deactivated = toDeactivatedPeriod(items[0]!)
assert.equal(deactivated.status, 'Inactive')
assert.equal(deactivated.id, '1')
assert.equal(deactivated.realization_window, 'Open')

console.log('ok')

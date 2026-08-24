// run: node --experimental-strip-types src/services/master-unit/api.check.ts
import assert from 'node:assert/strict'
import { isDuplicateUnitCode, toDeactivatedUnit } from './validation.ts'

const items: MasterUnit[] = [{ id: '1', name: 'Metric Ton', code: 'ton', category: 'Weight', status: 'Active' }]

// uniqueness-validation rule (AC-02 — Simbol/Code unik)
assert.equal(isDuplicateUnitCode(items, 'ton'), true)
assert.equal(isDuplicateUnitCode(items, 'TON'), true, 'should be case-insensitive')
assert.equal(isDuplicateUnitCode(items, 'ton', '1'), false, 'editing itself is not a duplicate')
assert.equal(isDuplicateUnitCode(items, 'kg'), false)

// soft-delete-not-hard-delete rule (AC-03) — deactivate flips status, keeps the record
const deactivated = toDeactivatedUnit(items[0]!)
assert.equal(deactivated.status, 'Inactive')
assert.equal(deactivated.id, '1')
assert.equal(deactivated.code, 'ton')

console.log('ok')

// run: node --experimental-strip-types src/services/master-gri/api.check.ts
import assert from 'node:assert/strict'
import { isDuplicateGriCode, toDeactivatedGri } from './validation.ts'

const items: MasterGri[] = [
  { id: '1', gri_code: '302-1', gri_series: 'Environmental', disclosure_title: 'Energy consumption', status: 'Active' },
]

// uniqueness-validation rule (AC-8)
assert.equal(isDuplicateGriCode(items, '302-1'), true)
assert.equal(isDuplicateGriCode(items, '302-1', '1'), false, 'editing itself is not a duplicate')
assert.equal(isDuplicateGriCode(items, '305-4'), false)

// soft-delete-not-hard-delete rule (AC-9) — deactivate flips status, keeps the record
const deactivated = toDeactivatedGri(items[0]!)
assert.equal(deactivated.status, 'Inactive')
assert.equal(deactivated.id, '1')
assert.equal(deactivated.gri_code, '302-1')

console.log('ok')

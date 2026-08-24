// run: node --experimental-strip-types src/services/master-pillar/api.check.ts
import assert from 'node:assert/strict'
import { isDuplicatePillarCode, toDeactivatedPillar } from './validation.ts'

const items: MasterPillar[] = [{ id: '1', code: 'ENV', name: 'Environment', status: 'Active' }]

// uniqueness-validation rule (FSD 1.2 — Code unik)
assert.equal(isDuplicatePillarCode(items, 'ENV'), true)
assert.equal(isDuplicatePillarCode(items, 'env'), true, 'should be case-insensitive')
assert.equal(isDuplicatePillarCode(items, 'ENV', '1'), false, 'editing itself is not a duplicate')
assert.equal(isDuplicatePillarCode(items, 'GOV'), false)

// soft-delete-not-hard-delete rule (AC-05) — deactivate flips status, keeps the record
const deactivated = toDeactivatedPillar(items[0]!)
assert.equal(deactivated.status, 'Inactive')
assert.equal(deactivated.id, '1')
assert.equal(deactivated.code, 'ENV')

console.log('ok')

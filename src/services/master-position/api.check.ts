// run: node --experimental-strip-types src/services/master-position/api.check.ts
import assert from 'node:assert/strict'
import { buildDeactivatePayload, computePositionName } from './compute-name.ts'

// computed label rule (FSD 1.5): "PIC Ekonomi - MPP"
assert.equal(computePositionName('PIC', 'Ekonomi', 'MPP'), 'PIC Ekonomi - MPP')
// nullable entity_id (generic cross-entity position) drops the suffix entirely
assert.equal(computePositionName('Executive', 'HR', null), 'Executive HR')
assert.equal(computePositionName('Executive', 'HR'), 'Executive HR')

// soft-delete only — deactivate flips status, never a hard delete
assert.deepEqual(buildDeactivatePayload('pos-1'), { id: 'pos-1', status: 'Inactive' })

console.log('ok')

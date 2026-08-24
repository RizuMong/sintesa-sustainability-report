// run: node --experimental-strip-types src/services/master-entity/master-entity.check.ts
import assert from 'node:assert/strict'
import { resolveRow, toDeactivatePayload, toRow, type MasterEntityRow, type RawMasterEntity } from './mapping.ts'

// --- parent-entity resolution/denormalization (index response already nests {id, name}) ---
const branch: RawMasterEntity = {
  id: 'e-2',
  code: 'JKT',
  entity_type: 'BRANCH',
  parent_entity_id: { id: 'e-1', name: 'PT Sintesa Argo' },
  status: 'Active',
}
const branchRow = toRow(branch)
assert.equal(branchRow.parent_entity_id, 'e-1')
assert.equal(branchRow.parent_entity_name, 'PT Sintesa Argo')
assert.equal(branchRow.type, 'Branch')
assert.equal(branchRow.name, 'JKT')
assert.equal(branchRow.address, '')

// Subsidiary with no parent (AC-06)
const subsidiary: RawMasterEntity = {
  id: 'e-3',
  code: 'SG-AG',
  entity_type: 'SUBSIDIARY',
  parent_entity_id: null,
  status: 'Active',
}
assert.equal(toRow(subsidiary).parent_entity_id, null)

// --- resolveRow: falls back to a lookup when the (guessed) create/update response only echoes the FK id ---
const createResponseWithoutNestedParent: RawMasterEntity = {
  id: 'e-4',
  code: 'MPP',
  entity_type: 'BUSINESS_UNIT',
  parent_entity_id: 'e-1', // flat id, no nested name — simulates our unconfirmed create/update contract
  status: 'Active',
}
const lookupAll = async (): Promise<MasterEntityRow[]> => [
  { ...toRow(branch) },
  { id: 'e-1', parent_entity_id: null, parent_entity_name: null, name: 'PT Sintesa Argo', type: 'Subsidiary', address: '', status: 'Active' },
]
const resolved = await resolveRow(createResponseWithoutNestedParent, lookupAll)
assert.equal(resolved.parent_entity_id, 'e-1')
assert.equal(resolved.parent_entity_name, 'PT Sintesa Argo')
assert.equal(resolved.type, 'Business Unit')

// --- soft-delete only (AC-09): deactivate flips status to Inactive, never removes the record ---
const active: MasterEntity = { id: 'e-5', parent_entity_id: null, name: 'PT Widjajatunggal', type: 'Subsidiary', address: '', status: 'Active' }
const deactivated = toDeactivatePayload(active)
assert.equal(deactivated.status, 'Inactive')
assert.equal(deactivated.id, active.id) // same record, not deleted
assert.deepEqual({ ...deactivated, status: 'Active' }, active) // only status changed

console.log('ok')

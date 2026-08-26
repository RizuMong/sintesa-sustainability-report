// run: node --experimental-strip-types src/services/action-plan-change-request/api.check.ts
import assert from 'node:assert/strict'
import { canSubmitChangeRequest, hasProposedChanges, isChangeRequestNotesValid } from './validation.ts'

// AC-106 — notes required
assert.equal(isChangeRequestNotesValid(''), false)
assert.equal(isChangeRequestNotesValid('   '), false)
assert.equal(isChangeRequestNotesValid('Business realigned to a new site.'), true)

// proposed must differ from existing in >=1 field
const existing = { no_code: 'A-1', key_business_action: 'Plant trees', alignment: 'SDG 15' }
assert.equal(hasProposedChanges(existing, { ...existing }), false, 'identical proposal is not a real change')
assert.equal(
  hasProposedChanges(existing, { ...existing, key_business_action: 'Plant mangroves' }),
  true,
  'a single differing field is enough',
)
assert.equal(
  hasProposedChanges(existing, { no_code: 'A-1' }),
  true,
  'omitting a previously-set field in the proposal is itself a change',
)
assert.equal(hasProposedChanges({}, { alignment: 'SDG 13' }), true, 'a newly-added field counts as a change')

// combined submit guard
assert.equal(canSubmitChangeRequest('', existing, { ...existing, no_code: 'A-2' }), false, 'blocked without notes')
assert.equal(canSubmitChangeRequest('reason', existing, existing), false, 'blocked without an actual change')
assert.equal(canSubmitChangeRequest('reason', existing, { ...existing, no_code: 'A-2' }), true)

console.log('ok')

// run: node --experimental-strip-types src/services/report-plan-realization/api.check.ts
import assert from 'node:assert/strict'
import { canSubmitRealization, isEditableRealization, isRealizationWindowOpen } from './validation.ts'

// AC-96 — Realization Window gate
assert.equal(isRealizationWindowOpen({ id: '1', year: 2026, status: 'Active', realization_window: 'Open' }), true)
assert.equal(isRealizationWindowOpen({ id: '1', year: 2026, status: 'Active', realization_window: 'Closed' }), false)
assert.equal(isRealizationWindowOpen(undefined), false, 'no active period found — treat as closed')

// AC-111/112 — only draft/rejected are editable
assert.equal(isEditableRealization('draft'), true)
assert.equal(isEditableRealization('rejected'), true)
assert.equal(isEditableRealization('submitted'), false)
assert.equal(isEditableRealization('approved'), false)
assert.equal(isEditableRealization('cancelled'), false)

const base = { editable: true, windowOpen: true, inputType: 'Number' as MkiInputType, value: '10', evidenceRequired: false, hasEvidence: false }
assert.equal(canSubmitRealization(base), true)
assert.equal(canSubmitRealization({ ...base, windowOpen: false }), false, 'window closed blocks submit even with a valid value')
assert.equal(canSubmitRealization({ ...base, editable: false }), false, 'submitted/approved rows are never submittable again')
assert.equal(canSubmitRealization({ ...base, evidenceRequired: true, hasEvidence: false }), false, 'evidence Required blocks submit until attached')
assert.equal(canSubmitRealization({ ...base, value: 'abc' }), false, 'invalid Number value blocks submit')

console.log('ok')

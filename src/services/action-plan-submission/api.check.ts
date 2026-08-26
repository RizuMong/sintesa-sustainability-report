// run: node --experimental-strip-types src/services/action-plan-submission/api.check.ts
import assert from 'node:assert/strict'
import { resolveDecisionStatus, skipRequiresJustification } from './validation.ts'

assert.equal(resolveDecisionStatus('Take'), 'Taken')
assert.equal(resolveDecisionStatus('Skip'), 'Skipped')

// AC-93/94 — Skip requires a non-empty Justification textarea
assert.equal(skipRequiresJustification('Skip', ''), false)
assert.equal(skipRequiresJustification('Skip', '   '), false, 'whitespace-only is rejected')
assert.equal(skipRequiresJustification('Skip', 'Budget reallocated to Q3'), true)
assert.equal(skipRequiresJustification('Take', ''), true, 'Take never requires a justification')
assert.equal(skipRequiresJustification(null, ''), true, 'no decision yet — nothing to validate')

console.log('ok')

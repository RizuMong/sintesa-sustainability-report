// run: node --experimental-strip-types src/lib/dynamic-validation.check.ts
// ponytail: reconcile with Stream C at merge — see dynamic-validation.ts header.
import assert from 'node:assert/strict'
import { canSubmit, isAllowedEvidenceFile, isValidNumber, isValidPercentage } from './dynamic-validation.ts'

assert.equal(isValidNumber('42'), true)
assert.equal(isValidNumber('42.5'), true)
assert.equal(isValidNumber('abc'), false, 'rejects alphabetic input')
assert.equal(isValidNumber(''), false)

assert.equal(isValidPercentage('0'), true)
assert.equal(isValidPercentage('100'), true)
assert.equal(isValidPercentage('101'), false, 'out of 0-100 range')
assert.equal(isValidPercentage('-1'), false)
assert.equal(isValidPercentage('abc'), false)

assert.equal(isAllowedEvidenceFile('proof.pdf', 1024), true)
assert.equal(isAllowedEvidenceFile('proof.exe', 1024), false, 'rejects disallowed extension')
assert.equal(isAllowedEvidenceFile('proof.pdf', 5 * 1024 * 1024), false, 'rejects >4MB')
assert.equal(isAllowedEvidenceFile('proof.pdf', 0), false, 'rejects empty file')

assert.equal(canSubmit({ inputType: 'Number', value: '10', evidenceRequired: false, hasEvidence: false }), true)
assert.equal(
  canSubmit({ inputType: 'Number', value: '10', evidenceRequired: true, hasEvidence: false }),
  false,
  'evidence Required blocks submit until a file is attached',
)
assert.equal(canSubmit({ inputType: 'Percentage', value: '150', evidenceRequired: false, hasEvidence: false }), false)
assert.equal(canSubmit({ inputType: 'Boolean', value: 'true', evidenceRequired: false, hasEvidence: false }), true)
assert.equal(canSubmit({ inputType: 'Text', value: '', evidenceRequired: false, hasEvidence: false }), false)
assert.equal(canSubmit({ inputType: 'Text', value: 'note', evidenceRequired: false, hasEvidence: false }), true)

console.log('ok')

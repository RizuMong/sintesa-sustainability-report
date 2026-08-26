// run: node --experimental-strip-types src/services/gri-release/api.check.ts
import assert from 'node:assert/strict'
import { isEditingLocked, validateDisclosuresForPublish } from './validation.ts'

// publish-lock guard (AC-42)
assert.equal(isEditingLocked('Published'), true)
assert.equal(isEditingLocked('Draft'), false)

const question = { title: 'Q1', answer_mode: 'Single' as const, follow_up: '', follow_up_yes: '', follow_up_no: '' }
const baseDisclosure = { id: 'd1', mki_id: 'mki-1', mki_name: 'Energy', gri_code: '302-1', input_type: '', unit: '', evidence: '' as const }

// GRI_QUANT never blocks publish on question count
assert.equal(validateDisclosuresForPublish('GRI_QUANT', [{ ...baseDisclosure, questions: [] }]), null)

// GRI_QUAL requires >=1 question per disclosure (AC-41)
assert.notEqual(validateDisclosuresForPublish('GRI_QUAL', [{ ...baseDisclosure, questions: [] }]), null)
assert.equal(validateDisclosuresForPublish('GRI_QUAL', [{ ...baseDisclosure, questions: [question] }]), null)
assert.equal(
  validateDisclosuresForPublish('GRI_QUAL', [
    { ...baseDisclosure, questions: [question] },
    { ...baseDisclosure, id: 'd2', questions: [] },
  ]),
  'Disclosure "302-1" needs at least one question before publishing.',
)

console.log('ok')

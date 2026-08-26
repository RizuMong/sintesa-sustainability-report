// run: node --experimental-strip-types src/services/evaluate-gri-qualitative/api.check.ts
import assert from 'node:assert/strict'
import { canSubmitGriQualSubmission, isGriQualSubmissionLocked, textareaLabelFor } from './validation.ts'

function question(overrides: Partial<GriQualSubmissionQuestion> = {}): GriQualSubmissionQuestion {
  return {
    id: 'q1',
    title: 'Does the entity have a waste policy?',
    answer_mode: 'Single',
    follow_up: 'Describe the policy',
    follow_up_yes: 'Describe how it is enforced',
    follow_up_no: 'Explain why not',
    answer: null,
    note: '',
    ...overrides,
  }
}

function disclosure(questions: GriQualSubmissionQuestion[]): GriQualSubmissionDisclosure {
  return { id: 'd1', gri_code: '306-4', disclosure_title: 'Waste diverted from disposal', questions }
}

// AC-90 — every question's toggle must be non-null before submit; notes are always optional (AC-91)
assert.equal(canSubmitGriQualSubmission([disclosure([question({ answer: null })])]), false)
assert.equal(canSubmitGriQualSubmission([disclosure([question({ answer: true, note: '' })])]), true)
assert.equal(
  canSubmitGriQualSubmission([disclosure([question({ answer: true }), question({ id: 'q2', answer: null })])]),
  false,
  'one unanswered question in a second disclosure question still blocks submit',
)

// AC-84/AC-111 sibling rule — read-only once submitted, reopens only on reject
assert.equal(isGriQualSubmissionLocked('draft'), false)
assert.equal(isGriQualSubmissionLocked('rejected'), false)
assert.equal(isGriQualSubmissionLocked('submitted'), true)
assert.equal(isGriQualSubmissionLocked('approved'), true)

// AC-87/88/89 — textarea label rules per answer_mode
assert.equal(textareaLabelFor(question({ answer_mode: 'None' })), null)
assert.equal(textareaLabelFor(question({ answer_mode: 'Single', follow_up: 'Static label' })), 'Static label')
assert.equal(
  textareaLabelFor(question({ answer_mode: 'Conditional', answer: true, follow_up_yes: 'Yes label', follow_up_no: 'No label' })),
  'Yes label',
)
assert.equal(
  textareaLabelFor(question({ answer_mode: 'Conditional', answer: false, follow_up_yes: 'Yes label', follow_up_no: 'No label' })),
  'No label',
)
assert.equal(
  textareaLabelFor(question({ answer_mode: 'Conditional', answer: null, follow_up_yes: 'Yes label', follow_up_no: 'No label' })),
  'Yes label',
  'unanswered Conditional question defaults to the Yes label',
)

console.log('ok')

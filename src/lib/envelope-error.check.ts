// run: node --experimental-strip-types src/lib/envelope-error.check.ts
import assert from 'node:assert/strict'
import { envelopeErrorMessage } from './envelope-error.ts'

// plain business-rule failure — envelope message is the toast text
assert.equal(
  envelopeErrorMessage({ message: 'Submission already in flight for this period.', data: null }),
  'Submission already in flight for this period.',
)

// field-level validation — every message shown, not just the first
assert.equal(
  envelopeErrorMessage({
    message: 'Validation failed',
    data: { entity_id: ['Entity is required.'], items: [['Value must be numeric.']] },
  }),
  'Entity is required. Value must be numeric.',
)

// a payload `data` that is not an error bag must not leak into the toast
assert.equal(envelopeErrorMessage({ message: 'ERR_INTERNAL', data: { id: '', count: 3 } }), 'ERR_INTERNAL')

// nothing usable from BE — never show an empty toast
assert.equal(envelopeErrorMessage({ message: '   ', data: [] }), 'Request failed. Please try again.')
assert.equal(envelopeErrorMessage(null), 'Request failed. Please try again.')

console.log('envelope-error.check.ts ok')

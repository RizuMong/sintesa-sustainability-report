// run: node --experimental-strip-types src/lib/http.check.ts
import assert from 'node:assert/strict'
import { envelopeError } from './http.ts'

// error: true returns the message
assert.equal(envelopeError({ error: true, message: 'Field X is required' }), 'Field X is required')

// error: false returns null
assert.equal(envelopeError({ error: false, message: 'ok' }), null)

// missing/undefined body returns null
assert.equal(envelopeError(undefined), null)
assert.equal(envelopeError(null), null)

console.log('ok')

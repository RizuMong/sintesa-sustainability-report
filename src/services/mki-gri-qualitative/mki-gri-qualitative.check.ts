// run: node --experimental-strip-types src/services/mki-gri-qualitative/mki-gri-qualitative.check.ts
import assert from 'node:assert/strict'
import { isLocked, isSnakeCaseCode } from './rules.ts'

// AC-19 — Variable Code must be SNAKE_CASE uppercase
assert.equal(isSnakeCaseCode('GRI_306_WASTE'), true)
assert.equal(isSnakeCaseCode('gri_306'), false, 'lowercase must be rejected')
assert.equal(isSnakeCaseCode('GRI 306'), false, 'spaces must be rejected')
assert.equal(isSnakeCaseCode('GRI-306'), false, 'dashes must be rejected')
assert.equal(isSnakeCaseCode(''), false, 'empty string must be rejected')

// AC-26 — locked indicators can't be deleted; stubbed false until Module 2 (Framework Creator) lands
assert.equal(isLocked({ id: 'any-id' }), false)

console.log('ok')

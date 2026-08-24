// run: node --experimental-strip-types src/services/mki-sdg/mki-sdg.check.ts
import assert from 'node:assert/strict'
import { isLocked, isSnakeCaseCode } from './rules.ts'

// AC-19 — Variable Code must be SNAKE_CASE uppercase
assert.equal(isSnakeCaseCode('KONSUMSI_LISTRIK_OPS'), true)
assert.equal(isSnakeCaseCode('A'), true)
assert.equal(isSnakeCaseCode('konsumsi_listrik'), false, 'lowercase must be rejected')
assert.equal(isSnakeCaseCode('KONSUMSI LISTRIK'), false, 'spaces must be rejected')
assert.equal(isSnakeCaseCode('KONSUMSI-LISTRIK'), false, 'dashes must be rejected')
assert.equal(isSnakeCaseCode('_KONSUMSI'), false, 'cannot start with underscore')
assert.equal(isSnakeCaseCode(''), false, 'empty string must be rejected')

// AC-26 — locked indicators can't be deleted; stubbed false until Module 2 (Framework Creator) lands
assert.equal(isLocked({ id: 'any-id' }), false)

console.log('ok')

// run: node --experimental-strip-types src/lib/dynamic-validation.check.ts
import assert from 'node:assert/strict'
import { isValidNumber, isValidPercentage, isAllowedEvidenceFile, canSubmit } from './dynamic-validation.ts'

// Number — rejects alphabetic
assert.equal(isValidNumber('123'), true)
assert.equal(isValidNumber('12.5'), true)
assert.equal(isValidNumber('-4'), true)
assert.equal(isValidNumber('abc'), false)
assert.equal(isValidNumber('12a'), false)
assert.equal(isValidNumber(''), false)
assert.equal(isValidNumber('  '), false)

// Percentage — number, range 0-100 inclusive
assert.equal(isValidPercentage('0'), true)
assert.equal(isValidPercentage('100'), true)
assert.equal(isValidPercentage('50.5'), true)
assert.equal(isValidPercentage('100.1'), false)
assert.equal(isValidPercentage('-1'), false)
assert.equal(isValidPercentage('abc'), false)

// Evidence file — pdf,jpg,png,docx,csv, max 4MB
assert.equal(isAllowedEvidenceFile('report.pdf', 1024), true)
assert.equal(isAllowedEvidenceFile('report.PDF', 1024), true, 'extension check is case-insensitive')
assert.equal(isAllowedEvidenceFile('report.exe', 1024), false)
assert.equal(isAllowedEvidenceFile('report.pdf', 4 * 1024 * 1024), true, 'exactly 4MB is allowed')
assert.equal(isAllowedEvidenceFile('report.pdf', 4 * 1024 * 1024 + 1), false, 'over 4MB is rejected')
assert.equal(isAllowedEvidenceFile('report.pdf', 0), false, 'empty file is rejected')

// Submit gate — disabled until a required-evidence file is attached
assert.equal(canSubmit('Required', false), false)
assert.equal(canSubmit('Required', true), true)
assert.equal(canSubmit('Optional', false), true)

console.log('ok')

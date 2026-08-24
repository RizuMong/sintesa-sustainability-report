// run: node --experimental-strip-types src/services/master-employee/api.check.ts
import assert from 'node:assert/strict'
import { buildDeactivatePayload, isEmailUnique, isValidEmailFormat } from './validate-email.ts'

const employees = [
  { id: 'e1', email: 'a@mekari.com' },
  { id: 'e2', email: 'b@mekari.com' },
]

// AC-12: duplicate email against another employee is rejected
assert.equal(isEmailUnique(employees, 'a@mekari.com'), false)
assert.equal(isEmailUnique(employees, 'A@Mekari.com'), false) // case-insensitive match
// same email is fine when editing that same record (excludeId)
assert.equal(isEmailUnique(employees, 'a@mekari.com', 'e1'), true)
// a genuinely new email is unique
assert.equal(isEmailUnique(employees, 'c@mekari.com'), true)

assert.equal(isValidEmailFormat('a@mekari.com'), true)
assert.equal(isValidEmailFormat('not-an-email'), false)

// soft-delete only (AC-14) — deactivate flips status, never a hard delete
assert.deepEqual(buildDeactivatePayload('e1'), { id: 'e1', status: 'Inactive' })

console.log('ok')

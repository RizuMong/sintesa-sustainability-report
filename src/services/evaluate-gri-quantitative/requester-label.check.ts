// run: node --experimental-strip-types src/services/evaluate-gri-quantitative/requester-label.check.ts
import assert from 'node:assert/strict'
import { requesterLabel } from './requester-label.ts'

const base = {
  created_by_user: undefined as { id: string; name: string; email: string } | undefined,
  submitted_by: '',
  created_by_project_user: 'proj-user-id',
}

assert.equal(
  requesterLabel({ ...base, created_by_user: { id: '1', name: 'A', email: 'be@mekari.com' }, submitted_by: 'sub@mekari.com' }, 'viewer@mekari.com', true),
  'be@mekari.com',
  'BE email wins over everything',
)

assert.equal(
  requesterLabel({ ...base, submitted_by: 'sub@mekari.com' }, 'viewer@mekari.com', true),
  'sub@mekari.com',
  'submitted_by wins over the viewer email',
)

assert.equal(
  requesterLabel({ ...base }, 'viewer@mekari.com', true),
  'viewer@mekari.com',
  'viewer email used when both BE fields are absent and isOwnContext is true',
)

assert.equal(
  requesterLabel({ ...base }, 'viewer@mekari.com', false),
  'proj-user-id',
  'raw id returned when isOwnContext is false — approver must never see their own email as the requester',
)

assert.equal(
  requesterLabel({ ...base }, undefined, true),
  'proj-user-id',
  'raw id returned when there is no viewer email yet',
)

console.log('requester-label.check.ts OK')

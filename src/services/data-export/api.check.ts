// run: node --experimental-strip-types src/services/data-export/api.check.ts
import assert from 'node:assert/strict'
import { buildExportPayload } from './validation.ts'

// AC-78: status always pinned to Approved, regardless of what's in the filter
assert.deepEqual(buildExportPayload({}), { status: 'Approved' })
assert.deepEqual(buildExportPayload({ period: '', entity: '', category: undefined }), { status: 'Approved' })
assert.deepEqual(buildExportPayload({ period: '2025', entity: 'e1', category: 'SDG' }), {
  status: 'Approved',
  period: '2025',
  entity: 'e1',
  category: 'SDG',
})
// @ts-expect-error status is not settable from the filter — it must always come out 'Approved'
assert.equal(buildExportPayload({ category: 'GRI Disclosure', status: 'Draft' }).status, 'Approved')

console.log('ok')

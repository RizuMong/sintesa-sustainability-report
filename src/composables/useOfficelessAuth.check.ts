// run: node src/composables/useOfficelessAuth.check.ts
import assert from 'node:assert/strict'
import { parseEmbedConfig, statusFromResponse, workflowApiBaseUrl } from './useOfficelessAuth.ts'

assert.deepEqual(parseEmbedConfig('?token=abc&env=development&company_id=42'), {
  token: 'abc',
  env: 'development',
  companyId: '42',
})
assert.deepEqual(parseEmbedConfig(''), { token: null, env: null, companyId: null })

assert.equal(workflowApiBaseUrl('development'), 'https://api-officeless-dev.mekari.com')
assert.equal(workflowApiBaseUrl('production'), 'https://api-officeless.mekari.com')

assert.equal(statusFromResponse({ error: true, message: 'ERR_TOKEN_EXPIRED' }, 200), 'expired')
assert.equal(statusFromResponse({ error: true, message: 'ERR_UNAUTHORIZED' }, 200), 'unauthorized')
assert.equal(statusFromResponse(null, 401), 'unauthorized')
assert.equal(statusFromResponse({ error: false }, 200), 'ok')

console.log('ok')
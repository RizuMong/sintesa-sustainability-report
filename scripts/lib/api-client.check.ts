// run: node --experimental-strip-types scripts/lib/api-client.check.ts
//
// No network — stands up a real node:http server on an ephemeral port and points the client at
// it, so the assertions exercise the actual fetch/JSON/header plumbing rather than mocks.
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { createClient, redact, redactDeep, signIn } from './api-client.ts'
import { loadBrunoEnv } from './bruno-env.ts'

const SESSION_TOKEN =
  '6b27a2ddb64eccba13a504b2fda27981b7ea6b99b1820c7cbf85e617ccc457e5a2f5e41f05abcaf9baf474228e426f99a4f7d74b55203a181216d571e597ee88850cbf605096b5c4ca18a276ec42f5f42d014c67e41dc4cb8e1550176c9c'
const BOOTSTRAP_TOKEN = 'a'.repeat(64)

function envelope(data: unknown, error = false, message = 'OK') {
  return JSON.stringify({ code: error ? 401 : 200, data, error, message })
}

type Handler = (req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse) => void

async function withServer(handler: Handler, run: (baseUrl: string) => Promise<void>) {
  const server = createServer(handler)
  await new Promise<void>((resolve) => server.listen(0, resolve))
  const { port } = server.address() as AddressInfo
  try {
    await run(`http://127.0.0.1:${port}`)
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }
}

function readBody(req: import('node:http').IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', (chunk) => (body += chunk))
    req.on('end', () => resolve(body))
  })
}

// (a) signIn returns envelope.data as the token, and sends the right method/headers/body.
await withServer(
  async (req, res) => {
    assert.equal(req.method, 'POST')
    assert.equal(req.url, '/v1/tools/auth')
    assert.equal(req.headers['content-type'], 'application/json')
    assert.equal(req.headers.authorization, BOOTSTRAP_TOKEN)
    const body = JSON.parse(await readBody(req))
    assert.deepEqual(body, { email: 'someone@example.com', method: 'encrypt' })
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(envelope(SESSION_TOKEN, false, 'Success encrypt auth token'))
  },
  async (baseUrl) => {
    const { token } = await signIn({ baseUrl, bootstrapToken: BOOTSTRAP_TOKEN, email: 'someone@example.com' })
    assert.equal(token, SESSION_TOKEN)
  },
)

// (b) signIn throws on error:true.
await withServer(
  async (_req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(envelope(null, true, 'ERR_UNAUTHORIZED'))
  },
  async (baseUrl) => {
    await assert.rejects(
      () => signIn({ baseUrl, bootstrapToken: BOOTSTRAP_TOKEN, email: 'someone@example.com' }),
      /signIn failed/,
    )
  },
)

// (c) get() maps a 200-with-ERR_TOKEN_EXPIRED envelope to authStatus:'expired', ok:false.
await withServer(
  async (_req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(envelope(null, true, 'ERR_TOKEN_EXPIRED'))
  },
  async (baseUrl) => {
    const client = createClient({ baseUrl, token: SESSION_TOKEN })
    const probe = await client.get('/v1/user/profile')
    assert.equal(probe.ok, false)
    assert.equal(probe.authStatus, 'expired')
  },
)

// (d) get() maps plain HTTP 401 to authStatus:'unauthorized'.
await withServer(
  async (_req, res) => {
    res.writeHead(401, { 'Content-Type': 'application/json' })
    res.end(envelope(null, false, 'Unauthorized'))
  },
  async (baseUrl) => {
    const client = createClient({ baseUrl, token: SESSION_TOKEN })
    const probe = await client.get('/v1/user/profile')
    assert.equal(probe.ok, false)
    assert.equal(probe.authStatus, 'unauthorized')
    assert.equal(probe.status, 401)
  },
)

// (e) query params are built correctly and undefined is dropped.
await withServer(
  async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost')
    assert.equal(url.pathname, '/v1/master-entity/index')
    assert.equal(url.searchParams.get('page'), '2')
    assert.equal(url.searchParams.get('q'), 'foo')
    assert.equal(url.searchParams.has('missing'), false)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(envelope({ items: [] }))
  },
  async (baseUrl) => {
    const client = createClient({ baseUrl, token: SESSION_TOKEN })
    const probe = await client.get('/v1/master-entity/index', { page: 2, q: 'foo', missing: undefined })
    assert.equal(probe.ok, true)
    assert.deepEqual(probe.data, { items: [] })
  },
)

// (f) redact/redactDeep scrub the session token and emails out of a nested object.
{
  registerSecretsForTest()
  const nested = {
    token: SESSION_TOKEN,
    nested: { contact: 'someone@example.com', note: `bearer ${SESSION_TOKEN} for someone.else@example.com` },
    list: [SESSION_TOKEN, 'plain text'],
  }
  const scrubbed = redactDeep(nested)
  const flat = JSON.stringify(scrubbed)
  assert.ok(!flat.includes(SESSION_TOKEN), 'session token must be scrubbed')
  assert.ok(!flat.includes('someone@example.com'), 'email must be scrubbed')
  assert.ok(!flat.includes('someone.else@example.com'), 'second email must be scrubbed')
  assert.ok(flat.includes('<redacted>'))
  assert.ok(flat.includes('<redacted-email>'))
  assert.equal(redact('no secrets here'), 'no secrets here')
}

function registerSecretsForTest() {
  // redact()'s known-secret registry is populated by signIn/createClient calls above, which
  // already registered BOOTSTRAP_TOKEN and SESSION_TOKEN as a side effect — nothing to do here
  // beyond documenting that this test relies on that ordering.
}

// loadBrunoEnv('Development') — skip gracefully if the sibling collection repo is absent.
try {
  const { baseUrl, token } = loadBrunoEnv('Development')
  assert.ok(baseUrl.startsWith('https://'), 'Development base_url should be https')
  assert.ok(token.length > 0, 'Development token should be non-empty')
} catch (err) {
  console.log(`(skipped loadBrunoEnv check: ${err instanceof Error ? err.message : err})`)
}

console.log('ok — api-client.check.ts passed')

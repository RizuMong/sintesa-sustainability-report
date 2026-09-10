// Acceptance harness for the GRI Quantitative dashboard.
//
// Serves the REAL contract examples out of api/Dashboard/*.yml on the port the app's own
// workflowApiBaseUrl() points at, so the actual app (real router, real Tanstack Query, real
// axios envelope handling, real Pixel 3 components) renders against the real payload shape.
// Nothing about the page is stubbed — only the network origin is.
//
// run: node --experimental-strip-types scripts/mock-api-server.ts [port]
//
// Serves HTTPS when .temp/certs/{cert,key}.pem exist, so the browser can reach it at the app's
// real https://api-officeless-dev.mekari.com origin via a --host-resolver-rules remap.
import { createServer as createHttpServer } from 'node:http'
import { createServer as createHttpsServer } from 'node:https'
import { execFileSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const PORT = Number(process.argv[2] ?? 8787)

function loadExample(file: string, exampleName: string): unknown {
  const path = fileURLToPath(new URL(`../api/${file}`, import.meta.url))
  const out = execFileSync(
    'python3',
    [
      '-c',
      [
        'import yaml,json,sys',
        'd=yaml.safe_load(open(sys.argv[1]))',
        'name=sys.argv[2]',
        "ex=[e for e in d['examples'] if e['name']==name]",
        "ex=ex[0] if ex else d['examples'][0]",
        "sys.stdout.write(json.dumps(json.loads(ex['response']['body']['data'])['data']))",
      ].join('\n'),
      path,
      exampleName,
    ],
    { encoding: 'utf8' },
  )
  return JSON.parse(out)
}

const griQuantitative = loadExample('Dashboard/GRI - Quantitative.yml', 'Contract')

// master-entity / master-period feed the two filter selects. The entity payload uses the RAW
// backend shape (uppercase entity_type, nested parent_entity_id) so it exercises the real
// toRow() mapping rather than bypassing it.
const entities = [
  { id: 'e1', code: 'WS', name: 'Widjajatunggal Sejahtera', entity_type: 'SUBSIDIARY', parent_entity_id: null, status: 'Active' },
  { id: 'e2', code: 'SDS', name: 'Sintesa Duta Sejahtera', entity_type: 'SUBSIDIARY', parent_entity_id: null, status: 'Active' },
]
const periods = [
  { id: 'p1', year: 2024, status: 'Active' },
  { id: 'p2', year: 2025, status: 'Active' },
]

function envelope(data: unknown) {
  return JSON.stringify({ code: 200, data, error: false, message: 'OK' })
}

const handler = (req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', '*')
  res.setHeader('Content-Type', 'application/json')
  if (req.method === 'OPTIONS') return res.writeHead(204).end()

  const path = url.pathname
  if (path.endsWith('/v1/strategic-insight/gri-quantitative')) {
    return res.end(envelope(griQuantitative))
  }
  if (path.endsWith('/v1/master-entity/index')) return res.end(envelope(entities))
  if (path.endsWith('/v1/master-period/index')) return res.end(envelope(periods))
  if (path.endsWith('/v1/master-category/index')) return res.end(envelope([]))

  res.writeHead(404).end(envelope(null))
}

const certDir = fileURLToPath(new URL('../.temp/certs/', import.meta.url))
const useTls = existsSync(`${certDir}cert.pem`)

const server = useTls
  ? createHttpsServer(
      { cert: readFileSync(`${certDir}cert.pem`), key: readFileSync(`${certDir}key.pem`) },
      handler,
    )
  : createHttpServer(handler)

server.listen(PORT, () => {
  const categories = griQuantitative as { category_id: { name: string } }[]
  console.log(
    `mock api on :${PORT} (${useTls ? 'https' : 'http'}) — serving ${categories.length} categories`,
  )
})

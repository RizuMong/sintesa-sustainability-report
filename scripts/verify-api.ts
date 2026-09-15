// Backend API verification harness — what does the real backend actually answer?
//
// run: node --experimental-strip-types scripts/verify-api.ts [flags]
//
//   --env <name>        Bruno environment to read base_url/bootstrap token from (default Development)
//   --email <address>   account to sign in as (default rizki.haddi@mekari.com, per api/Auth/Auth Low-code.yml)
//   --sdg               additionally probe /v1/strategic-insight/sdg (shape unverified, gap G2)
//   --out <dir>         write redacted raw dumps here (default .temp/api-verify/<timestamp>, gitignored)
//   --no-out            skip writing dumps
//   --verbose           print every finding, not just errors and a warning count
//   --period/-entity/-category  override the filter probes' values
//
// Distinct from scripts/mock-api-server.ts: that one SERVES the committed contract example so the
// app can render offline. This one CALLS the live backend and reports how far its answer drifts
// from that same committed example — the two share the contract, from opposite sides.
//
// GET-only. There is no mutating path in this script at all; adding one needs an explicit flag and
// a second pair of eyes, because this points at a shared dev backend other people are using.
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { loadBrunoEnv } from './lib/bruno-env.ts'
import { createClient, redactDeep, signIn, type Probe } from './lib/api-client.ts'
import {
  diffFilterScope,
  diffGriQuantitative,
  formatDiffReport,
  loadContractExample,
  type DiffReport,
} from './lib/gri-contract-diff.ts'

interface Flags {
  env: string
  email: string
  sdg: boolean
  out: string | null
  verbose: boolean
  period: string
  entityId: string
  category: string
}

function parseFlags(argv: string[]): Flags {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const flags: Flags = {
    env: 'Development',
    email: 'rizki.haddi@mekari.com',
    sdg: false,
    out: fileURLToPath(new URL(`../.temp/api-verify/${stamp}`, import.meta.url)),
    verbose: false,
    // Defaults lifted from the disabled query params in api/Dashboard/GRI - Quantitative.yml, so the
    // filter probes exercise values the backend team themselves nominated as realistic.
    period: '2025',
    entityId: 'Ks6BgE75YiQ1',
    // BE-confirmed 2026-09-15: the filter is `category`, a bare category NAME — BE stores GRI
    // Quantitative categories without an id, so there is no category_id to filter on.
    category: 'General',
  }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]!
    const next = () => {
      const value = argv[i + 1]
      if (value === undefined) throw new Error(`${arg} needs a value`)
      i += 1
      return value
    }
    if (arg === '--env') flags.env = next()
    else if (arg === '--email') flags.email = next()
    else if (arg === '--sdg') flags.sdg = true
    else if (arg === '--out') flags.out = next()
    else if (arg === '--no-out') flags.out = null
    else if (arg === '--verbose' || arg === '-v') flags.verbose = true
    else if (arg === '--period') flags.period = next()
    else if (arg === '--entity') flags.entityId = next()
    else if (arg === '--category') flags.category = next()
    else throw new Error(`unknown flag ${arg}`)
  }
  return flags
}

interface ProbeSpec {
  name: string
  path: string
  params: Record<string, string | undefined>
}

function probeSpecs(flags: Flags): ProbeSpec[] {
  // One probe per filter axis, then the combination. The axes are probed separately because the
  // collection's SCOPE RULE is per-axis: each is documented to narrow summary[] while leaving
  // items[] whole, and a backend can easily get that right for one axis and wrong for another.
  return [
    { name: 'unfiltered', path: '/v1/strategic-insight/gri-quantitative', params: {} },
    { name: `period=${flags.period}`, path: '/v1/strategic-insight/gri-quantitative', params: { period: flags.period } },
    { name: 'entity_id', path: '/v1/strategic-insight/gri-quantitative', params: { entity_id: flags.entityId } },
    { name: 'category', path: '/v1/strategic-insight/gri-quantitative', params: { category: flags.category } },
    {
      name: 'all three',
      path: '/v1/strategic-insight/gri-quantitative',
      params: { period: flags.period, entity_id: flags.entityId, category: flags.category },
    },
  ]
}

function line(char = '─'): string {
  return char.repeat(78)
}

// The collection ships two examples: `Response Dummy` and `200`. As of 2026-09-15 BOTH are
// wire-shape (bare `category` string, no `dimensions[]`/`labels{}`) — `Response Dummy` was
// previously the enriched/normative example (dimensions, labels, full envelope) but has been
// reverted to match what the live backend actually sends. There is no enriched example left in
// the collection at all; the proposed contract in docs/dashboard-gri-quantitative-api-gaps.md is
// now aspirational only, not modeled by any committed example. If the live answer matches this
// wire shape, "8 shape errors" is a misleading way to say "this endpoint has not been migrated to
// dimensions/labels yet" — one sentence beats eight findings, so name it explicitly.
function legacyShapeVerdict(live: unknown): string | null {
  const categories = Array.isArray(live) ? (live as Record<string, unknown>[]) : []
  if (categories.length === 0) return null
  const looksLegacy = categories.every(
    (c) => c && typeof c === 'object' && typeof c.category === 'string' && c.dimensions === undefined,
  )
  if (!looksLegacy) return null
  try {
    const legacy = loadContractExample('200')
    const identical = JSON.stringify(legacy) === JSON.stringify(live)
    return identical
      ? 'live payload is BYTE-IDENTICAL to the collection\'s `200` example'
      : 'live payload is the legacy/wire shape (no `dimensions[]`/`labels{}`), though not identical to the `200` example'
  } catch {
    return 'live payload is the legacy/wire shape (no `dimensions[]`/`labels{}`) — both committed examples now ship this shape'
  }
}

// A filter that changes nothing is not caught by the scope rule — diffFilterScope only asserts
// items[] was NOT narrowed. But `summary[]` is documented to narrow, so a filtered response that
// equals the unfiltered one byte-for-byte means the query param is being ignored outright, which
// is the single most consequential thing this harness can tell the backend team.
function filterEffect(unfiltered: unknown, filtered: unknown): 'ignored' | 'applied' {
  return JSON.stringify(unfiltered) === JSON.stringify(filtered) ? 'ignored' : 'applied'
}

function transportLine(name: string, probe: Probe<unknown>): string {
  const verdict = probe.ok ? 'OK  ' : 'FAIL'
  const detail = probe.ok ? '' : `  ${probe.error ?? ''} [auth: ${probe.authStatus}]`
  return `  ${verdict} ${name.padEnd(18)} HTTP ${String(probe.status).padEnd(4)} ${String(probe.durationMs).padStart(5)}ms${detail}`
}

async function main(): Promise<number> {
  const flags = parseFlags(process.argv.slice(2))
  const { baseUrl, token: bootstrapToken } = loadBrunoEnv(flags.env)

  console.log(line('='))
  console.log(`Backend API verification — env ${flags.env}`)
  console.log(line('='))

  // Sign in first and let this throw: every probe below needs the session token, so a failure here
  // is not a finding to report, it is the end of the run.
  const { token } = await signIn({ baseUrl, bootstrapToken, email: flags.email })
  console.log(`\nSign-in  POST /v1/tools/auth (encrypt)  ->  session token acquired`)

  const client = createClient({ baseUrl, token })
  const profile = await client.get('/v1/user/profile')
  console.log(transportLine('user/profile', profile))

  console.log(`\nTransport — GET /v1/strategic-insight/gri-quantitative`)
  const specs = probeSpecs(flags)
  const results: { spec: ProbeSpec; probe: Probe<unknown> }[] = []
  for (const spec of specs) {
    const probe = await client.get(spec.path, spec.params)
    results.push({ spec, probe })
    console.log(transportLine(spec.name, probe))
  }

  const sdg = flags.sdg ? await client.get('/v1/strategic-insight/sdg') : null
  if (sdg) {
    console.log(`\nTransport — GET /v1/strategic-insight/sdg`)
    console.log(transportLine('sdg', sdg))
  }

  const baseline = results[0]!.probe
  let errors = baseline.ok ? 0 : 1
  const reports: { name: string; report: DiffReport }[] = []

  if (baseline.ok && baseline.data) {
    const contract = loadContractExample()
    console.log(`\n${line()}\nContract diff — live vs api/Dashboard/GRI - Quantitative.yml (Response Dummy)\n${line()}`)
    const legacy = legacyShapeVerdict(baseline.data)
    if (legacy) {
      console.log(`  HEADLINE: ${legacy}.`)
      console.log(`            The endpoint has NOT been migrated to the normative contract. Every`)
      console.log(`            shape error below is one symptom of that single fact, not 8 separate bugs.`)
      console.log()
    }
    const report = diffGriQuantitative(baseline.data, { contract })
    reports.push({ name: 'unfiltered', report })
    console.log(formatDiffReport(report, { verbose: flags.verbose }))
    errors += report.summary.errors

    console.log(`\n${line()}\nFilter behaviour — do the query params do anything, and is the scope rule (A4) held?\n${line()}`)
    let ignored = 0
    for (const { spec, probe } of results.slice(1)) {
      if (!probe.ok || !probe.data) {
        console.log(`  SKIP ${spec.name} — request failed`)
        errors += 1
        continue
      }
      const effect = filterEffect(baseline.data, probe.data)
      if (effect === 'ignored') ignored += 1
      const scope = diffFilterScope(baseline.data, probe.data, spec.params)
      reports.push({ name: spec.name, report: scope })
      errors += scope.summary.errors
      console.log(`\n  ${spec.name.padEnd(14)} param ${effect.toUpperCase()}`)
      console.log(formatDiffReport(scope, { verbose: flags.verbose }))
    }
    if (ignored > 0) {
      // Not counted as an error: the scope rule as written only forbids narrowing items[], and an
      // unimplemented filter is a known state of this endpoint rather than a contract violation.
      // It is still the first thing to tell the backend team, so it gets called out loudly.
      console.log(
        `\n  NOTE: ${ignored}/${results.length - 1} filter probes returned a byte-identical payload —`,
      )
      console.log(`        those query params are currently ignored, so summary[] never narrows (gap A4).`)
    }
  }

  if (flags.out) {
    mkdirSync(flags.out, { recursive: true })
    for (const { spec, probe } of results) {
      const file = `${flags.out}/gri-${spec.name.replace(/[^a-z0-9]+/gi, '-')}.json`
      writeFileSync(file, JSON.stringify(redactDeep(probe), null, 2))
    }
    if (sdg) writeFileSync(`${flags.out}/sdg.json`, JSON.stringify(redactDeep(sdg), null, 2))
    writeFileSync(`${flags.out}/findings.json`, JSON.stringify(redactDeep(reports), null, 2))
    console.log(`\nRaw redacted dumps: ${flags.out}`)
  }

  console.log(`\n${line('=')}`)
  console.log(errors === 0 ? 'PASS — backend matches the committed contract' : `FAIL — ${errors} error(s); see above`)
  console.log(line('='))
  return errors === 0 ? 0 : 1
}

main().then(
  (code) => process.exit(code),
  (error: unknown) => {
    console.error(`\nverify-api: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(2)
  },
)

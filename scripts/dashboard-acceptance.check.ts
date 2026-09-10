// Acceptance check for the GRI Quantitative dashboard — drives headless Chrome over CDP
// against the REAL running app (vite dev) and the REAL contract payload (mock-api-server.ts,
// which replays api/Dashboard/GRI - Quantitative.yml). No component is stubbed; only the
// network origin is remapped, via Chrome's --host-resolver-rules.
//
// This is the check that answers "does the page actually render", which a typecheck and the
// pure-logic checks cannot. It asserts against the mockup spec (docs/…-mockup-spec.md §2):
// 8 tabs, the right KPI counts, the right chart titles per tab, canvases that actually painted,
// and zero console errors — then clicks through every tab.
//
// run: node --experimental-strip-types scripts/dashboard-acceptance.check.ts <appUrl>
import assert from 'node:assert/strict'

const APP_URL = process.argv[2] ?? 'http://localhost:5199'
const PAGE = `${APP_URL}/dashboard/gri-quantitative?token=devtoken&env=development&company_id=1`

// ---- minimal CDP client over the DevTools websocket ----
// Node 22+ ships a global WebSocket, so this needs no dependency.
async function connect(wsUrl: string) {
  const ws = new WebSocket(wsUrl)
  await new Promise<void>((res, rej) => {
    ws.addEventListener('open', () => res(), { once: true })
    ws.addEventListener('error', (e) => rej(new Error(`ws error: ${String(e)}`)), { once: true })
  })
  let id = 0
  const pending = new Map<number, { res: (v: any) => void; rej: (e: Error) => void }>()
  const events: { method: string; params: any }[] = []
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(String(ev.data))
    if (msg.id !== undefined) {
      const p = pending.get(msg.id)
      if (!p) return
      pending.delete(msg.id)
      if (msg.error) p.rej(new Error(JSON.stringify(msg.error)))
      else p.res(msg.result)
    } else {
      events.push({ method: msg.method, params: msg.params })
    }
  })
  const send = (method: string, params: Record<string, unknown> = {}) =>
    new Promise<any>((res, rej) => {
      const myId = ++id
      pending.set(myId, { res, rej })
      ws.send(JSON.stringify({ id: myId, method, params }))
    })
  return { send, events, close: () => ws.close() }
}

async function evaluate(client: Awaited<ReturnType<typeof connect>>, expression: string) {
  const r = await client.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  })
  if (r.exceptionDetails) {
    throw new Error(`page eval threw: ${r.exceptionDetails.exception?.description ?? ''}`)
  }
  return r.result.value
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// ---- expected layout, transcribed from docs/dashboard-gri-quantitative-mockup-spec.md §2 ----
const EXPECTED: Record<string, { kpis: number; charts: string[] }> = {
  General: {
    kpis: 5,
    charts: [
      'Gender per tahun',
      'Status karyawan per tahun',
      'Tren jumlah karyawan',
      'Komposisi gender (%)',
      'Tipe pekerja non-karyawan',
      'Komposisi status karyawan (%)',
    ],
  },
  Energy: {
    kpis: 3,
    charts: [
      'Konsumsi energi per tahun (GJ)',
      'Tren konsumsi energi',
      'Breakdown jenis bahan bakar non-renewable',
    ],
  },
  Waste: {
    kpis: 4,
    charts: [
      'Limbah dialihkan dari pembuangan (ton)',
      'Limbah dibuang (ton)',
      'Tren total limbah per tahun (ton)',
    ],
  },
  Water: {
    kpis: 4,
    charts: [
      'Penarikan air per sumber (ML)',
      'Pembuangan air per tujuan (ML)',
      'Tren penggunaan air (ML)',
    ],
  },
  'Diversity & Equal Opportunity': {
    kpis: 4,
    charts: [
      'Komposisi governance bodies berdasarkan gender',
      'Distribusi kelompok umur karyawan',
      'Rasio gaji perempuan terhadap laki-laki per kategori',
    ],
  },
  Employment: {
    kpis: 4,
    charts: [
      'Karyawan baru berdasarkan gender & kelompok usia',
      'Cuti orang tua — berhak, diambil, dan kembali',
    ],
  },
  OHS: {
    kpis: 4,
    charts: [
      'Insiden keselamatan kerja per tahun',
      'Insiden tetap vs kontrak',
      'Tren jam kerja & tingkat kecelakaan',
    ],
  },
  'Training & Education': {
    kpis: 4,
    charts: [
      'Rata-rata jam pelatihan per gender',
      'Rata-rata jam pelatihan per kategori karyawan',
      'Tren jam pelatihan per tahun',
    ],
  },
}

const targets = await fetch(`http://localhost:9222/json/list`).then((r) => r.json())
const page = targets.find((t: any) => t.type === 'page')
assert.ok(page, 'no headless chrome page target found on :9222')

const client = await connect(page.webSocketDebuggerUrl)
await client.send('Runtime.enable')
await client.send('Page.enable')
await client.send('Log.enable')

const consoleErrors: string[] = []

await client.send('Page.navigate', { url: PAGE })
await sleep(6000)

// collect console errors + page exceptions that arrived as events
for (const e of client.events) {
  if (e.method === 'Runtime.consoleAPICalled' && (e.params.type === 'error' || e.params.type === 'warning')) {
    const text = (e.params.args ?? []).map((a: any) => a.value ?? a.description ?? '').join(' ')
    if (text.trim()) consoleErrors.push(`${e.params.type}: ${text}`)
  }
  if (e.method === 'Runtime.exceptionThrown') {
    consoleErrors.push(`exception: ${e.params.exceptionDetails?.exception?.description ?? 'unknown'}`)
  }
  if (e.method === 'Log.entryAdded' && e.params.entry.level === 'error') {
    consoleErrors.push(`log: ${e.params.entry.text}`)
  }
}

// ---- 1. the app mounted at all ----
const mounted = await evaluate(client, `document.querySelector('#app')?.children.length > 0`)
assert.ok(mounted, 'app root rendered nothing — the auth gate or a runtime error blocked it')

// ---- 2. the 8 tabs from the contract are on screen, in mockup order ----
const tabLabels: string[] = await evaluate(
  client,
  `Array.from(document.querySelectorAll('[role="tab"]')).map(t => t.textContent.trim())`,
)
assert.deepEqual(
  tabLabels,
  Object.keys(EXPECTED),
  `tab strip does not match the mockup. saw: ${JSON.stringify(tabLabels)}`,
)

// ---- 3. click through every tab and verify its KPIs + chart cards ----
const observed: Record<string, { kpis: number; charts: string[]; painted: number; clipped: number }> = {}

for (let i = 0; i < tabLabels.length; i++) {
  await evaluate(client, `document.querySelectorAll('[role="tab"]')[${i}].click()`)
  await sleep(1200)

  const snapshot = await evaluate(
    client,
    `(() => {
      const titles = Array.from(document.querySelectorAll('h2')).map(h => h.textContent.trim());
      const canvases = Array.from(document.querySelectorAll('canvas'));
      // a canvas that painted has at least one non-transparent pixel
      const painted = canvases.filter(c => {
        if (!c.width || !c.height) return false;
        try {
          const ctx = c.getContext('2d');
          const d = ctx.getImageData(0, 0, c.width, c.height).data;
          for (let p = 3; p < d.length; p += 4) if (d[p] !== 0) return true;
          return false;
        } catch { return false; }
      }).length;
      // KPI cards: SummaryBox roots carry data-slot="root"
      const kpiEls = Array.from(document.querySelectorAll('[data-slot="root"]'));
      const kpis = kpiEls.length;
      // Overflowing KPI cards were a real bug: an extra caption line pushed content past
      // SummaryBox's fixed 89px height and clipped it. Compare content height to box height.
      const clipped = kpiEls.filter(el => el.scrollHeight > el.clientHeight + 1).length;
      return { titles, canvasCount: canvases.length, painted, kpis, clipped };
    })()`,
  )

  observed[tabLabels[i]!] = {
    kpis: snapshot.kpis,
    charts: snapshot.titles,
    painted: snapshot.painted,
    clipped: snapshot.clipped,
  }
}

client.close()

// ---- 4. assert every tab against the spec ----
let totalCharts = 0
let totalPainted = 0
const failures: string[] = []

for (const [tab, want] of Object.entries(EXPECTED)) {
  const got = observed[tab]
  if (!got) {
    failures.push(`${tab}: never rendered`)
    continue
  }
  if (got.kpis !== want.kpis) {
    failures.push(`${tab}: expected ${want.kpis} KPI cards, saw ${got.kpis}`)
  }
  for (const title of want.charts) {
    if (!got.charts.includes(title)) {
      failures.push(`${tab}: missing chart "${title}" (saw ${JSON.stringify(got.charts)})`)
    }
  }
  if (got.painted === 0 && want.charts.length > 0) {
    failures.push(`${tab}: ${got.charts.length} chart cards but NO canvas painted any pixels`)
  }
  // Duplicate titles mean a title is being rendered twice (the card header AND MpChart's own
  // `title` prop, which is how the first version shipped). The DOM was structurally "correct"
  // so only a screenshot caught it; this makes it a hard failure instead.
  const seen = new Set<string>()
  for (const title of got.charts) {
    if (seen.has(title)) failures.push(`${tab}: chart title "${title}" rendered more than once`)
    seen.add(title)
  }
  if (got.clipped > 0) {
    failures.push(`${tab}: ${got.clipped} KPI card(s) clipped — content taller than the card`)
  }
  totalCharts += got.charts.length
  totalPainted += got.painted
}

if (consoleErrors.length) {
  // Vue "unknown prop"/"failed to resolve component" warnings are exactly the class of bug
  // a typecheck misses, so they fail the run rather than being reported as noise.
  const relevant = consoleErrors.filter(
    (e) => !e.includes('DevTools') && !e.includes('favicon') && !e.includes('Download the Vue'),
  )
  if (relevant.length) failures.push(`console errors:\n  ${relevant.slice(0, 10).join('\n  ')}`)
}

if (failures.length) {
  console.error('FAIL\n' + failures.map((f) => ` - ${f}`).join('\n'))
  process.exit(1)
}

console.log(
  `ok — rendered ${tabLabels.length} tabs, ${totalCharts} chart cards, ` +
    `${totalPainted} canvases painted, 0 console errors`,
)

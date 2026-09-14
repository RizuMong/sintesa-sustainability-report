// Asserts the SDG dashboard actually RENDERS — the only check that proves the page works end to
// end rather than proving normalizeSdg() returns the right object. Companion to
// scripts/screenshot-sdg.sh, which sets up the app + mock API + Chrome around it.
//
// This exists because every failure mode that mattered here was invisible to both vue-tsc and the
// unit checks: SdgPage.vue read `data.kpi.*` while the endpoint sends `summary[]`, so all four KPI
// cards rendered a real, type-correct, entirely wrong 0. Only looking at the DOM catches that.
//
// run: node --experimental-strip-types scripts/sdg-acceptance.check.ts <appUrl> <outDir> <cdpPort>
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'

const [APP_URL, OUT_DIR, CDP_PORT] = [
  process.argv[2] ?? 'http://localhost:5202',
  process.argv[3] ?? '.temp/shots',
  process.argv[4] ?? '9225',
]
const PAGE = `${APP_URL}/dashboard/sdg?token=devtoken&env=development&company_id=1`

async function connect(wsUrl: string) {
  const ws = new WebSocket(wsUrl)
  await new Promise<void>((res, rej) => {
    ws.addEventListener('open', () => res(), { once: true })
    ws.addEventListener('error', () => rej(new Error('ws error')), { once: true })
  })
  let id = 0
  const pending = new Map<number, { res: (v: any) => void; rej: (e: Error) => void }>()
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(String(ev.data))
    if (msg.id === undefined) return
    const p = pending.get(msg.id)
    if (!p) return
    pending.delete(msg.id)
    msg.error ? p.rej(new Error(JSON.stringify(msg.error))) : p.res(msg.result)
  })
  const send = (method: string, params: Record<string, unknown> = {}) =>
    new Promise<any>((res, rej) => {
      const myId = ++id
      pending.set(myId, { res, rej })
      ws.send(JSON.stringify({ id: myId, method, params }))
    })
  return { send, close: () => ws.close() }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const targets = await fetch(`http://localhost:${CDP_PORT}/json/list`).then((r) => r.json())
const target = targets.find((t: any) => t.type === 'page')
if (!target) throw new Error('no chrome page target')

const client = await connect(target.webSocketDebuggerUrl)
await client.send('Page.enable')
await client.send('Runtime.enable')

await client.send('Page.navigate', { url: PAGE })
await sleep(7000)

const evaluate = async (expression: string) => {
  const r = await client.send('Runtime.evaluate', { expression, returnByValue: true })
  if (r.exceptionDetails) throw new Error(`eval failed: ${JSON.stringify(r.exceptionDetails)}`)
  return r.result.value
}

// ---- KPI cards ----
//
// Reads the rendered text, not the store: a KPI that is bound to the wrong field still renders a
// perfectly valid "0", which is precisely the bug this page shipped with.
//
// Anchored on SummaryBox.vue's own data-slot attributes rather than on text or DOM shape, so a
// styling change doesn't quietly turn this check into a no-op.
const kpis: { label: string; amount: string }[] = await evaluate(`
  Array.from(document.querySelectorAll('[data-slot="root"]')).map(root => ({
    label:  root.querySelector('[data-slot="top-content"]')?.textContent.trim() ?? '',
    amount: root.querySelector('[data-slot="bottom-content"] h2')?.textContent.trim() ?? '',
  })).filter(k => k.label)
`)

console.log('KPI cards:', JSON.stringify(kpis))
assert.equal(kpis.length, 4, 'all four KPI cards must render')
for (const kpi of kpis) {
  const numeric = Number(kpi.amount.replace(/[^0-9.]/g, ''))
  assert.ok(
    Number.isFinite(numeric) && numeric > 0,
    `KPI "${kpi.label}" rendered "${kpi.amount}" — a zero/blank KPI means the page is reading a field the payload does not have`,
  )
}
console.log('ok — 4 KPI cards render non-zero values')

// ---- matrix table ----
const matrixRows: string[] = await evaluate(`
  Array.from(document.querySelectorAll('table')).slice(0,1).flatMap(t =>
    Array.from(t.querySelectorAll('tbody tr')).map(r =>
      Array.from(r.querySelectorAll('td')).map(c => c.textContent.trim()).join(' | ')))
`)
console.log(`matrix rows: ${matrixRows.length}`)
for (const row of matrixRows.slice(0, 12)) console.log('   ', row)
assert.ok(
  matrixRows.length >= 10,
  `expected >=10 matrix rows with DEMO_PAD on, got ${matrixRows.length}`,
)
// Every row must name a real SDG number. A row rendering "SDG  — SDG 12" (blank number) is what a
// stale mock server serving a pre-fix fixture looks like, and the earlier version of this check
// happily passed on it because it only asserted a row count and two prefixes.
for (const row of matrixRows) {
  assert.match(
    row,
    /^SDG \d+ — /,
    `matrix row "${row}" has no SDG number — the page is rendering a row the adapter never produces`,
  )
}
// The id-duplication trap: SDG 1 and SDG 12 share one sdg_id.id in the backend's dummy data, so
// grouping on id yields one row where there must be two. Assert both survived to the DOM.
assert.ok(matrixRows.some((r) => r.startsWith('SDG 1 ')), 'SDG 1 must render its own row')
assert.ok(matrixRows.some((r) => r.startsWith('SDG 12 ')), 'SDG 12 must render its own row')
// Exactly one row per SDG number — a duplicate means grouping broke somewhere upstream.
const numbers = matrixRows.map((r) => r.match(/^SDG (\d+) /)![1])
assert.equal(new Set(numbers).size, numbers.length, `duplicate SDG rows: ${numbers.join(',')}`)
console.log('ok — matrix renders every SDG once, and the duplicate-id trap did not collapse rows')

// ---- chart actually painted pixels, ACROSS THE PLOT AREA ----
//
// A canvas can exist, be sized, and be entirely blank. It can also be "painted" and still be
// wrong: the first version of this page crammed every bar into the leftmost ~8% of the canvas
// while the x-axis labels spread across the full width, and a naive painted-pixel count passed it
// happily. So measure WHERE the ink is, not just how much.
const chart = await evaluate(`
  (() => {
    const c = document.querySelector('#sdg-aligned-vs-initiated canvas') || document.querySelector('canvas')
    if (!c) return { error: 'no-canvas' }
    const ctx = c.getContext('2d')
    if (!ctx) return { error: 'no-ctx' }
    const { data } = ctx.getImageData(0, 0, c.width, c.height)
    let painted = 0, minX = c.width, maxX = 0
    for (let y = 0; y < c.height; y++) {
      for (let x = 0; x < c.width; x++) {
        if (data[(y * c.width + x) * 4 + 3] > 0) {
          painted++
          if (x < minX) minX = x
          if (x > maxX) maxX = x
        }
      }
    }
    return { painted, width: c.width, spreadRatio: painted ? (maxX - minX) / c.width : 0 }
  })()
`)
console.log('chart:', JSON.stringify(chart))
assert.ok(!chart.error, `chart canvas problem: ${chart.error}`)
assert.ok(chart.painted > 500, `chart canvas is blank (${chart.painted} px)`)
// Bars for 10 SDG categories must occupy most of the plot width. The broken version measured
// ~0.08 here; a correct grouped bar chart spans essentially the whole canvas.
assert.ok(
  chart.spreadRatio > 0.6,
  `chart ink spans only ${(chart.spreadRatio * 100).toFixed(0)}% of the canvas width — bars are crammed into one corner, not spread across the categories`,
)
console.log('ok — chart painted across the full plot width')

// ---- drill-down ----
const detailRows: number = await evaluate(`
  (() => {
    const cell = document.querySelector('table tbody tr td')
    if (!cell) return -1
    cell.click()
    return 1
  })()
`)
assert.equal(detailRows, 1, 'first matrix row must be clickable')
await sleep(1200)
const detailCount: number = await evaluate(
  `document.querySelectorAll('table')[1]?.querySelectorAll('tbody tr').length ?? 0`,
)
console.log('drill-down rows:', detailCount)
assert.ok(detailCount > 0, 'clicking an SDG row must reveal its action plans')
console.log('ok — drill-down renders action plans for the selected SDG')

// ---- capture for a human ----
const shot = await client.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
writeFileSync(`${OUT_DIR}/sdg-dashboard.png`, Buffer.from(shot.data, 'base64'))
console.log(`\nscreenshot: ${OUT_DIR}/sdg-dashboard.png`)

console.log('\nALL SDG ACCEPTANCE CHECKS PASSED')
client.close()
process.exit(0)

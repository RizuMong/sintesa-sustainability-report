// Asserts the SDG dashboard actually RENDERS — the only check that proves the page works end to
// end rather than proving normalizeSdg() returns the right object. Companion to
// run-sdg-acceptance.sh, which sets up the app + mock API + Chrome around it.
//
// This exists because every failure mode that mattered here was invisible to both vue-tsc and the
// unit checks: SdgPage.vue once read `data.kpi.*` while the endpoint sends `summary[]`, so every
// KPI card rendered a real, type-correct, entirely wrong 0 — vue-tsc has no opinion on which field
// of an untyped API response you read, and "Failed to resolve component" (the mp-box leftover in
// SummaryBox.vue) is invisible to it too. Only looking at the DOM catches either class of bug.
//
// Rewritten wholesale for plans/sdg-dashboard-adjustments/plan.md Phase 5: the previous version
// asserted a matrix that was the first `<table>` with rows matching `/^SDG \d+ — /` (a per-SDG-row
// chart-turned-table from before GROU-833) and that every KPI card was non-zero — both wrong today:
// the matrix is entity x SDG columns, and `Bottom-Up Initiatives` is legitimately 0 against the
// current fixture (no action in it has `plan_origin: 'INITIATE'` — gap A1/data fact, not a bug).
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

// ---- minimal CDP client over the DevTools websocket (mirrors dashboard-acceptance.check.ts) ----
async function connect(wsUrl: string) {
  const ws = new WebSocket(wsUrl)
  await new Promise<void>((res, rej) => {
    ws.addEventListener('open', () => res(), { once: true })
    ws.addEventListener('error', () => rej(new Error('ws error')), { once: true })
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
      msg.error ? p.rej(new Error(JSON.stringify(msg.error))) : p.res(msg.result)
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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const targets = await fetch(`http://localhost:${CDP_PORT}/json/list`).then((r) => r.json())
const target = targets.find((t: any) => t.type === 'page')
if (!target) throw new Error('no chrome page target')

const client = await connect(target.webSocketDebuggerUrl)
await client.send('Page.enable')
await client.send('Runtime.enable')
await client.send('Log.enable')

const evaluate = async (expression: string) => {
  const r = await client.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error(`eval failed: ${JSON.stringify(r.exceptionDetails)}`)
  return r.result.value
}

await client.send('Page.navigate', { url: PAGE })
await sleep(7000)

// ---- summary boxes ----
//
// Anchored on SummaryBox.vue's own data-slot attributes rather than on text or DOM shape, so a
// styling change doesn't quietly turn this check into a no-op. `[data-slot="bottom-content"] > div
// > *` is the bottomContentWrapper's children in order: since no box passes a `caption`, that's
// [amount <h2>, description <p>] for every box here.
const boxes: { label: string; amount: string; description: string }[] = await evaluate(`
  Array.from(document.querySelectorAll('[data-slot="root"]')).map(root => {
    const kids = Array.from(root.querySelectorAll('[data-slot="bottom-content"] > div > *'))
    return {
      label: root.querySelector('[data-slot="top-content"]')?.textContent.trim() ?? '',
      amount: kids[0]?.textContent.trim() ?? '',
      description: kids[1]?.textContent.trim() ?? '',
    }
  }).filter(b => b.label)
`)
console.log('summary boxes:', JSON.stringify(boxes))
assert.equal(boxes.length, 4, 'all four summary boxes must render')
for (const box of boxes) {
  assert.ok(box.description.length > 0, `summary box "${box.label}" has no description`)
}
// MpTooltip duplicates its label text into the accessible name, so the rendered text is
// "Holding SDG Roadmap Holding SDG Roadmap" — match with startsWith rather than an exact label.
const roadmap = boxes.find((b) => b.label.startsWith('Holding SDG Roadmap'))
assert.ok(roadmap, 'Holding SDG Roadmap box must render')
// The whole point of the Phase 2 `value / total` format — assert it exactly, not just "contains 9".
assert.equal(roadmap!.amount, '9 / 17', `Holding SDG Roadmap must read "9 / 17", got "${roadmap!.amount}"`)
// Recomputed FE-side from the fixture + Master SDG adoption: 9 actions sit on non-adopted SDGs
// (1/9/10), and 15 of 24 on adopted SDG 3/12 -> 63% alignment, never > 100%.
const bottomUp = boxes.find((b) => b.label.startsWith('Bottom-Up Initiatives'))
assert.ok(bottomUp, 'Bottom-Up Initiatives box must render')
assert.equal(bottomUp!.amount, '9', `Bottom-Up Initiatives must read "9", got "${bottomUp!.amount}"`)
const alignment = boxes.find((b) => b.label.startsWith('Strategic Alignment'))
assert.equal(alignment?.amount, '63%', `Strategic Alignment must read "63%", got "${alignment?.amount}"`)
console.log('ok — 4 summary boxes render with descriptions, Holding SDG Roadmap reads "9 / 17"')

// ---- column grouping header row: grouped by Master SDG adoption, not plan_origin. Every action
// in the fixture is plan_origin HOLDING, but only SDG 3/12 are adopted -> "Holding SDGs" spans 2,
// "Bottom-Up Initiatives" spans 3 (SDG 1/9/10) ----
const groupHeader: { cells: { text: string; colSpan: number; scope: string | null }[] } = await evaluate(`
  (() => {
    const table = document.querySelectorAll('table')[0]
    const headRows = table.querySelectorAll('thead tr')
    const cells = Array.from(headRows[0].querySelectorAll('th, td')).map(c => ({
      text: c.textContent.trim(),
      colSpan: c.colSpan,
      scope: c.getAttribute('scope'),
    }))
    return { cells }
  })()
`)
console.log('group header row:', JSON.stringify(groupHeader.cells))
const groupCells = groupHeader.cells.filter((c) => c.text.length > 0)
assert.deepEqual(
  groupCells.map((c) => [c.text, c.colSpan, c.scope]),
  [
    ['Holding SDGs', 2, 'colgroup'],
    ['Bottom-Up Initiatives', 3, 'colgroup'],
  ],
  `group header cells wrong: ${JSON.stringify(groupCells)}`,
)
console.log('ok — group header row: "Holding SDGs" spans 2, "Bottom-Up Initiatives" spans 3')

// ---- matrix table: 3 entity rows x 5 SDG columns ----
// The SDG column headers now live in the SECOND thead row — the first is the grouping row above.
const matrix: { headers: string[]; rows: string[][] } = await evaluate(`
  (() => {
    const table = document.querySelectorAll('table')[0]
    const headRows = table.querySelectorAll('thead tr')
    const headers = Array.from(headRows[1].querySelectorAll('th, td')).map(c => c.textContent.trim())
    const rows = Array.from(table.querySelectorAll('tbody tr')).map(r =>
      Array.from(r.querySelectorAll('td')).map(c => c.textContent.trim()))
    return { headers, rows }
  })()
`)
console.log('matrix headers:', JSON.stringify(matrix.headers))
console.log('matrix rows:', JSON.stringify(matrix.rows))
// Entity, Execution %, then one column per SDG.
assert.equal(matrix.headers[0], 'Entity')
assert.equal(matrix.headers[1], 'Execution %')
const sdgHeaders = matrix.headers.slice(2)
assert.equal(sdgHeaders.length, 5, `expected 5 SDG columns, got ${sdgHeaders.length}: ${sdgHeaders.join(', ')}`)
// sdg_id EwGok8Dh3xXQ appears as both "SDG 10" and "SDG 19" in the wire payload (same id, two
// names) and must collapse to exactly one column — no duplicate headers.
assert.equal(new Set(sdgHeaders).size, sdgHeaders.length, `duplicate SDG columns: ${sdgHeaders.join(', ')}`)
assert.equal(matrix.rows.length, 3, `expected 3 entity rows, got ${matrix.rows.length}`)
const entityNames = matrix.rows.map((r) => r[0])
for (const name of ['Widjajatunggal Sejahtera, PT', 'Menara Duta, PT', 'Meppo-Gen, PT']) {
  assert.ok(entityNames.includes(name), `matrix must have a row for "${name}", got: ${entityNames.join(', ')}`)
}
for (const row of matrix.rows) {
  assert.equal(row.length, 7, `row for "${row[0]}" must have Entity + Execution % + 5 SDG cells, got ${row.length}`)
}
console.log('ok — matrix renders 3 entity rows x 5 SDG columns, no duplicate columns')

// ---- cell colour: at least one TAKE (green) cell and one SKIP/NONE (white) cell, on computed bg ----
//
// Menara Duta x SDG 1 is 1/1 TAKE (100%, green); Menara Duta x SDG 3 is 1/1 SKIP (0%, white) —
// picked by exact cell coordinates from the fixture rather than "first 100%/0% found", and
// asserted on getComputedStyle background, not on generated styled-system class names (those are
// not a stable contract).
const cellColours: { greenBg: string | null; whiteBg: string | null } = await evaluate(`
  (() => {
    const table = document.querySelectorAll('table')[0]
    const rows = Array.from(table.querySelectorAll('tbody tr'))
    const menaraDuta = rows.find(r => r.querySelector('td')?.textContent.trim() === 'Menara Duta, PT')
    if (!menaraDuta) return { greenBg: null, whiteBg: null }
    const cells = Array.from(menaraDuta.querySelectorAll('td'))
    // cells[0]=Entity, cells[1]=Execution %, cells[2..6]=SDG 3, SDG 12 | SDG 1, SDG 9, SDG 10
    return {
      greenBg: getComputedStyle(cells[4]).backgroundColor,
      whiteBg: getComputedStyle(cells[2]).backgroundColor,
    }
  })()
`)
console.log('cell colours:', JSON.stringify(cellColours))
function parseRgb(css: string | null): { r: number; g: number; b: number } {
  const m = (css ?? '').match(/\d+/g)?.map(Number) ?? []
  return { r: m[0] ?? 0, g: m[1] ?? 0, b: m[2] ?? 0 }
}
const green = parseRgb(cellColours.greenBg)
const white = parseRgb(cellColours.whiteBg)
assert.ok(cellColours.greenBg, 'TAKE cell (Menara Duta x SDG 1) must render')
assert.ok(cellColours.whiteBg, 'SKIP cell (Menara Duta x SDG 3) must render')
assert.ok(
  green.g > green.r + 5 && green.g > green.b + 5,
  `TAKE cell background "${cellColours.greenBg}" is not green-tinted`,
)
assert.ok(
  Math.abs(white.r - white.g) <= 3 && Math.abs(white.g - white.b) <= 3,
  `SKIP cell background "${cellColours.whiteBg}" is not a neutral white/gray`,
)
assert.notEqual(cellColours.greenBg, cellColours.whiteBg, 'TAKE and SKIP cells must render different backgrounds')
console.log('ok — TAKE cell is green-tinted, SKIP cell is neutral, on computed background colour')

// ---- drill-down from a matrix cell ----
const DETAIL_HEADERS = ['SDG', 'Action Plan Initiative', 'Origin', 'Adoption Status']
await evaluate(`
  (() => {
    const table = document.querySelectorAll('table')[0]
    const rows = Array.from(table.querySelectorAll('tbody tr'))
    const menaraDuta = rows.find(r => r.querySelector('td')?.textContent.trim() === 'Menara Duta, PT')
    const cell = menaraDuta.querySelectorAll('td')[4] // SDG 1 cell, 100% TAKE
    cell.click()
  })()
`)
await sleep(800)
const cellDetail: { headers: string[]; rowCount: number } = await evaluate(`
  (() => {
    const table = document.querySelectorAll('table')[1]
    if (!table) return { headers: [], rowCount: 0 }
    return {
      headers: Array.from(table.querySelectorAll('thead tr th, thead tr td')).map(c => c.textContent.trim()),
      rowCount: table.querySelectorAll('tbody tr').length,
    }
  })()
`)
console.log('cell drill-down:', JSON.stringify(cellDetail))
assert.deepEqual(cellDetail.headers, DETAIL_HEADERS, `detail table headers must be exactly ${DETAIL_HEADERS.join(', ')}`)
assert.ok(cellDetail.rowCount > 0, 'clicking a matrix cell must reveal at least one action plan row')
console.log('ok — clicking a matrix cell reveals the Action Plan Details table')

// ---- chart canvas painted, and a bar-segment click also reveals the detail table ----
//
// A canvas can exist, be sized, and be entirely blank — measure WHERE the ink is (spreadRatio),
// not just how much, per the sibling GRI check's own note on that failure mode.
const chart: { error?: string; painted?: number; spreadRatio?: number } = await evaluate(`
  (() => {
    const c = document.querySelector('#sdg-alignment-gap canvas')
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
    return { painted, spreadRatio: painted ? (maxX - minX) / c.width : 0 }
  })()
`)
console.log('chart:', JSON.stringify(chart))
assert.ok(!chart.error, `chart canvas problem: ${chart.error}`)
assert.ok(chart.painted! > 500, `chart canvas is blank (${chart.painted} px)`)
assert.ok(chart.spreadRatio! > 0.6, `chart ink spans only ${((chart.spreadRatio ?? 0) * 100).toFixed(0)}% of the canvas width`)

// Every action in this fixture is plan_origin 'HOLDING' (gap A1/A-note: no INITIATE data exists
// yet), so the "Holding" dataset's bar is close to full-width for every entity and the "Initiate"
// segment is zero-length — there is no reliable pixel to click on a 0-width bar. Driving a precise
// pixel click at the exact stacked-segment boundary over CDP also proved the flaky part in
// practice (chart.js's own hit-testing, not the click mechanism, is what makes a single blind
// coordinate unreliable). So this scans a grid of real, in-page MouseEvents dispatched directly at
// the canvas (real layout coordinates from getBoundingClientRect, not a guessed single point) and
// stops at the first one that lands inside a bar and triggers DashboardChartCard's own onClick
// wiring (chartOptions.onClick -> props.onSegmentClick -> SdgPage's onAlignmentGapClick) — i.e. it
// drives the click through the component's own handler chain rather than pre-computing one "right"
// pixel, which is what made a single click flaky.
const chartClick: { success: boolean; attempts: number } = await evaluate(`
  (async () => {
    const c = document.querySelector('#sdg-alignment-gap canvas')
    if (!c) return { success: false, attempts: 0 }
    const rect = c.getBoundingClientRect()
    const cols = 10, rows = 6
    let attempts = 0
    for (let ry = 1; ry < rows; ry++) {
      for (let rx = 1; rx < cols; rx++) {
        attempts++
        const x = rect.left + (rect.width * rx) / cols
        const y = rect.top + (rect.height * ry) / rows
        c.dispatchEvent(new MouseEvent('click', { clientX: x, clientY: y, bubbles: true, cancelable: true }))
        await new Promise(r => setTimeout(r, 60))
        if (document.querySelectorAll('table').length > 1) return { success: true, attempts }
      }
    }
    return { success: false, attempts }
  })()
`)
console.log('chart click scan:', JSON.stringify(chartClick))
assert.ok(chartClick.success, `no grid point revealed the detail table after ${chartClick.attempts} attempts`)
await sleep(400)
const barDetail: { headers: string[]; rowCount: number } = await evaluate(`
  (() => {
    const table = document.querySelectorAll('table')[1]
    if (!table) return { headers: [], rowCount: 0 }
    return {
      headers: Array.from(table.querySelectorAll('thead tr th, thead tr td')).map(c => c.textContent.trim()),
      rowCount: table.querySelectorAll('tbody tr').length,
    }
  })()
`)
console.log('bar-segment drill-down:', JSON.stringify(barDetail))
assert.deepEqual(barDetail.headers, DETAIL_HEADERS, `detail table headers must be exactly ${DETAIL_HEADERS.join(', ')}`)
assert.ok(barDetail.rowCount > 0, 'clicking a chart bar segment must reveal at least one action plan row')
console.log('ok — chart painted across the plot width, and a bar-segment click reveals the Action Plan Details table')

// ---- console must be clean of Vue warnings ----
//
// CLAUDE.md is explicit that these fail the run — "Failed to resolve component" (the mp-box
// leftover in SummaryBox.vue) is exactly the class of bug vue-tsc cannot see.
const consoleIssues: string[] = []
for (const e of client.events) {
  if (e.method === 'Runtime.consoleAPICalled' && (e.params.type === 'error' || e.params.type === 'warning')) {
    const text = (e.params.args ?? []).map((a: any) => a.value ?? a.description ?? '').join(' ')
    if (text.trim()) consoleIssues.push(`${e.params.type}: ${text}`)
  }
  if (e.method === 'Runtime.exceptionThrown') {
    consoleIssues.push(`exception: ${e.params.exceptionDetails?.exception?.description ?? 'unknown'}`)
  }
}
const relevant = consoleIssues.filter(
  (e) => !e.includes('DevTools') && !e.includes('favicon') && !e.includes('Download the Vue'),
)
console.log('console issues:', JSON.stringify(relevant))
assert.equal(relevant.length, 0, `console must be clean:\n  ${relevant.join('\n  ')}`)
console.log('ok — console is clean of Vue warnings and exceptions')

// ---- capture for a human ----
//
// NOT `captureBeyondViewport: true`, and not a scroll-nudge either. That flag composites the page
// off the real surface, which (a) drops chart canvases — the PNG showed an empty plot area while
// getImageData on the live canvas, asserted above, showed 231k painted pixels — and (b) paints the
// sticky filter bar a second time at the bottom of the image. Both make the screenshot useless for
// the human review that CLAUDE.md records as the thing that caught the `mp-box` and crammed-bars
// bugs. Resizing the viewport to the full content height and taking an ordinary in-surface capture
// gets the whole page with the canvases intact.
const metrics = await client.send('Page.getLayoutMetrics')
const fullHeight = Math.ceil(metrics.cssContentSize?.height ?? 2000)
const fullWidth = Math.ceil(metrics.cssContentSize?.width ?? 1440)
await client.send('Emulation.setDeviceMetricsOverride', {
  width: fullWidth,
  height: fullHeight,
  deviceScaleFactor: 1,
  mobile: false,
})
await sleep(600) // let Chart.js re-render into the resized canvas before the shutter
const shot = await client.send('Page.captureScreenshot', { format: 'png' })
await client.send('Emulation.clearDeviceMetricsOverride')
writeFileSync(`${OUT_DIR}/sdg-dashboard.png`, Buffer.from(shot.data, 'base64'))
console.log(`\nscreenshot: ${OUT_DIR}/sdg-dashboard.png`)

console.log('\nALL SDG ACCEPTANCE CHECKS PASSED')
client.close()
process.exit(0)

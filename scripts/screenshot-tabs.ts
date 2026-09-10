// Captures a full-page screenshot of each dashboard tab. Companion to
// scripts/screenshot-dashboard.sh, which sets up the app + mock API + Chrome around it.
//
// run: node --experimental-strip-types scripts/screenshot-tabs.ts <appUrl> <outDir> <cdpPort>
import { writeFileSync } from 'node:fs'

const [APP_URL, OUT_DIR, CDP_PORT] = [
  process.argv[2] ?? 'http://localhost:5201',
  process.argv[3] ?? '.temp/shots',
  process.argv[4] ?? '9224',
]
const PAGE = `${APP_URL}/dashboard/gri-quantitative?token=devtoken&env=development&company_id=1`

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
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const targets = await fetch(`http://localhost:${CDP_PORT}/json/list`).then((r) => r.json())
const target = targets.find((t: any) => t.type === 'page')
if (!target) throw new Error('no chrome page target')

const client = await connect(target.webSocketDebuggerUrl)
await client.send('Page.enable')
await client.send('Runtime.enable')
await client.send('Page.navigate', { url: PAGE })
await sleep(6000)

const evaluate = async (expression: string) => {
  const r = await client.send('Runtime.evaluate', { expression, returnByValue: true })
  return r.result.value
}

const tabs: string[] = await evaluate(
  `Array.from(document.querySelectorAll('[role="tab"]')).map(t => t.textContent.trim())`,
)

for (let i = 0; i < tabs.length; i++) {
  await evaluate(`document.querySelectorAll('[role="tab"]')[${i}].click()`)
  await sleep(1500)
  const { data } = await client.send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
  })
  const file = `${OUT_DIR}/${String(i + 1).padStart(2, '0')}-${slug(tabs[i]!)}.png`
  writeFileSync(file, Buffer.from(data, 'base64'))
  console.log(`saved ${file}`)
}

client.close()
console.log(`\n${tabs.length} screenshots in ${OUT_DIR}/`)

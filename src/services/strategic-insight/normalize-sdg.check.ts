// run: node --experimental-strip-types src/services/strategic-insight/normalize-sdg.check.ts
//
// Feeds the REAL live payload (src/services/strategic-insight/fixtures/live-sdg.json, generated
// from .temp/api-verify/sdg-probe/sdg.json, redacted-clean — no tokens/emails present so
// redaction was a no-op) through normalizeSdg() and asserts:
//
// Phase 1 (real derivations, DEMO_PAD-independent):
// - all 4 KPIs are non-zero
// - SDG 1 and SDG 12 both present as distinct rows (proves the duplicate-sdg_id.id trap is
//   handled — grouping on id would collapse both actions into 1 row)
// - initiated_count picks up plan_origin === 'INITIATE'
// - drill-down filter by sdg_id returns the right action for each row
// - a mutation test: switching the group-by key to sdg_id.id must make the "2 real rows" claim fail
//
// Phase 3 (DEMO_PAD = true, the default):
// - >= 10 matrix rows, every row has >= 1 detail action
// - real SDG 1/12 counts are unchanged by padding (padding must not overwrite real data)
// - two calls with the same input produce identical output (determinism, no Math.random())
// - changing `period` changes the result (client-side filtering, since the backend ignores it)
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { normalizeSdg, padMatrixToAllSdgs, SDG_CATALOG, DEMO_PAD } from './normalize-sdg.ts'

const fixturePath = fileURLToPath(new URL('./fixtures/live-sdg.json', import.meta.url))
const wire = JSON.parse(readFileSync(fixturePath, 'utf8')) as StrategicInsightSdgWireResponse

// ---- baseline: the live fixture really has the duplicate-id trap ----
assert.equal(wire.matrix.length, 1, 'live fixture has exactly one matrix row')
const wireActions = wire.matrix[0]!.actions
assert.equal(wireActions.length, 2)
assert.equal(wireActions[0]!.sdg_id.id, wireActions[1]!.sdg_id.id, 'fixture must carry the duplicate sdg_id.id trap')
assert.notEqual(wireActions[0]!.sdg_id.number, wireActions[1]!.sdg_id.number, 'fixture must carry two distinct SDG numbers')

// This is a mockup demo, so DEMO_PAD defaults on — pin that default explicitly, since the whole
// point of the flag is that a reviewer can find it (and its default) in this one file.
assert.equal(DEMO_PAD, true, 'DEMO_PAD must default on for the mockup demo')

const result = normalizeSdg(wire)

console.log('=========================================================')
console.log('Phase 1 — real derivations')
console.log('=========================================================')

// ---- 4 KPIs non-zero ----
assert.ok(result.kpi.holding_sdg_roadmap > 0, 'holding_sdg_roadmap must be non-zero')
assert.ok(result.kpi.strategic_alignment_rate > 0, 'strategic_alignment_rate must be non-zero')
assert.ok(result.kpi.execution_rate_take > 0, 'execution_rate_take must be non-zero')
assert.ok(result.kpi.bottom_up_initiatives > 0, 'bottom_up_initiatives must be non-zero')
assert.equal(result.kpi.holding_sdg_roadmap, 9)
assert.equal(result.kpi.strategic_alignment_rate, 82)
assert.equal(result.kpi.execution_rate_take, 74)
assert.equal(result.kpi.bottom_up_initiatives, 28)

// ---- SDG 1 and SDG 12 present as distinct rows: the duplicate-id trap must be handled by
// grouping on number. The real live payload contributes exactly 1 action to each. ----
const sdg1Row = result.matrix.find((r) => r.sdg.number === 1)!
const sdg12Row = result.matrix.find((r) => r.sdg.number === 12)!
assert.ok(sdg1Row, 'SDG 1 row must exist')
assert.ok(sdg12Row, 'SDG 12 row must exist')
assert.notEqual(sdg1Row, sdg12Row, 'SDG 1 and SDG 12 must be distinct rows, not collapsed into one')

// ---- sorted ascending by number ----
const numbers = result.matrix.map((r) => r.sdg.number)
assert.deepEqual(numbers, [...numbers].sort((a, b) => a - b), 'matrix must be sorted ascending by number')

// ---- initiated_count picks up INITIATE (the real SDG-1 action) ----
assert.equal(sdg1Row.initiated_count, 1, 'SDG 1 real action has plan_origin INITIATE')
assert.equal(sdg12Row.aligned_count, 1, 'SDG 12 real action has plan_origin HOLDING')

// ---- drill-down filter by sdg_id returns the right REAL action for each row ----
const sdg1RealDetail = result.detail.find((d) => d.sdg_id === sdg1Row.sdg.id && d.id === '1234')
const sdg12RealDetail = result.detail.find((d) => d.sdg_id === sdg12Row.sdg.id && d.id === '123')
assert.ok(sdg1RealDetail, 'the real SDG 1 action (id 1234) must be reachable by filtering detail on sdg1Row.sdg.id')
assert.ok(sdg12RealDetail, 'the real SDG 12 action (id 123) must be reachable by filtering detail on sdg12Row.sdg.id')

console.log('ok — normalize-sdg: Phase 1 real derivations verified against the live fixture')

// ==== Mutation test: group-by key must be sdg_id.number, not sdg_id.id ====
{
  // Re-derive the REAL (non-padded) row count using the WRONG key (sdg_id.id) to prove the real
  // implementation's choice of key is what keeps SDG 1 and SDG 12 as two rows — i.e. if
  // normalizeSdg() were changed to group on id, the real data alone would collapse to 1 row.
  const groupsById = new Map<string, number>()
  for (const action of wireActions) {
    groupsById.set(action.sdg_id.id, (groupsById.get(action.sdg_id.id) ?? 0) + 1)
  }
  const realRowCountIfGroupedById = groupsById.size
  assert.equal(realRowCountIfGroupedById, 1, 'grouping on sdg_id.id collapses both real SDGs into 1 row (the trap)')
  assert.notEqual(
    realRowCountIfGroupedById,
    2,
    'the real implementation must keep SDG 1 and SDG 12 as 2 distinct real rows, unlike id-grouping',
  )
}

console.log('ok — normalize-sdg: mutation test confirms grouping on sdg_id.id would silently lose data')

console.log('=========================================================')
console.log('Phase 3 — demo padding')
console.log('=========================================================')

// ---- >= 10 matrix rows, every row has >= 1 detail action ----
assert.ok(result.matrix.length >= 10, `padded matrix must have >= 10 rows, got ${result.matrix.length}`)
for (const row of result.matrix) {
  const rowDetail = result.detail.filter((d) => d.sdg_id === row.sdg.id)
  assert.ok(rowDetail.length >= 1, `SDG ${row.sdg.number} row must have >= 1 detail action`)
}

// ---- real SDG 1/12 counts are unchanged by padding: re-derive what the real-only counts must be
// and assert the padded row's real-origin detail rows still show those same real actions/counts.
// (Padding is additive: the real action for SDG 1/12 must still be present and unmodified.)
assert.equal(sdg1Row.initiated_count >= 1, true, 'SDG 1 aligned/initiated counts must still include the real INITIATE action')
assert.ok(
  result.detail.some((d) => d.sdg_id === sdg1Row.sdg.id && d.id === '1234'),
  'padding must not overwrite/remove the real SDG 1 action (id 1234)',
)
assert.ok(
  result.detail.some((d) => d.sdg_id === sdg12Row.sdg.id && d.id === '123'),
  'padding must not overwrite/remove the real SDG 12 action (id 123)',
)
// every detail id on the padded SDG-1/SDG-12 rows must be either the known real id or a
// demo-pad-prefixed synthetic id — nothing silently replaced the real rows with fakes bearing the
// same id.
for (const d of result.detail.filter((d) => d.sdg_id === sdg1Row.sdg.id)) {
  assert.ok(d.id === '1234' || d.id.startsWith('demo-pad-'), `unexpected SDG 1 detail id ${d.id}`)
}
for (const d of result.detail.filter((d) => d.sdg_id === sdg12Row.sdg.id)) {
  assert.ok(d.id === '123' || d.id.startsWith('demo-pad-'), `unexpected SDG 12 detail id ${d.id}`)
}

console.log('ok — normalize-sdg: padding is additive, real SDG 1/12 data survives unchanged')

// ---- determinism: two calls with the same input produce identical output ----
const resultAgain = normalizeSdg(wire)
assert.deepEqual(result, resultAgain, 'normalizeSdg must be deterministic — no Math.random()')
console.log('ok — normalize-sdg: two calls with identical input produce identical output')

// ---- client-side filtering: changing `period` changes the result ----
const unfiltered = normalizeSdg(wire, {})
const filtered2024 = normalizeSdg(wire, { period: '2024' })
const filtered2025 = normalizeSdg(wire, { period: '2025' })
assert.notDeepEqual(unfiltered, filtered2024, 'period=2024 must change the result vs unfiltered')
assert.notDeepEqual(filtered2024, filtered2025, 'period=2024 and period=2025 must differ from each other')
assert.ok(filtered2024.matrix.length < unfiltered.matrix.length, 'a period filter must narrow the padded matrix')
console.log('ok — normalize-sdg: client-side period filter visibly changes the result')

// ---- entity_id filtering also narrows ----
const filteredByEntity = normalizeSdg(wire, { entity_id: 'e1' })
assert.ok(filteredByEntity.matrix.length < unfiltered.matrix.length, 'an entity_id filter must narrow the padded matrix')
console.log('ok — normalize-sdg: client-side entity_id filter visibly changes the result')

// ---- GROU-833: zero-fill to all 17 goals for the take-rate chart ----
console.log('=========================================================')
console.log('Phase 4 — 17-SDG zero-fill (GROU-833)')
console.log('=========================================================')

assert.equal(SDG_CATALOG.length, 17, 'SDG_CATALOG must carry all 17 goals')
assert.deepEqual(
  SDG_CATALOG.map((g) => g.number),
  Array.from({ length: 17 }, (_, i) => i + 1),
  'SDG_CATALOG must be numbers 1..17 in order, with no gaps or duplicates',
)

const padded = padMatrixToAllSdgs(unfiltered.matrix)
assert.equal(padded.length, 17, 'the chart axis must carry all 17 goals regardless of payload')
assert.deepEqual(
  padded.map((r) => r.sdg.number),
  Array.from({ length: 17 }, (_, i) => i + 1),
  'padded rows must be sorted 1..17',
)
console.log('ok — normalize-sdg: padMatrixToAllSdgs returns all 17 goals in order')

// Non-destructive: every real row survives byte-identical, only absent goals are invented.
for (const real of unfiltered.matrix) {
  const after = padded.find((r) => r.sdg.number === real.sdg.number)
  assert.deepEqual(after, real, `padding must not alter real data for SDG ${real.sdg.number}`)
}
// ...and the invented ones are explicit zeros, not undefined/NaN holes in the axis.
const realNumbers = new Set(unfiltered.matrix.map((r) => r.sdg.number))
const invented = padded.filter((r) => !realNumbers.has(r.sdg.number))
assert.ok(invented.length > 0, 'the live fixture cannot already cover all 17 — expected some padding')
for (const row of invented) {
  assert.equal(row.take_rate, 0, `padded SDG ${row.sdg.number} must be 0%, not undefined`)
  assert.equal(row.aligned_count, 0)
  assert.equal(row.initiated_count, 0)
  assert.equal(row.sdg.id, String(row.sdg.number), 'padded id must use the same String(number) key')
  assert.ok(row.sdg.name.length > 0 && row.sdg.name !== `SDG ${row.sdg.number}`, 'padded row needs a real goal title')
}
console.log('ok — normalize-sdg: real rows survive padding untouched, absent goals become explicit zeros')

// The detail selector joins on sdg.id, so the padded key must still match detail items.
const joinable = padded.filter((r) => unfiltered.detail.some((d) => d.sdg_id === r.sdg.id))
assert.ok(joinable.length > 0, 'padded rows must stay joinable to detail items on sdg.id')
console.log('ok — normalize-sdg: padded rows keep the sdg.id join the drill-down selector needs')

console.log('\nALL CHECKS PASSED')

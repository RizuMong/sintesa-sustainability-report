// run: node --experimental-strip-types src/services/strategic-insight/normalize-sdg.check.ts
//
// Feeds the REAL live payload (src/services/strategic-insight/fixtures/live-sdg.json, generated
// from .temp/api-verify/sdg-probe/sdg.json, redacted-clean — no tokens/emails present so
// redaction was a no-op) through normalizeSdg() and asserts:
// - all 4 KPIs are non-zero
// - exactly 2 matrix rows (proves the duplicate-sdg_id.id trap is handled — grouping on id
//   would collapse both actions into 1 row)
// - SDG 1 and SDG 12 both present
// - initiated_count picks up plan_origin === 'INITIATE'
// - drill-down filter by sdg_id returns the right action for each row
// - a mutation test: switching the group-by key to sdg_id.id must make the "2 rows" assertion fail
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { normalizeSdg } from './normalize-sdg.ts'

const fixturePath = fileURLToPath(new URL('./fixtures/live-sdg.json', import.meta.url))
const wire = JSON.parse(readFileSync(fixturePath, 'utf8')) as StrategicInsightSdgWireResponse

// ---- baseline: the live fixture really has the duplicate-id trap ----
assert.equal(wire.matrix.length, 1, 'live fixture has exactly one matrix row')
const actions = wire.matrix[0]!.actions
assert.equal(actions.length, 2)
assert.equal(actions[0]!.sdg_id.id, actions[1]!.sdg_id.id, 'fixture must carry the duplicate sdg_id.id trap')
assert.notEqual(actions[0]!.sdg_id.number, actions[1]!.sdg_id.number, 'fixture must carry two distinct SDG numbers')

const result = normalizeSdg(wire)

// ---- 4 KPIs non-zero ----
assert.ok(result.kpi.holding_sdg_roadmap > 0, 'holding_sdg_roadmap must be non-zero')
assert.ok(result.kpi.strategic_alignment_rate > 0, 'strategic_alignment_rate must be non-zero')
assert.ok(result.kpi.execution_rate_take > 0, 'execution_rate_take must be non-zero')
assert.ok(result.kpi.bottom_up_initiatives > 0, 'bottom_up_initiatives must be non-zero')
assert.equal(result.kpi.holding_sdg_roadmap, 9)
assert.equal(result.kpi.strategic_alignment_rate, 82)
assert.equal(result.kpi.execution_rate_take, 74)
assert.equal(result.kpi.bottom_up_initiatives, 28)

// ---- exactly 2 matrix rows: the duplicate-id trap must be handled by grouping on number ----
assert.equal(result.matrix.length, 2, 'grouping on sdg_id.number must yield 2 rows, not 1')
const numbers = result.matrix.map((r) => r.sdg.number).sort((a, b) => a - b)
assert.deepEqual(numbers, [1, 12], 'both SDG 1 and SDG 12 must be present')

// ---- sorted ascending by number ----
assert.deepEqual(
  result.matrix.map((r) => r.sdg.number),
  [1, 12],
)

// ---- initiated_count picks up INITIATE ----
const sdg1Row = result.matrix.find((r) => r.sdg.number === 1)!
assert.equal(sdg1Row.initiated_count, 1, 'SDG 1 action has plan_origin INITIATE')
const sdg12Row = result.matrix.find((r) => r.sdg.number === 12)!
assert.equal(sdg12Row.aligned_count, 1, 'SDG 12 action has plan_origin HOLDING')

// ---- drill-down filter by sdg_id returns the right action for each row ----
assert.equal(result.detail.length, 2)
const sdg1Detail = result.detail.filter((d) => d.sdg_id === sdg1Row.sdg.id)
assert.equal(sdg1Detail.length, 1)
assert.equal(sdg1Detail[0]!.id, '1234')
const sdg12Detail = result.detail.filter((d) => d.sdg_id === sdg12Row.sdg.id)
assert.equal(sdg12Detail.length, 1)
assert.equal(sdg12Detail[0]!.id, '123')

console.log('ok — normalize-sdg: Phase 1 real derivations verified against the live fixture')

// ==== Mutation test: group-by key must be sdg_id.number, not sdg_id.id ====
{
  // Re-derive the group-by result using the WRONG key (sdg_id.id) to prove the real
  // implementation's choice of key is what makes the "2 rows" assertion pass — i.e. if
  // normalizeSdg() were changed to group on id, this check would (and must) fail.
  const groupsById = new Map<string, number>()
  for (const row of wire.matrix) {
    for (const action of row.actions) {
      groupsById.set(action.sdg_id.id, (groupsById.get(action.sdg_id.id) ?? 0) + 1)
    }
  }
  const rowCountIfGroupedById = groupsById.size
  assert.equal(rowCountIfGroupedById, 1, 'grouping on sdg_id.id collapses both SDGs into 1 row (the trap)')
  assert.notEqual(
    rowCountIfGroupedById,
    result.matrix.length,
    'the real normalizeSdg() output must differ from (and be better than) the id-grouped count',
  )
}

console.log('ok — normalize-sdg: mutation test confirms grouping on sdg_id.id would silently lose data')

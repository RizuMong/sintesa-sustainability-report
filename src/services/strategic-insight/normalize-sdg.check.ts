// run: node --experimental-strip-types src/services/strategic-insight/normalize-sdg.check.ts
//
// Feeds the real e1a3b38 example-200 payload (src/services/strategic-insight/fixtures/live-sdg.json,
// verbatim `data` of api/Dashboard/SDG.yml's only remaining example) through normalizeSdg() and
// asserts the entity x SDG matrix shape described in plans/sdg-dashboard-adjustments/plan.md:
//
// - columns: 5 distinct SDGs, the duplicate-name id (EwGok8Dh3xXQ: "SDG 10" / "SDG 19", same
//   number 19) collapses to exactly one column, first-seen name wins
// - every matrix row is rectangular: cells.length === columns.length
// - take_percentage: Menara Duta x SDG 12 = 0/4 = 0%, Menara Duta x SDG 1 = 1/1 = 100%
// - cell status precedence INITIATE > TAKE > SKIP, pinned with a synthetic wire object since the
//   real fixture carries no INITIATE actions (gap A1, not live yet)
// - period / entity_id client-side filters still narrow the result
// - summary[] passed through unchanged, including sdg_roadmap's value/total
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { normalizeSdg } from './normalize-sdg.ts'

const fixturePath = fileURLToPath(new URL('./fixtures/live-sdg.json', import.meta.url))
const wire = JSON.parse(readFileSync(fixturePath, 'utf8')) as StrategicInsightSdgWireResponse

console.log('=========================================================')
console.log('columns')
console.log('=========================================================')

const result = normalizeSdg(wire)

assert.equal(wire.matrix.length, 3, 'fixture must carry 3 entities')
assert.equal(result.matrix.length, 3, 'one matrix row per entity')
assert.equal(result.columns.length, 5, `expected 5 distinct SDG columns, got ${result.columns.length}`)

const duplicateId = 'EwGok8Dh3xXQ'
const duplicateColumn = result.columns.find((c) => c.sdg_id === duplicateId)
assert.ok(duplicateColumn, 'the duplicate-name sdg id must still produce exactly one column')
assert.equal(
  result.columns.filter((c) => c.sdg_id === duplicateId).length,
  1,
  'the duplicate-name sdg id must collapse to exactly one column, not two',
)
assert.equal(duplicateColumn!.name, 'SDG 10', 'first-seen name wins (Widjajatunggal, the first entity, sees "SDG 10")')
assert.equal(duplicateColumn!.number, 19)

assert.deepEqual(
  result.columns.map((c) => c.number),
  [...result.columns.map((c) => c.number)].sort((a, b) => a - b),
  'columns must be sorted ascending by sdg_id.number',
)

// every action in the real fixture is plan_origin HOLDING (gap A1/A2), so every column must come
// out HOLDING against it — see the synthetic-wire grouping/sort test below for the INITIATE case.
assert.ok(
  result.columns.every((c) => c.group === 'HOLDING'),
  'every column must be HOLDING against the current fixture (no INITIATE actions exist yet)',
)

console.log('ok — normalize-sdg: 5 columns, duplicate-name SDG collapses to one')

console.log('=========================================================')
console.log('rectangular matrix')
console.log('=========================================================')

for (const row of result.matrix) {
  assert.equal(row.cells.length, result.columns.length, `${row.entity.name}: cells.length must equal columns.length`)
}
console.log('ok — normalize-sdg: every row is rectangular')

console.log('=========================================================')
console.log('take_percentage')
console.log('=========================================================')

const menaraDuta = result.matrix.find((r) => r.entity.name === 'Menara Duta, PT')!
assert.ok(menaraDuta, 'Menara Duta row must exist')

const sdg12Id = result.columns.find((c) => c.number === 12)!.sdg_id
const sdg1Id = result.columns.find((c) => c.number === 1)!.sdg_id

const menaraDutaSdg12 = menaraDuta.cells.find((c) => c.sdg_id === sdg12Id)!
const menaraDutaSdg1 = menaraDuta.cells.find((c) => c.sdg_id === sdg1Id)!

assert.equal(menaraDutaSdg12.action_count, 4, 'Menara Duta x SDG 12 must have 4 actions')
assert.equal(menaraDutaSdg12.take_percentage, 0, 'Menara Duta x SDG 12: 0/4 TAKE = 0%')
assert.equal(menaraDutaSdg12.status, 'SKIP')

assert.equal(menaraDutaSdg1.action_count, 1, 'Menara Duta x SDG 1 must have 1 action')
assert.equal(menaraDutaSdg1.take_percentage, 100, 'Menara Duta x SDG 1: 1/1 TAKE = 100%')
assert.equal(menaraDutaSdg1.status, 'TAKE')

console.log('ok — normalize-sdg: take_percentage matches the confirmed example numbers')

console.log('=========================================================')
console.log('cell status precedence')
console.log('=========================================================')

// Synthetic wire object: one cell (single entity, single sdg) holds both an INITIATE and a TAKE
// action. The real fixture has no INITIATE actions at all (gap A1 not live yet), so this is the
// only way to pin the precedence rule.
const precedenceWire: StrategicInsightSdgWireResponse = {
  summary: [],
  matrix: [
    {
      entity_id: { id: 'e1', name: 'Synthetic Entity' },
      entity_type: 'HOLDING',
      execution_percentage: 50,
      adoption_take_count: 1,
      adoption_skip_count: 0,
      actions: [
        {
          ids: 'a1',
          sdg_id: { id: 'sdgX', name: 'SDG 1', number: 1 },
          adoption_status: 'INITIATE',
          plan_origin: 'INITIATE',
          impact: 'Investment Impact',
          key_business_action: 'kba-1',
          detail_action_solution: '',
          baseline: null,
          target: null,
          period: 2026,
          indicator_id: null,
          pillar_id: { id: 'p1', name: 'Policies' },
          sdg_ambition_esg_alignment: null,
          created_at: null,
          updated_at: null,
        },
        {
          ids: 'a2',
          sdg_id: { id: 'sdgX', name: 'SDG 1', number: 1 },
          adoption_status: 'TAKE',
          plan_origin: 'HOLDING',
          impact: 'Operation Impact',
          key_business_action: 'kba-2',
          detail_action_solution: '',
          baseline: null,
          target: null,
          period: 2026,
          indicator_id: null,
          pillar_id: { id: 'p1', name: 'Policies' },
          sdg_ambition_esg_alignment: null,
          created_at: null,
          updated_at: null,
        },
      ],
    },
  ],
}

const precedenceResult = normalizeSdg(precedenceWire)
assert.equal(precedenceResult.matrix.length, 1)
const precedenceCell = precedenceResult.matrix[0]!.cells[0]!
assert.equal(precedenceCell.status, 'INITIATE', 'a cell with both INITIATE and TAKE actions must come out INITIATE')
assert.equal(precedenceCell.action_count, 2)
assert.equal(precedenceCell.take_percentage, 50, '1 TAKE of 2 actions = 50%')

console.log('ok — normalize-sdg: INITIATE beats TAKE beats SKIP')

console.log('=========================================================')
console.log('column group assignment and (group, number) sort')
console.log('=========================================================')

// Synthetic wire object: three SDG columns.
//   - SDG 5: only an INITIATE-origin action -> group INITIATE
//   - SDG 2: only a HOLDING-origin action -> group HOLDING
//   - SDG 8: one HOLDING-origin action and one INITIATE-origin action -> group HOLDING (rule 1,
//     ANY holding action wins) even though it has the highest number
// Expected order: [SDG 2 (HOLDING), SDG 8 (HOLDING), SDG 5 (INITIATE)] — HOLDING group first,
// ascending by number within each group, so the two groups stay contiguous.
function groupAction(id: string, name: string, number: number, planOrigin: 'HOLDING' | 'INITIATE', ids: string) {
  return {
    ids,
    sdg_id: { id, name, number },
    adoption_status: 'TAKE' as const,
    plan_origin: planOrigin,
    impact: 'Investment Impact',
    key_business_action: `kba-${ids}`,
    detail_action_solution: '',
    baseline: null,
    target: null,
    period: 2026,
    indicator_id: null,
    pillar_id: { id: 'p1', name: 'Policies' },
    sdg_ambition_esg_alignment: null,
    created_at: null,
    updated_at: null,
  }
}

const groupWire: StrategicInsightSdgWireResponse = {
  summary: [],
  matrix: [
    {
      entity_id: { id: 'e1', name: 'Synthetic Entity' },
      entity_type: 'HOLDING',
      execution_percentage: 100,
      adoption_take_count: 4,
      adoption_skip_count: 0,
      actions: [
        groupAction('sdg5', 'SDG 5', 5, 'INITIATE', 'g1'),
        groupAction('sdg2', 'SDG 2', 2, 'HOLDING', 'g2'),
        groupAction('sdg8', 'SDG 8', 8, 'HOLDING', 'g3'),
        groupAction('sdg8', 'SDG 8', 8, 'INITIATE', 'g4'),
      ],
    },
  ],
}

const groupResult = normalizeSdg(groupWire)
assert.deepEqual(
  groupResult.columns.map((c) => ({ number: c.number, group: c.group })),
  [
    { number: 2, group: 'HOLDING' },
    { number: 8, group: 'HOLDING' },
    { number: 5, group: 'INITIATE' },
  ],
  'columns must sort (group, number) with HOLDING group first and contiguous',
)

console.log('ok — normalize-sdg: column group assignment (any HOLDING action wins) and (group, number) sort')

console.log('=========================================================')
console.log('client-side filters')
console.log('=========================================================')

const unfiltered = normalizeSdg(wire, {})
const filteredByEntity = normalizeSdg(wire, { entity_id: 'daCbSej46w1n' })
assert.ok(filteredByEntity.matrix.length < unfiltered.matrix.length, 'an entity_id filter must narrow the matrix')
assert.equal(filteredByEntity.matrix.length, 1)
assert.equal(filteredByEntity.matrix[0]!.entity.id, 'daCbSej46w1n')

// every action in the fixture is period 2026, so an off-year filter empties the result while the
// real year still passes through unfiltered.
const filteredByPeriod2026 = normalizeSdg(wire, { period: '2026' })
const filteredByPeriod2099 = normalizeSdg(wire, { period: '2099' })
assert.deepEqual(filteredByPeriod2026.matrix.length, unfiltered.matrix.length, 'period=2026 matches every action in the fixture')
assert.equal(filteredByPeriod2099.detail.length, 0, 'period=2099 must filter out every action')
assert.notDeepEqual(unfiltered, filteredByPeriod2099, 'a period filter must visibly change the result')

console.log('ok — normalize-sdg: period and entity_id client-side filters narrow the result')

console.log('=========================================================')
console.log('summary passthrough')
console.log('=========================================================')

assert.deepEqual(result.summary, wire.summary, 'summary[] must be passed through unchanged')
const roadmap = result.summary.find((s) => s.key === 'sdg_roadmap')!
assert.equal(roadmap.value, 9)
assert.equal(roadmap.total, 17)

console.log('ok — normalize-sdg: summary[] passthrough carries sdg_roadmap 9/17')

console.log('\nALL CHECKS PASSED')

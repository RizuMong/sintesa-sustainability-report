// run: node --experimental-strip-types src/services/strategic-insight/normalize-sdg.check.ts
//
// Feeds the real e1a3b38 example-200 payload (src/services/strategic-insight/fixtures/live-sdg.json,
// verbatim `data` of api/Dashboard/SDG.yml's only remaining example) through normalizeSdg() and
// asserts the entity x SDG matrix shape described in plans/sdg-dashboard-adjustments/plan.md:
//
// - columns: 5 distinct SDGs, grouped by Master SDG adoption (fixtures/master-sdg.json, the
//   api/Master SDG/Index.yml example) — never by plan_origin, the duplicate-name id (EwGok8Dh3xXQ: "SDG 10" / "SDG 19", same
//   number 19) collapses to exactly one column, first-seen name wins
// - every matrix row is rectangular: cells.length === columns.length
// - take_percentage: Menara Duta x SDG 12 = 0/4 = 0%, Menara Duta x SDG 1 = 1/1 = 100%
// - cell status precedence INITIATE > TAKE > SKIP, pinned with a synthetic wire object since the
//   real fixture carries no INITIATE actions (gap A1, not live yet)
// - period / entity_id client-side filters still narrow the result
// - holding_count counts only mandates actually TAKEn
// - summary[] recomputed from the filtered actions (alignment never exceeds 100%)
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { normalizeSdg } from './normalize-sdg.ts'

const fixturePath = fileURLToPath(new URL('./fixtures/live-sdg.json', import.meta.url))
const wire = JSON.parse(readFileSync(fixturePath, 'utf8')) as StrategicInsightSdgWireResponse
const masterSdgs = JSON.parse(
  readFileSync(fileURLToPath(new URL('./fixtures/master-sdg.json', import.meta.url)), 'utf8'),
) as StrategicInsightMasterSdg[]

console.log('=========================================================')
console.log('columns')
console.log('=========================================================')

const result = normalizeSdg(wire, masterSdgs)

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

// Every action in the fixture is plan_origin HOLDING, yet only SDG 3 and 12 are "Adopted" in
// Master SDG — so SDG 1/9/19 must land in the bottom-up group. This is the bug where a non-adopted
// SDG 1 rendered under "Holding SDGs".
assert.deepEqual(
  result.columns.map((c) => ({ number: c.number, group: c.group })),
  [
    { number: 3, group: 'HOLDING' },
    { number: 12, group: 'HOLDING' },
    { number: 1, group: 'INITIATE' },
    { number: 9, group: 'INITIATE' },
    { number: 19, group: 'INITIATE' },
  ],
  'columns must group by Master SDG adoption, sorted (group, number)',
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
console.log('holding_count = mandates actually taken')
console.log('=========================================================')

// Menara Duta carries 8 HOLDING-origin actions: 2 TAKE, 6 SKIP. Only the 2 it took count.
assert.equal(menaraDuta.holding_count, 2, 'Menara Duta: 2 taken of 8 available mandates')
assert.deepEqual(
  result.matrix.map((r) => r.holding_count),
  [8, 2, 8],
  'holding_count per entity must count TAKE mandates only',
)
console.log('ok — normalize-sdg: holding_count ignores skipped/pending mandates')

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

const precedenceResult = normalizeSdg(precedenceWire, [])
assert.equal(precedenceResult.matrix.length, 1)
const precedenceCell = precedenceResult.matrix[0]!.cells[0]!
assert.equal(precedenceCell.status, 'INITIATE', 'a cell with both INITIATE and TAKE actions must come out INITIATE')
assert.equal(precedenceCell.action_count, 2)
assert.equal(precedenceCell.take_percentage, 50, '1 TAKE of 2 actions = 50%')

console.log('ok — normalize-sdg: INITIATE beats TAKE beats SKIP')

console.log('=========================================================')
console.log('column group assignment and (group, number) sort')
console.log('=========================================================')

// Synthetic wire object: four SDG columns, SDG 2 and 8 adopted in the synthetic master list.
//   - SDG 5: not adopted, INITIATE-origin action -> group INITIATE
//   - SDG 2: adopted -> group HOLDING
//   - SDG 8: adopted, even with an INITIATE-origin action in it -> group HOLDING
//   - SDG 1: NOT adopted but has a HOLDING-origin action -> group INITIATE (plan_origin never
//     decides the group — that inference is the reported "SDG 1 under Holding SDGs" bug)
// Expected order: [SDG 2, SDG 8 (HOLDING), SDG 1, SDG 5 (INITIATE)] — HOLDING group first,
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
        groupAction('sdg1', 'SDG 1', 1, 'HOLDING', 'g5'),
      ],
    },
  ],
}

const groupMaster = [
  { id: 'sdg2', sdg_no: 2, sdg_number: 'SDG 2', sdg_name: '', status: 'Adopted' },
  { id: 'sdg8', sdg_no: 8, sdg_number: 'SDG 8', sdg_name: '', status: 'Adopted' },
  { id: 'sdg1', sdg_no: 1, sdg_number: 'SDG 1', sdg_name: '', status: 'Not Adopted' },
  { id: 'sdg5', sdg_no: 5, sdg_number: 'SDG 5', sdg_name: '', status: 'Not Adopted' },
]
const groupResult = normalizeSdg(groupWire, groupMaster)
assert.deepEqual(
  groupResult.columns.map((c) => ({ number: c.number, group: c.group })),
  [
    { number: 2, group: 'HOLDING' },
    { number: 8, group: 'HOLDING' },
    { number: 1, group: 'INITIATE' },
    { number: 5, group: 'INITIATE' },
  ],
  'columns must sort (group, number) with HOLDING group first and contiguous',
)

console.log('ok — normalize-sdg: column group from adoption status, not plan_origin; (group, number) sort')

console.log('=========================================================')
console.log('client-side filters')
console.log('=========================================================')

const unfiltered = normalizeSdg(wire, masterSdgs, {})
const filteredByEntity = normalizeSdg(wire, masterSdgs, { entity_id: 'daCbSej46w1n' })
assert.ok(filteredByEntity.matrix.length < unfiltered.matrix.length, 'an entity_id filter must narrow the matrix')
assert.equal(filteredByEntity.matrix.length, 1)
assert.equal(filteredByEntity.matrix[0]!.entity.id, 'daCbSej46w1n')

// every action in the fixture is period 2026, so an off-year filter empties the result while the
// real year still passes through unfiltered.
const filteredByPeriod2026 = normalizeSdg(wire, masterSdgs, { period: '2026' })
const filteredByPeriod2099 = normalizeSdg(wire, masterSdgs, { period: '2099' })
assert.deepEqual(filteredByPeriod2026.matrix.length, unfiltered.matrix.length, 'period=2026 matches every action in the fixture')
assert.equal(filteredByPeriod2099.detail.length, 0, 'period=2099 must filter out every action')
assert.notDeepEqual(unfiltered, filteredByPeriod2099, 'a period filter must visibly change the result')

console.log('ok — normalize-sdg: period and entity_id client-side filters narrow the result')

console.log('=========================================================')
console.log('summary recomputed from filtered actions')
console.log('=========================================================')

// 24 actions, 15 on adopted SDG 3/12 (62.5% -> 63), 18 of 24 mandates taken, 9 on non-adopted SDGs.
const summaryValue = (r: StrategicInsightSdgResponse, key: string) => r.summary.find((s) => s.key === key)!
assert.deepEqual(
  result.summary.map((s) => [s.key, s.value, s.total]),
  [
    ['sdg_roadmap', 9, 17],
    ['strategic_alignment', 63, undefined],
    ['execution_rate', 75, undefined],
    ['bottom_up_initiatives', 9, undefined],
  ],
)
assert.equal(summaryValue(result, 'strategic_alignment').description, wire.summary.find((s) => s.key === 'strategic_alignment')!.description)

// Menara Duta alone: 8 actions, 2/8 taken (25%), 3 bottom-up.
const menaraOnly = normalizeSdg(wire, masterSdgs, { entity_id: menaraDuta.entity.id })
assert.equal(summaryValue(menaraOnly, 'execution_rate').value, 25, 'summary must follow the entity filter')
assert.ok(summaryValue(menaraOnly, 'strategic_alignment').value <= 100)
assert.equal(
  summaryValue(menaraOnly, 'bottom_up_initiatives').value,
  menaraOnly.detail.filter((d) => !masterSdgs.some((m) => m.id === d.sdg_id && m.status === 'Adopted')).length,
  'bottom-up count must equal the actions under the Bottom-Up Initiatives columns',
)

console.log('ok — normalize-sdg: summary recomputed, alignment <= 100%, follows filters')

console.log('\nALL CHECKS PASSED')

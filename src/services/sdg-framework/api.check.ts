// run: node --experimental-strip-types src/services/sdg-framework/api.check.ts
import assert from 'node:assert/strict'
import {
  isDuplicateMatrixRowCode,
  canDeleteMatrixRow,
  isApplicableEntitiesValid,
  isInvestmentImpactAllowed,
} from './validation.ts'

const rows: ActionPlanMatrixRow[] = [
  {
    id: 'r1',
    no_code: 'AP-01',
    pillar_id: 'p1',
    key_business_action: 'Reduce emissions',
    detail_action_solution: 'Switch to renewables',
    action_indicator: { id: 'i1', name: 'CO2 reduced' },
    alignment: 'SDG 13',
    created_by_level: 'Holding',
    taken_by_count: 0,
  },
]

// AC-53: no_code unique within one framework
assert.equal(isDuplicateMatrixRowCode(rows, 'AP-01'), true)
assert.equal(isDuplicateMatrixRowCode(rows, 'ap-01'), true, 'should be case-insensitive')
assert.equal(isDuplicateMatrixRowCode(rows, 'AP-01', 'r1'), false, 'editing itself is not a duplicate')
assert.equal(isDuplicateMatrixRowCode(rows, 'AP-02'), false)

// AC-54: delete blocked once a row has been taken by a subsidiary
assert.equal(canDeleteMatrixRow(rows[0]!), true)
assert.equal(canDeleteMatrixRow({ ...rows[0]!, taken_by_count: 1 }), false)

// AC-49/50/51: applicable entities required (min 1) only when not applied to all
assert.equal(isApplicableEntitiesValid(true, []), true)
assert.equal(isApplicableEntitiesValid(false, []), false)
assert.equal(isApplicableEntitiesValid(false, ['e1']), true)

// AC-47/48: Investment Impact only selectable for whitelisted entities
assert.equal(isInvestmentImpactAllowed(['SDS']), true)
assert.equal(isInvestmentImpactAllowed(['Unrelated Co']), false)
assert.equal(isInvestmentImpactAllowed([]), false)

console.log('ok')

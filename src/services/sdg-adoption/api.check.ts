// run: node --experimental-strip-types src/services/sdg-adoption/api.check.ts
import assert from 'node:assert/strict'
import { canDeactivateSdgGoal } from './validation.ts'

const goal: SdgGoal = {
  id: '1',
  number: 1,
  name: 'No Poverty',
  icon_url: 'https://example.com/sdg-1.png',
  adopted: true,
  updated_at: '2026-01-01T00:00:00Z',
  updated_by: 'admin@mekari.com',
  has_active_action_plan: false,
}

// AC-45: un-adopting is allowed when the goal has no active Action Plan Matrix rows
assert.equal(canDeactivateSdgGoal(goal), true)
// blocked once the goal has active Action Plan Matrix rows
assert.equal(canDeactivateSdgGoal({ ...goal, has_active_action_plan: true }), false)

console.log('ok')

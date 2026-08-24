// run: node --experimental-strip-types src/services/workflow-configuration/api.check.ts
import assert from 'node:assert/strict'
import { hasActiveWorkflowConflict } from './validation.ts'

const existing: WorkflowConfig[] = [
  { id: 'wf-1', workflow_name: 'GRI_QUANTITATIVE', entity_id: 'entity-a', status: 'Active', approval_lines: [] },
  { id: 'wf-2', workflow_name: 'GRI_QUALITATIVE', entity_id: 'entity-a', status: 'Active', approval_lines: [] },
  { id: 'wf-3', workflow_name: 'GRI_QUANTITATIVE', entity_id: 'entity-b', status: 'Inactive', approval_lines: [] },
]

// AC-31: same entity + same workflow_name + both Active → conflict
assert.equal(
  hasActiveWorkflowConflict(existing, { entity_id: 'entity-a', workflow_name: 'GRI_QUANTITATIVE' }),
  true,
)

// different workflow_name on the same entity → no conflict
assert.equal(
  hasActiveWorkflowConflict(existing, { entity_id: 'entity-a', workflow_name: 'SDG_ACTION_PLAN' }),
  false,
)

// same entity + workflow_name but existing one is Inactive → no conflict
assert.equal(
  hasActiveWorkflowConflict(existing, { entity_id: 'entity-b', workflow_name: 'GRI_QUANTITATIVE' }),
  false,
)

// editing a record in place must exclude itself from the conflict check
assert.equal(
  hasActiveWorkflowConflict(existing, { entity_id: 'entity-a', workflow_name: 'GRI_QUANTITATIVE' }, 'wf-1'),
  false,
)

console.log('ok')

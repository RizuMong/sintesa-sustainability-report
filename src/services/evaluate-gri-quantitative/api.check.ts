// run: node --experimental-strip-types src/services/evaluate-gri-quantitative/api.check.ts
import assert from 'node:assert/strict'
import { hasDuplicateSubmission, isReadOnly, latestRejectionNote } from './validation.ts'

const ref = (id: string, name = id): Ref2 => ({ id, name })
const summary = (overrides: Partial<EvaluateGriQuantitativeSummary>): EvaluateGriQuantitativeSummary => ({
  id: 'S1',
  ids: 'S1',
  company_id: 1,
  created_at: 0,
  created_by: 0,
  created_by_project_user: '',
  current_stage_order: 1,
  entity_id: ref('E1'),
  period_id: ref('P1'),
  template_id: ref('T1'),
  submission_type_id: ref('GRI-QUANT'),
  flow_status: 'draft',
  approval_logs: [],
  submitted_at: null,
  submitted_by: '',
  updated_at: 0,
  updated_by: 0,
  ...overrides,
})

// AC-86 — duplicate guard: same entity+period+template while still in flight blocks a new create
const items: EvaluateGriQuantitativeSummary[] = [summary({})]
assert.equal(hasDuplicateSubmission(items, 'E1', 'P1', 'T1'), true)
assert.equal(hasDuplicateSubmission(items, 'E1', 'P1', 'T1', 'S1'), false, 'editing itself is not a duplicate')
assert.equal(hasDuplicateSubmission(items, 'E2', 'P1', 'T1'), false, 'different entity is fine')

const rejected = [summary({ id: 'S2', flow_status: 'rejected' })]
assert.equal(hasDuplicateSubmission(rejected, 'E1', 'P1', 'T1'), false, 'rejected does not block a resubmission')

const cancelled = [summary({ id: 'S3', flow_status: 'cancelled' })]
assert.equal(hasDuplicateSubmission(cancelled, 'E1', 'P1', 'T1'), false, 'cancelled does not block')

// AC-84 — submitted (and anything not draft/rejected) is read-only; rejected reopens for edit
assert.equal(isReadOnly('draft'), false)
assert.equal(isReadOnly('rejected'), false)
assert.equal(isReadOnly('submitted'), true)
assert.equal(isReadOnly('approved'), true)
assert.equal(isReadOnly('cancelled'), true)
assert.equal(isReadOnly('sent'), true, 'unknown/live flow_status values are treated as locked, defensively')

// AC-85 — reopened rejected submissions show the latest reviewer note
const approvalLogs: ApprovalLog[] = [
  {
    approval_type: 'Holding Approval',
    approvers: [
      { acted_at: 100, action: 'REJECTED', notes: 'first pass', position: ref('POS1'), user: { id: 'U1', name: 'A', email: 'a@x.com' } },
    ],
    minimum_action: 1,
    request_id: 'R1',
    stage_order: 1,
    status: 'REJECTED',
  },
  {
    approval_type: 'By PIC',
    approvers: [
      { acted_at: 200, action: 'REJECTED', notes: 'latest note', position: ref('POS2'), user: { id: 'U2', name: 'B', email: 'b@x.com' } },
      { acted_at: null, action: 'PENDING', notes: null, position: ref('POS3'), user: { id: 'U3', name: 'C', email: 'c@x.com' } },
    ],
    minimum_action: 1,
    request_id: 'R1',
    stage_order: 2,
    status: 'REJECTED',
  },
]
assert.equal(latestRejectionNote(approvalLogs), 'latest note')
assert.equal(latestRejectionNote([]), null)

console.log('ok')

// run: node --experimental-strip-types src/services/evaluate-gri-quantitative/api.check.ts
import assert from 'node:assert/strict'
import {
  approvalSummary,
  fromSubmissionValues,
  groupItemsByCategory,
  hasDuplicateSubmission,
  isDetailReadOnly,
  isReadOnly,
  latestRejectionNote,
  requestorSummary,
  toSubmissionValue,
} from './validation.ts'
import { toDisplayRows } from '../master-key-indicator-quantitative/sections.ts'

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

// GROU-650 — approval context is always view-only; requestor context keeps isReadOnly()'s behaviour
assert.equal(isDetailReadOnly('rejected', true), true, 'GROU-650: rejected is view-only in the approval context')
assert.equal(isDetailReadOnly('draft', true), true)
assert.equal(isDetailReadOnly('rejected', false), false, 'requestor still revises a rejected submission')
assert.equal(isDetailReadOnly('draft', false), false)

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

// summary blocks — requestor counts by flow_status, approval also counts what I personally approved
const board: EvaluateGriQuantitativeSummary[] = [
  summary({ id: 'A', flow_status: 'draft' }),
  summary({ id: 'B', flow_status: 'submitted', approval_logs: approvalLogs }),
  summary({ id: 'C', flow_status: 'approved' }),
  summary({ id: 'D', flow_status: 'rejected' }),
  summary({ id: 'E', flow_status: 'draft' }),
  summary({ id: 'G', flow_status: 'sent' as SubmissionFlowStatus }),
]
// 'sent' counts as awaiting alongside 'submitted' — G1 in the open-gaps doc
assert.deepEqual(requestorSummary(board), { draft: 2, awaitingApproval: 2, approved: 1, rejected: 1 })

const approvedByMeLogs: ApprovalLog[] = [
  {
    approval_type: 'By PIC',
    approvers: [
      { acted_at: 300, action: 'APPROVED', notes: null, position: ref('POS1'), user: { id: 'U9', name: 'Me', email: 'Me@x.com' } },
    ],
    minimum_action: 1,
    request_id: 'R2',
    stage_order: 1,
    status: 'APPROVED',
  },
]
const approvalBoard = [...board, summary({ id: 'F', flow_status: 'submitted', approval_logs: approvedByMeLogs })]
assert.deepEqual(approvalSummary(approvalBoard, 'me@x.com'), {
  awaitingApproval: 3,
  approvedByMe: 1,
  approved: 1,
  rejected: 1,
})
assert.equal(approvalSummary(approvalBoard, null).approvedByMe, 0, 'no identity means nothing counts as mine')

// matrix cell <-> Update.yml items[].values[] mapping
const numberMetric = {
  key: 'new_hire_count',
  name: 'New Hire Count',
  input_type: 'NUMBER' as MkiQuantInputType,
  unit: { id: '1', name: 'Person' },
}
assert.deepEqual(toSubmissionValue(numberMetric, 1, '12'), {
  row_key: 'row_1',
  metric_key: 'new_hire_count',
  metric_name: 'New Hire Count',
  input_type: 'NUMBER',
  value_number: 12,
  value_text: null,
  value_date: null,
  unit: { id: '1', name: 'Person' },
})
const dateMetric = {
  key: 'effective_date',
  name: 'Effective Date',
  input_type: 'DATE' as MkiQuantInputType,
  unit: null,
}
assert.equal(toSubmissionValue(dateMetric, 2, '2026-01-15').value_date, Date.parse('2026-01-15'))
assert.deepEqual(toSubmissionValue(dateMetric, 2, '2026-01-15').unit, {}, 'unitless metric sends {}, not null')
const textMetric = { key: 'is_reported', name: 'Is Reported', input_type: 'YES_NO' as MkiQuantInputType, unit: null }
assert.equal(toSubmissionValue(textMetric, 1, true).value_text, 'YES')
assert.equal(toSubmissionValue(textMetric, 1, false).value_text, 'NO', 'YES_NO false is NO, not null')
assert.equal(toSubmissionValue(textMetric, 1, null).value_text, null, 'untouched toggle stays null')
assert.equal(
  fromSubmissionValues([toSubmissionValue(textMetric, 1, false)])['row_1:is_reported'],
  false,
  'NO seeds the toggle back as boolean false',
)
assert.equal(toSubmissionValue(numberMetric, 1, '').value_number, null, 'blank cell stays null, not 0')

assert.deepEqual(
  fromSubmissionValues([toSubmissionValue(numberMetric, 1, '12'), toSubmissionValue(dateMetric, 2, '2026-01-15')]),
  { 'row_1:new_hire_count': 12, 'row_2:effective_date': '2026-01-15' },
)

// detail view groups items under their category, first-seen order
const item = (id: string, categoryId: string): EvaluateGriQuantitativeItem => ({
  id,
  ids: id,
  company_id: 1,
  created_at: 0,
  created_by: 0,
  category_id: ref(categoryId, categoryId),
  parent_id: ref('T1'),
  columns: [],
  metrics: [],
  rows: [],
  updated_at: 0,
  updated_by: 0,
})
const grouped = groupItemsByCategory([item('i1', 'General'), item('i2', 'Energy'), item('i3', 'General')])
assert.deepEqual(
  grouped.map((g) => [g.name, g.items.map((i) => i.id)]),
  [
    ['General', ['i1', 'i3']],
    ['Energy', ['i2']],
  ],
)

// GROU-651 — save() builds values[] off toDisplayRows(kind === 'row') so render and save can never
// disagree about what counts as a data row.

// legacy item (flat rows, no unit_mode) must produce the exact same values[] as on main: same
// length, same row_keys, in row order.
{
  const legacyRows: EvaluateGriQuantitativeRow[] = [
    { sequence: 1, labels: { a: 'A1' } },
    { sequence: 2, labels: { a: 'A2' } },
  ]
  const legacyMetrics = [numberMetric]
  const cells: Record<string, string | number | boolean | null> = { 'row_1:new_hire_count': '5', 'row_2:new_hire_count': '7' }
  const values = toDisplayRows(legacyRows, {})
    .filter((r) => r.kind === 'row')
    .flatMap((row) =>
      legacyMetrics.map((m) => toSubmissionValue(m, row.sequence, cells[`row_${row.sequence}:${m.key}`])),
    )
  assert.equal(values.length, 2, 'legacy item produces one value per (row, metric), same as main')
  assert.deepEqual(values.map((v) => v.row_key), ['row_1', 'row_2'], 'same row_keys, same order as main')
}

// an item with two sections produces values[] with no section row_keys, and data rows keep their
// original sequences.
{
  const rows: EvaluateGriQuantitativeRow[] = [
    { sequence: 1, row_type: 'SECTION', title: 'Section A', labels: {} },
    { sequence: 2, labels: { a: 'A2' }, parent_sequence: 1 },
    { sequence: 3, row_type: 'SECTION', title: 'Section B', labels: {} },
    { sequence: 4, labels: { a: 'A4' }, parent_sequence: 3 },
  ]
  const cells: Record<string, string | number | boolean | null> = {}
  const values = toDisplayRows(rows, {})
    .filter((r) => r.kind === 'row')
    .flatMap((row) => [numberMetric].map((m) => toSubmissionValue(m, row.sequence, cells[`row_${row.sequence}:${m.key}`])))
  assert.equal(values.length, 2, 'only the two data rows produce values, sections produce none')
  assert.deepEqual(values.map((v) => v.row_key), ['row_2', 'row_4'], 'data rows keep their original sequences, no section row_keys')
}

// fromSubmissionValues still rehydrates a legacy saved payload after grouping is applied to render
{
  const saved = [toSubmissionValue(numberMetric, 1, '12'), toSubmissionValue(numberMetric, 2, '34')]
  const cells = fromSubmissionValues(saved)
  const rows: EvaluateGriQuantitativeRow[] = [
    { sequence: 1, row_type: 'SECTION', title: 'Section A', labels: {} },
    { sequence: 2, labels: { a: 'A2' }, parent_sequence: 1 },
  ]
  const displayRows = toDisplayRows(rows, {}).filter((r) => r.kind === 'row')
  assert.equal(cells[`row_${displayRows[0].sequence}:new_hire_count`], 34, 'saved cell still resolves after grouping (row 2 is the only data row here)')
}

console.log('ok')

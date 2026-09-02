// pure, dependency-free — kept separate from api.ts so api.check.ts can import it via a relative
// path without Node having to resolve the '@/' tsconfig alias.

// AC-86 — duplicate guard: one entity+period+template combo can only have one submission that is
// still "in flight" (draft/submitted/approved). A rejected or cancelled one frees the slot back up.
const BLOCKING_STATUSES: SubmissionFlowStatus[] = ['draft', 'submitted', 'approved']

export function hasDuplicateSubmission(
  items: EvaluateGriQuantitativeSummary[],
  entityId: string,
  periodId: string,
  templateId: string,
  excludeId?: string,
): boolean {
  return items.some(
    (item) =>
      item.id !== excludeId &&
      item.entity_id.id === entityId &&
      item.period_id.id === periodId &&
      item.template_id.id === templateId &&
      BLOCKING_STATUSES.includes(item.flow_status),
  )
}

// AC-84 — submitted is read-only; only a rejected submission reopens for edit/resubmit. Anything
// that isn't 'draft' or 'rejected' (e.g. an in-review status) is treated as locked, defensively —
// safer than an exact-match on 'submitted' given the live API has been observed to answer flow
// statuses ('sent') outside the §3-locked SubmissionFlowStatus union.
export function isReadOnly(flowStatus: SubmissionFlowStatus | string): boolean {
  return flowStatus !== 'draft' && flowStatus !== 'rejected'
}

// latest reviewer note shown when a rejected submission reopens (AC-85) — most recent approver
// action with a note, across every approval stage.
export function latestRejectionNote(approvalLogs: ApprovalLog[]): string | null {
  const notes = approvalLogs
    .flatMap((log) => log.approvers)
    .filter((approver): approver is ApprovalApprover & { acted_at: number; notes: string } =>
      Boolean(approver.notes && approver.acted_at),
    )
    .sort((a, b) => b.acted_at - a.acted_at)
  return notes[0]?.notes ?? null
}

// "In flight" is anything that is not one of the four terminal-ish statuses, rather than an exact
// match on 'submitted' — the live API has been observed to answer 'sent' for the same state (see
// G1 in docs/sustainability-reporting-portal-open-gaps.md), and isReadOnly() already hedges the
// same way.
function isAwaitingApproval(item: EvaluateGriQuantitativeSummary): boolean {
  return !['draft', 'approved', 'rejected', 'cancelled'].includes(item.flow_status)
}

// Requestor summary blocks — Draft / Awaiting Approval / Approved / Rejected.
export function requestorSummary(items: EvaluateGriQuantitativeSummary[]) {
  const count = (status: SubmissionFlowStatus) => items.filter((i) => i.flow_status === status).length
  return {
    draft: count('draft'),
    awaitingApproval: items.filter(isAwaitingApproval).length,
    approved: count('approved'),
    rejected: count('rejected'),
  }
}

// Approval summary blocks — Awaiting Approval / Approved by Me / Approved / Rejected.
// "by me" is matched on the approver's email because that is the only identity the embed token
// yields (POST /v1/tools/auth, method: decrypt). Rows with no email match simply don't count.
export function approvalSummary(items: EvaluateGriQuantitativeSummary[], myEmail?: string | null) {
  const actedByMe = (item: EvaluateGriQuantitativeSummary, action: ApprovalAction) =>
    Boolean(myEmail) &&
    item.approval_logs.some((log) =>
      log.approvers.some((a) => a.action === action && a.user.email.toLowerCase() === myEmail!.toLowerCase()),
    )
  return {
    awaitingApproval: items.filter(isAwaitingApproval).length,
    approvedByMe: items.filter((i) => actedByMe(i, 'APPROVED')).length,
    approved: items.filter((i) => i.flow_status === 'approved').length,
    rejected: items.filter((i) => i.flow_status === 'rejected').length,
  }
}

// --- submission matrix cell values -------------------------------------------------------------
// The Update contract wants one flat `values` entry per (row, metric) cell with the value split
// across value_number/value_text/value_date by the metric's input_type; the UI holds one plain
// value per cell instead. These two map between the shapes.

export function rowKey(sequence: number): string {
  return `row_${sequence}`
}

export function cellKey(rowSequence: number, metricKey: string): string {
  return `${rowKey(rowSequence)}:${metricKey}`
}

export function toSubmissionValue(
  metric: { key: string; name: string; input_type: MkiQuantInputType; unit: Ref2 | null },
  rowSequence: number,
  raw: string | number | boolean | null | undefined,
): EvaluateGriQuantitativeValue {
  const empty = raw === '' || raw === null || raw === undefined
  const isNumeric = metric.input_type === 'NUMBER' || metric.input_type === 'PERCENTAGE'
  const isDate = metric.input_type === 'DATE'
  // YES_NO is a toggle in the UI (boolean) but the contract wants the literal 'YES'/'NO'
  const isYesNo = metric.input_type === 'YES_NO'
  return {
    row_key: rowKey(rowSequence),
    metric_key: metric.key,
    metric_name: metric.name,
    input_type: metric.input_type,
    value_number: !empty && isNumeric ? Number(raw) : null,
    value_text: empty || isNumeric || isDate ? null : isYesNo ? (raw ? 'YES' : 'NO') : String(raw),
    value_date: !empty && isDate ? new Date(raw as string | number).getTime() : null,
    // metric with no unit sends `{}`, not null — Update contract's shape
    unit: metric.unit ? { id: metric.unit.id, name: metric.unit.name } : {},
  }
}

// inverse, for seeding the form from whatever the detail endpoint echoes back
export function fromSubmissionValues(
  values: EvaluateGriQuantitativeValue[] = [],
): Record<string, string | number | boolean | null> {
  const cells: Record<string, string | number | boolean | null> = {}
  for (const v of values) {
    // mirror of toSubmissionValue's 'YES'/'NO' <-> boolean toggle mapping
    const text = v.input_type === 'YES_NO' && v.value_text !== null ? v.value_text === 'YES' : v.value_text
    cells[`${v.row_key}:${v.metric_key}`] =
      v.value_number ?? (v.value_date ? new Date(v.value_date).toISOString().slice(0, 10) : null) ?? text
  }
  return cells
}

// Detail view groups the disclosure items under their category heading, in the order the categories
// first appear in the response.
export function groupItemsByCategory(items: EvaluateGriQuantitativeItem[]) {
  const groups: { id: string; name: string; items: EvaluateGriQuantitativeItem[] }[] = []
  for (const item of items) {
    const category = item.category_id ?? { id: 'uncategorized', name: 'Uncategorized' }
    const group = groups.find((g) => g.id === category.id)
    if (group) group.items.push(item)
    else groups.push({ id: category.id, name: category.name, items: [item] })
  }
  return groups
}

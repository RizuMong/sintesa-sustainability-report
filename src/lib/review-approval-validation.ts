// pure, dependency-free — kept separate so review-approval-validation.check.ts can import it via a
// relative path without Node having to resolve the '@/' tsconfig alias.

// AC-60/61 — reject requires a non-blank Reviewer Notes textarea.
export function canReject(notes: string): boolean {
  return notes.trim().length > 0
}

// AC-62 — Bulk Approve only ever acts on rows that are actually awaiting a decision; a 'sent' status
// is treated as equivalent to 'submitted' since the live Index Approval example answers 'sent' for
// an in-review row outside the §3-locked SubmissionFlowStatus union (see evaluate-gri-quantitative's
// isReadOnly comment for the same observation).
const ACTIONABLE_STATUSES = ['submitted', 'sent']

export function selectableApprovalIds<T extends { id: string; flow_status: string }>(rows: T[]): string[] {
  return rows.filter((row) => ACTIONABLE_STATUSES.includes(row.flow_status)).map((row) => row.id)
}

// GROU-659 — the requestor can pull a submission back out of approval ("Revise Submission",
// POST /cancel → flow_status returns to 'draft'). Expressed as "not settled" rather than an exact
// match on 'submitted' for the same reason ACTIONABLE_STATUSES lists 'sent': the live API answers
// both spellings for the in-review state. The approver context never gets this action.
const SETTLED_STATUSES = ['draft', 'approved', 'rejected', 'cancelled']

export function canRevise(flowStatus: string, fromApproval: boolean): boolean {
  return !fromApproval && !SETTLED_STATUSES.includes(flowStatus)
}

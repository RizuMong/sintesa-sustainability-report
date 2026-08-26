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

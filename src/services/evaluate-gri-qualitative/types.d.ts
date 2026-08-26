// ponytail: temporary stub of Stream D's module — reconcile with Stream D at merge (delete this
// file once the real one lands). Built only far enough for the Review & Approval Tab 2 queue
// (FSD 2.4). Reuses Stream C's Ref2 / ApprovalLog / SubmissionFlowStatus globals — do not redeclare.
declare global {
  // matches Stream D's own §5 type name (GriQualSubmission) so a later swap is a rename, not a rewrite
  interface GriQualSubmission {
    id: string
    entity_id: Ref2
    period_id: Ref2
    template_id: Ref2
    flow_status: SubmissionFlowStatus | string
    current_stage_order: number
    approval_logs: ApprovalLog[]
    submitted_at: number | null
    submitted_by: string | null
  }
}

export {}

// ponytail: temporary stub of Stream F's module — reconcile with Stream F at merge (delete this
// file once the real one lands). Built only far enough for the Review & Approval Tab 3 queue (FSD 2.4).
declare global {
  interface RealizationReport {
    id: string
    action_plan_id: string
    period_id: Ref2
    action_indicator: { id: string; name: string; input_type: MkiInputType; evidence: string }
    value: string | number | boolean | null
    evidence_url: string | null
    flow_status: SubmissionFlowStatus | string
    reviewer_notes: string | null
    // ponytail: not in Stream F's §5 type list — added so the approval line (AC-55..58) can render
    // for this tab like the other two. Harmless additive field; drop if F's real type omits it.
    current_stage_order?: number
    approval_logs?: ApprovalLog[]
  }
}

export {}

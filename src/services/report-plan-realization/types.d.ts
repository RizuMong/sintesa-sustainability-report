declare global {
  // ponytail: SubmissionFlowStatus is owned by Stream C (src/services/evaluate-gri-quantitative/
  // types.d.ts) and has the identical value set — swap this alias for that global once Stream C
  // lands (do not redeclare SubmissionFlowStatus here, that would be a duplicate global).
  type RealizationFlowStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'cancelled'

  interface RealizationReport {
    id: string
    action_plan_id: string // FK ActionPlanSubmissionItem, created backend-side on Take (AC-92)
    period_id: { id: string; name: string }
    action_indicator: { id: string; name: string; input_type: MkiInputType; evidence: MkiEvidenceAttachment }
    value: string
    evidence_url: string | null
    flow_status: RealizationFlowStatus
    reviewer_notes: string | null
  }
}

export {}

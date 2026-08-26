declare global {
  // FSD 2.13, AC-105…108 — Subsidiary-submitted request to change fields on an already
  // Active/Taken Action Plan Matrix row. Field names are exact per plan §5-I — Stream E's
  // Holding approval page (`/action-plan-change-request/approval`) consumes this type verbatim.
  interface ActionPlanChangeRequest {
    id: string
    action_plan_id: string
    existing: Partial<ActionPlanMatrixRow>
    proposed: Partial<ActionPlanMatrixRow>
    notes: string
    status: 'Pending Review' | 'Approved' | 'Rejected'
    request_date: string
    request_by: string
    // unset until a Holding reviewer decides (AC-64…66) — kept nullable rather than empty-string
    // sentinels so consumers can tell "not yet reviewed" from "reviewed with no notes".
    approved_date: string | null
    approved_by: string | null
    reviewer_notes: string | null
  }
}

export {}

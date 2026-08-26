// ponytail: temporary stub of Stream I's module — reconcile with Stream I at merge (delete this
// file once the real one lands). Built only far enough for the Holding approval page (FSD 2.5).
declare global {
  interface ActionPlanChangeRequest {
    id: string
    action_plan_id: string
    // ponytail: typed as Record<string, unknown> until Stream B's ActionPlanMatrixRow global lands
    // (B owns that type — not redeclared here); swap to Partial<ActionPlanMatrixRow> at merge.
    existing: Record<string, unknown>
    proposed: Record<string, unknown>
    notes: string
    status: 'Pending Review' | 'Approved' | 'Rejected'
    request_date: string
    request_by: string
    approved_date: string | null
    approved_by: string | null
    reviewer_notes: string | null
  }
}

export {}

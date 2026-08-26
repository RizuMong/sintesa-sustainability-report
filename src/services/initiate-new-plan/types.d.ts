declare global {
  // FSD 2.12, AC-98…104 — Subsidiary-initiated SDG action plan. `ActionPlanMatrixRow` is owned by
  // Stream B (src/services/sdg-framework/types.d.ts) — do not redeclare it here.
  interface InitiatedPlan {
    id: string
    sdg_id: string
    sdg_adopted: boolean
    created_by_level: 'Subsidiary'
    origin_entity_id: string
    unverified: boolean
    status: 'Active' | 'Pending Review' | 'Taken'
    rows: ActionPlanMatrixRow[]
  }
}

export {}

declare global {
  // FSD 2.11 · AC-92...94
  type TakeSkipDecision = 'Take' | 'Skip' | null
  type ActionPlanItemStatus = 'Pending Response' | 'Taken' | 'Skipped'

  interface ActionPlanSubmissionItem {
    id: string
    action_plan_row_id: string // FK ActionPlanMatrixRow (Stream B)
    no_code: string
    // ponytail: Ref2 is owned by Stream C (src/services/evaluate-gri-quantitative/types.d.ts) —
    // use this inline shape until it lands, then swap and delete this comment. Do not declare a
    // second global `Ref2`.
    sdg: { id: string; name: string }
    key_business_action: string
    action_indicator: { id: string; name: string } | null
    decision: TakeSkipDecision
    skip_reason: string // required when decision === 'Skip' (AC-93/94)
    status: ActionPlanItemStatus
  }
}

export {}

declare global {
  interface SdgGoal {
    id: string
    number: number // 1..17
    name: string
    icon_url: string
    adopted: boolean
    updated_at: string
    updated_by: string // audit trail, AC-43
    // AC-45: Adopted -> Not Adopted is blocked while this SDG has active Action Plan Matrix rows.
    // Server is the real gate; this flag lets the UI disable the toggle proactively.
    has_active_action_plan: boolean
  }
}

export {}

declare global {
  type SdgImpactType = 'Operation Impact' | 'Investment Impact'
  type CreatedByLevel = 'Holding' | 'Subsidiary' // NOTE: distinct from mki-sdg's `MkiCreatedByLevel` — do not redeclare that one

  interface ActionPlanMatrixRow {
    id: string
    no_code: string // unique within one SDG parent (AC-53)
    pillar_id: string // FK MasterPillar
    key_business_action: string
    detail_action_solution: string
    action_indicator: { id: string; name: string } | null // FK MkiSdg (type SDG_ACTION)
    alignment: string
    created_by_level: CreatedByLevel // always 'Holding' from this screen
    taken_by_count: number // >0 blocks delete (AC-54)
  }

  interface SdgFramework {
    id: string
    sdg_id: string // FK SdgGoal, Adopted only
    impact_type: SdgImpactType
    is_applied_to_all_entity: boolean
    applicable_entity_ids: string[] // required min 1 when is_applied_to_all_entity = false (AC-50/51)
    status: 'Draft' | 'Published'
    rows: ActionPlanMatrixRow[]
  }
}

export {}

declare global {
  // FSD 1.7 field table (Input Type column) — SDG_ACTION uses the same 4 options as GRI_QUANT.
  type MkiInputType = 'Number' | 'Text' | 'Percentage' | 'Boolean'
  type MkiEvidenceAttachment = 'Optional' | 'Required'
  // FSD 1.8 — who created this SDG indicator: Platform Administrator/Holding (full CRUD, this screen)
  // or a Subsidiary PIC via the scoped Initiate New Plan flow (a different module/portal, out of scope
  // here — this admin screen only gets Read-Only visibility over those rows, per AC-29).
  type MkiCreatedByLevel = 'Holding' | 'Subsidiary'

  interface MkiSdg {
    id: string
    indicator_name: string
    variable_code: string // unique, SNAKE_CASE uppercase — AC-19
    unit: { id: string; name: string } | null // FK Master Unit, required for SDG_ACTION (AC-20)
    input_type: MkiInputType
    evidence_attachment: MkiEvidenceAttachment
    created_by_level: MkiCreatedByLevel
    // denormalized FK Master Entity — null when created_by_level = 'Holding' (this screen's own creates).
    // Kept as an {id,name} pair (same denormalization technique as MkiGriQuantitative's category/unit)
    // rather than importing the full MasterEntity type, since this screen never needs to pick one.
    origin_entity: { id: string; name: string } | null
    status: 'Active' | 'Inactive'
    updated_at: string
    // ponytail: stubbed always false — real "used in a Published GRI/SDG template" linkage doesn't
    // exist yet (GRI/SDG Framework Creator, Module 2, isn't built). Follow-up: once Module 2 lands,
    // wire this from the real reference-check instead of the isLocked() stub in api.ts.
    locked: boolean
  }

  interface MkiSdgPayload {
    id?: string
    indicator_name: string
    variable_code: string
    unit: { id: string } | null
    input_type: MkiInputType
    evidence_attachment: MkiEvidenceAttachment
  }
}

export {}

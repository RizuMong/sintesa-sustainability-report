// Verbatim from api/Master Key Indicator/GRI - Quantitative/*.yml — do not change field names.
// Named MkiQuant* because the global MkiInputType (owned by services/mki-sdg) is a different,
// Title-cased union; the quantitative endpoints answer SCREAMING_CASE.
declare global {
  type MkiQuantInputType = 'NUMBER' | 'TEXT' | 'PERCENTAGE' | 'DATE' | 'YES_NO'

  interface MkiQuantColumn {
    key: string
    name: string
    sequence: number
  }

  interface MkiQuantMetric {
    key: string
    name: string
    input_type: MkiQuantInputType
    unit: Ref2 | null
    sequence: number
  }

  // GROU-651: table-level unit configuration. Absent/'NONE' means only the per-metric unit
  // (MkiQuantMetric.unit) applies, exactly like every record that predates this ticket.
  type MkiQuantUnitMode = 'NONE' | 'UNIFORM' | 'PER_ROW'

  interface MkiQuantRow {
    sequence: number
    labels: Record<string, string>
    // ponytail: GROU-651 — none of these four exist in the BE contract yet (AC-6 unconfirmed).
    // All optional so a legacy payload with no section/unit fields deserializes identically to
    // before. `sequence` remains the only storage identity; never renumber an existing row.
    row_type?: 'SECTION' | 'ROW' // absent === 'ROW'
    title?: string // SECTION only: the group header text
    parent_sequence?: number | null // ROW only: sequence of the SECTION it sits under, null = top level
    unit?: Ref2 | null // only meaningful when unit_mode === 'PER_ROW'
    display_order?: number // visual position; sequence no longer tracks order once reordering exists
  }

  // GET /v1/mki/gri-quantitative/index — one row, already the full record (no separate detail call)
  interface MkiGriQuantitative {
    id: string
    ids: string
    company_id: number
    category_id: Ref2
    code: string
    description: string
    columns: MkiQuantColumn[]
    metrics: MkiQuantMetric[]
    rows: MkiQuantRow[]
    created_at: number
    created_by: number
    updated_at: number
    updated_by: number
    // ponytail: not in the Index/Create/Update contract — the backend has no status/soft-delete
    // field for this module yet (Delete.yml is a hard DELETE). Read-only here, defaults to 'Active'
    // in the UI; drop the fallback once the API grows a real one.
    status?: MasterStatus
    // ponytail: GROU-651 — table-level unit config, not in the BE contract yet. Absent === 'NONE',
    // so old records keep behaving as metric-level-unit-only.
    unit_mode?: MkiQuantUnitMode
    unit?: Ref2 | null // the table-wide unit when unit_mode === 'UNIFORM'
  }

  // POST create/update body — same shape minus the server-owned audit fields
  interface MkiGriQuantitativePayload {
    id?: string
    category_id: Ref2
    code: string
    description: string
    columns: MkiQuantColumn[]
    metrics: MkiQuantMetric[]
    rows: MkiQuantRow[]
    // ponytail: GROU-651 — mirrors MkiGriQuantitative's unit fields, unconfirmed with BE.
    unit_mode?: MkiQuantUnitMode
    unit?: Ref2 | null
  }
}

export {}

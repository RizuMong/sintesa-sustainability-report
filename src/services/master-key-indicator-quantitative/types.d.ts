// Verbatim from api/Master Key Indicator/GRI - Quantitative/*.yml — do not change field names.
// Named MkiQuant* because the global MkiInputType (owned by services/mki-sdg) is a different,
// Title-cased union; the quantitative endpoints answer SCREAMING_CASE.
declare global {
  type MkiQuantInputType = 'NUMBER' | 'TEXT' | 'PERCENTAGE' | 'DATE' | 'YES_NO'
  type MkiQuantUnitMode = 'NONE' | 'UNIFORM' | 'PER_ROW'

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

  interface MkiQuantRow {
    sequence: number
    labels: Record<string, string>
    // section grouping — a marker row, not a container. Rows that follow it belong to it visually
    // until the next section. Flat so drag-reorder and `sequence` identity stay one-dimensional.
    type?: 'SECTION'
    name?: string
    // per-row unit, only when the indicator's unit_mode is 'PER_ROW'
    unit?: Ref2 | null
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
    // ponytail: unit_mode/unit are optional because a record saved before this ticket has neither —
    // undefined means "legacy", and resolveUnit() falls back to the metric-level unit. Make them
    // required only after a backfill.
    unit_mode?: MkiQuantUnitMode
    unit?: Ref2 | null
  }

  // POST create/update body — same shape minus the server-owned audit fields
  interface MkiGriQuantitativePayload {
    id?: string
    category_id: Ref2
    code: string
    description: string
    // GROU-662: present in V1/Create.yml + V2/Create.yml bodies, absent from both Update bodies and
    // from the Index response — sent on update too as a sibling-convention placeholder (CLAUDE.md).
    status?: MasterStatus
    columns: MkiQuantColumn[]
    metrics: MkiQuantMetric[]
    rows: MkiQuantRow[]
    unit_mode?: MkiQuantUnitMode
    unit?: Ref2 | null
  }
}

export {}

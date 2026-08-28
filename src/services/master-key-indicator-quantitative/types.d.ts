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

  interface MkiQuantRow {
    sequence: number
    labels: Record<string, string>
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
  }
}

export {}

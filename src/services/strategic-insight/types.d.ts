// GRI Quantitative: transcribed from the `Response Dummy` example in api/Dashboard/GRI - Quantitative.yml
// — do not change field names. Gap analysis behind that contract:
// docs/dashboard-gri-quantitative-api-gaps.md.
//
// ponytail: the SDG shapes below are still inferred (FSD 2.7 AC-70..73) and match neither
// api/Dashboard/SDG.yml nor the mockup — see docs/dashboard-sdg-api-gaps.md, which blocks on six
// open questions to the backend. Rewriting them is G2 in the open-gaps doc. GRI Qualitative has no
// entry in api/Dashboard/ at all, yet api.ts already calls /v1/strategic-insight/gri-qualitative.
declare global {
  // moved here from the removed services/action-plan-submission module
  type TakeSkipDecision = 'Take' | 'Skip' | null
  interface StrategicInsightFilterParams {
    period?: string // MasterPeriod.year as a string; omitted = All Periods
    entity_id?: string // MasterEntity id; omitted = All Entities
    // BE-confirmed 2026-09-15: the wire param is `category`, a bare category NAME (e.g. "General"),
    // not `category_id`. BE stores GRI Quantitative categories without an id, so there is no id to
    // filter on — see api/Dashboard/GRI - Quantitative.yml's disabled `category` param.
    category?: string
    // 'Investment Impact' | 'Operation Impact' — literal wire strings, not an uppercase token.
    // Sent as a param only (decided) — backend ignores it today (gap B2), no client-side filter.
    impact?: string
  }

  // ---- SDG page (AC-70..73) ----
  // Passed straight through from wire `summary[]` — the page needs name/description/total, not
  // four flattened numbers.
  interface StrategicInsightSdgSummary {
    key: string
    name: string
    description: string
    value: number
    total?: number
  }

  type SdgCellStatus = 'TAKE' | 'INITIATE' | 'SKIP' | 'NONE'

  interface StrategicInsightSdgCell {
    sdg_id: string // sdg_id.id — the column key
    status: SdgCellStatus // INITIATE > TAKE > SKIP precedence
    take_percentage: number // TAKE count / actions in cell, 0..100
    action_count: number
  }

  interface StrategicInsightSdgMatrixRow {
    // one per entity, replaces the per-SDG row
    entity: Ref2
    entity_type: 'HOLDING' | 'SUBSIDIARY'
    execution_percentage: number // row-level, straight from the wire
    holding_count: number // plan_origin === 'HOLDING' && adoption_status === 'TAKE' — mandates actually taken
    initiate_count: number // plan_origin === 'INITIATE'
    cells: StrategicInsightSdgCell[]
  }

  interface StrategicInsightSdgColumn {
    // ordered column vocabulary for the matrix header
    sdg_id: string
    name: string // sdg_id.name, first seen wins
    number: number
    // HOLDING if Master SDG marks this SDG "Adopted", else INITIATE (the "Bottom-Up Initiatives"
    // group). Columns are sorted (group, number) with HOLDING first so each group's
    // columns stay contiguous — required for a colspan-based grouping header row.
    group: 'HOLDING' | 'INITIATE'
  }

  interface StrategicInsightSdgDetailItem {
    id: string // action.ids
    entity_id: string // for the alignment-gap drill-down
    sdg_id: string
    sdg_name: string // sdg_id.name — the SDG column of the detail table
    key_business_action: string
    plan_origin: string
    adoption_status: string
  }

  interface StrategicInsightSdgResponse {
    summary: StrategicInsightSdgSummary[]
    columns: StrategicInsightSdgColumn[]
    matrix: StrategicInsightSdgMatrixRow[]
    detail: StrategicInsightSdgDetailItem[]
  }

  // ---- wire shape — what GET /v1/strategic-insight/sdg actually sends today ----
  //
  // Verified live 2026-09-10 (.temp/api-verify/sdg-probe/sdg.json, redacted-clean — no tokens or
  // emails present so redaction was a no-op). `normalize-sdg.ts` is the only place that knows this
  // shape; everything else keeps consuming StrategicInsightSdgResponse above. See
  // docs/dashboard-sdg-api-gaps.md for the gap analysis this closes/confirms.
  interface StrategicInsightSdgWireSummary {
    key: string // 'sdg_roadmap' | 'strategic_alignment' | 'execution_rate' | 'bottom_up_initiatives'
    name: string
    description: string
    value: number
    total?: number // present only on sdg_roadmap (denominator, 17)
  }

  interface StrategicInsightSdgWireAction {
    ids: string // NOTE: plural field name on the wire, singular id value
    // TRAP (e1a3b38 example 200): id EwGok8Dh3xXQ carries name "SDG 10" in two entities and
    // "SDG 19" in the third, same number (19) throughout — group cells on `id` (consistent),
    // label the column from the first `name` seen for that id.
    sdg_id: Ref2 & { number: number }
    adoption_status: 'TAKE' | 'SKIP' | 'INITIATE' | 'PENDING' | string // INITIATE: gap A1, not seen live yet but drives cell-status precedence
    // 'SUBSIDIARY' is DEPRECATED as of e1a3b38 — the backend now emits 'INITIATE' for what used
    // to be 'SUBSIDIARY'. Do not special-case 'SUBSIDIARY' anywhere downstream.
    plan_origin: 'HOLDING' | 'INITIATE'
    impact: string
    key_business_action: string
    detail_action_solution: string
    baseline: string | null
    target: string | null
    // BE-confirmed 2026-09-15: period lives here now, not on the parent matrix row — BE took the
    // row-level period out because it isn't needed there; each action carries its own.
    period: number
    indicator_id: (Ref2 & { evidence: string }) | null
    pillar_id: Ref2
    sdg_ambition_esg_alignment: string | null
    created_at: number | null
    updated_at: number | null
  }

  interface StrategicInsightSdgWireMatrixRow {
    entity_id: Ref2
    entity_type: 'HOLDING' | 'SUBSIDIARY'
    execution_percentage: number
    adoption_take_count: number
    adoption_skip_count: number
    actions: StrategicInsightSdgWireAction[]
  }

  // GET /v1/master-sdg/index (api/Master SDG/Index.yml) — SDG Adoption Management, the source of
  // truth for which SDGs are on the Holding roadmap.
  interface StrategicInsightMasterSdg {
    id: string
    sdg_no: number
    sdg_number: string // "SDG 1"
    sdg_name: string
    status: 'Adopted' | 'Not Adopted' | string
  }

  interface StrategicInsightSdgWireResponse {
    summary: StrategicInsightSdgWireSummary[]
    matrix: StrategicInsightSdgWireMatrixRow[]
  }

  // ---- GRI Quantitative page (AC-76/77) ----
  // `SUM`/`AVERAGE` describe how the backend derived a summary value; the FE only displays it.
  // Relevant to the FE because AVERAGE values must not be re-summed when rendering.
  type StrategicInsightAggregation = 'SUM' | 'PERCENTAGE' | 'AVERAGE'

  // BOOLEAN, not MKI V2's YES_NO for the same concept — the two contracts disagree (gap B2).
  type StrategicInsightInputType = 'NUMBER' | 'PERCENTAGE' | 'TEXT' | 'DATE' | 'BOOLEAN'

  // One member of a dimension, e.g. { key: 'MALE', name: 'Laki-laki' }. `name` is the localized
  // display label; `key` is the stable value that appears in StrategicInsightGriItem['labels'].
  interface StrategicInsightDimensionMember {
    key: string
    name: string
  }

  // An axis a category's items are split on. Mirrors `columns[]` in POST /v2/mki/gri-quantitative.
  // Chart series are grouped on these, never on `description` (gap A2).
  interface StrategicInsightDimension {
    key: string
    name: string
    members: StrategicInsightDimensionMember[]
  }

  // One KPI card. Backend-computed under the active filter; never derived FE-side.
  interface StrategicInsightGriSummary {
    key: string // e.g. 'total_employee' — see the gap doc for the full per-category set
    name: string
    value: number
    unit: Ref2 | null
    aggregation: StrategicInsightAggregation
    total?: number // present only where the card shows a denominator
  }

  interface StrategicInsightGriItem {
    id: string
    period: number // note: a number here, unlike MasterPeriod.year handling elsewhere
    entity: Ref2 & { code: string }
    gri_code: string // the leaf disclosure, e.g. '2-7a' — NOT the tab's '2-7'
    metric_key: string
    metric_name: string
    // This item's coordinate in `dimensions[]`: dimension key -> member key. May carry more than
    // one entry (OHS splits on incident_type AND employment_status). Group charts on this.
    labels: Record<string, string>
    description: string // display only — localized, editable, never a grouping key
    value: number | string | boolean // narrows by input_type
    unit: Ref2 | null
    input_type: StrategicInsightInputType
    // How this metric combines across entities/periods (AC-75). Distinct from `input_type`:
    // salary ratios and average-training-hours are plain NUMBERs that must still AVERAGE, so
    // this cannot be inferred from the input type — summing them yields a "1.88 ratio".
    aggregation: StrategicInsightAggregation
  }

  // One dashboard tab.
  interface StrategicInsightGriCategory {
    category_id: Ref2 // resolves against GET /v1/master-category/index
    gri_codes: string[] // the tab's header caption, e.g. ['2-7', '2-8']
    sequence: number // tab order; render as given
    dimensions: StrategicInsightDimension[]
    summary: StrategicInsightGriSummary[]
    // Unfiltered by `period`/`entity_id` — the trend charts plot every period and the
    // PT-comparison chart every entity, regardless of the active filter (gap A4).
    items: StrategicInsightGriItem[]
  }

  // The endpoint returns the category array directly as `data`, with no wrapper object.
  type StrategicInsightGriQuantitativeResponse = StrategicInsightGriCategory[]

  // ---- wire shape — what GET /v1/strategic-insight/gri-quantitative actually sends today ----
  //
  // Verified live 2026-09-10 against the dev backend (.temp/api-verify/*/gri-unfiltered.json).
  // A prior analysis called this "pre-migration" because it byte-matches the collection's
  // `Legacy Response (pre dimensions/labels)` example — that was our own inference, not a BE
  // statement. BE says this shape IS current. `normalize.ts` is the only place that knows it;
  // everything else in this module keeps consuming `StrategicInsightGriCategory` above.
  interface StrategicInsightGriWireSummary {
    key: string
    name: string
    value: number
    unit_id: Ref2 | null
    aggregation: StrategicInsightAggregation
    total?: number
  }

  interface StrategicInsightGriWireItem {
    id: string
    period: number
    entity: Ref2 & { code: string }
    gri_code: string
    metric_name: string
    description: string
    value: number | string | boolean
    unit_id: Ref2 | null
    input_type: StrategicInsightInputType
    // absent on the wire — Phase 3 derives it via an explicit allow-list, not inference
    // (see AVERAGE_METRIC_KEYS in normalize.ts and gap G1)
  }

  interface StrategicInsightGriWireCategory {
    category: string // bare uppercase token, e.g. 'GENERAL' — no id, no defined mapping to master-category
    summary: StrategicInsightGriWireSummary[]
    items: StrategicInsightGriWireItem[]
    // no gri_codes[], sequence, dimensions[] — all derivable, see normalize.ts
  }

  type StrategicInsightGriQuantitativeWireResponse = StrategicInsightGriWireCategory[]

  // ---- GRI Qualitative page ----
  interface StrategicInsightGriQualitativeNarrative {
    gri_code: string
    title: string
    entity: Ref2
    period: string
    answered: boolean
    narrative: string
  }

  interface StrategicInsightGriQualitativeResponse {
    narratives: StrategicInsightGriQualitativeNarrative[]
  }
}

export {}

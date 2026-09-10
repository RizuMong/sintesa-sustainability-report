// GRI Quantitative: transcribed from the `Contract` example in api/Dashboard/GRI - Quantitative.yml
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
    category_id?: string // MasterCategory id; omitted = all categories (GRI Quantitative only)
  }

  // ---- SDG page (AC-70..73) ----
  interface StrategicInsightSdgKpi {
    holding_sdg_roadmap: number // count of Holding-adopted SDGs with a published framework
    strategic_alignment_rate: number // %, aligned action plans / total roadmap items
    execution_rate_take: number // %, Holding-only Take / (Take+Skip) — AC-72 anti-greenwashing rule
    bottom_up_initiatives: number // count of Subsidiary-originated (created_by_level = 'Subsidiary') items
  }

  interface StrategicInsightSdgMatrixRow {
    sdg: Ref2 & { number: number }
    take_rate: number // %, Holding-only numerator/denominator (AC-72)
    aligned_count: number
    initiated_count: number
  }

  interface StrategicInsightSdgDetailItem {
    id: string
    sdg_id: string
    entity: Ref2
    key_business_action: string
    action_indicator: Ref2 | null
    created_by_level: MkiCreatedByLevel // reuse mki-sdg's global ('Holding' | 'Subsidiary')
    unverified: boolean // §4 Unverified flag — true only when created_by_level = 'Subsidiary'
    decision: TakeSkipDecision // reuse action-plan-submission's global ('Take' | 'Skip' | null)
    skip_reason: string | null
  }

  interface StrategicInsightSdgResponse {
    kpi: StrategicInsightSdgKpi
    matrix: StrategicInsightSdgMatrixRow[]
    detail: StrategicInsightSdgDetailItem[] // drill-down source, filtered client-side by sdg_id on row click
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

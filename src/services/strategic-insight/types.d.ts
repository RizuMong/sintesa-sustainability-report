// ponytail: api/Dashboard/{SDG,GRI - Quantitative,GRI - Qualitative}.yml only pin method+URL
// (GET /v1/strategic-insight/{sdg,gri-quantitative,gri-qualitative}) — none ship an example response
// body to copy verbatim. Shapes below are inferred from FSD 2.7 AC-70..77 (§5 Stream G of the impl
// plan): row-level breakdown per entity+period so the FE can do the AC-75 All-Entities/All-Periods
// aggregation itself (see ./aggregate.ts). Reconcile field names once the backend returns a real payload.
declare global {
  interface StrategicInsightFilterParams {
    period?: string // MasterPeriod.year as a string; omitted = All Periods
    entity_id?: string // MasterEntity id; omitted = All Entities
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
  interface StrategicInsightMetricRow {
    entity: Ref2
    period: string
    value: number
  }

  interface StrategicInsightGriMetric {
    gri_code: string // e.g. '302-1'
    title: string
    unit: string
    is_ratio: boolean // true -> average across rows when aggregating, false -> sum (AC-75)
    rows: StrategicInsightMetricRow[] // one row per entity+period matching the active filter's scope
  }

  interface StrategicInsightGriQuantitativeResponse {
    metrics: StrategicInsightGriMetric[]
  }

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

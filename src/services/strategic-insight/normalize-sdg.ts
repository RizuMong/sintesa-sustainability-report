// Adapts the wire shape GET /v1/strategic-insight/sdg actually sends (StrategicInsightSdgWireResponse,
// see types.d.ts) into the canonical StrategicInsightSdgResponse that SdgPage.vue already consumes.
// Mirrors normalize.ts's rationale: one adapter owns the wire shape, the page and its computeds stay
// as written. See docs/dashboard-sdg-api-gaps.md for the gap analysis.
//
// Pure, dependency-free (no vue, no '@/' alias) so normalize-sdg.check.ts can run under a plain node
// runner, matching normalize.ts's convention.

// ---- real derivations (DEMO_PAD = false path) ----

function summaryValue(summary: StrategicInsightSdgWireSummary[], key: string): number {
  return summary.find((s) => s.key === key)?.value ?? 0
}

function deriveKpi(summary: StrategicInsightSdgWireSummary[]): StrategicInsightSdgKpi {
  return {
    holding_sdg_roadmap: summaryValue(summary, 'sdg_roadmap'),
    strategic_alignment_rate: summaryValue(summary, 'strategic_alignment'),
    execution_rate_take: summaryValue(summary, 'execution_rate'),
    bottom_up_initiatives: summaryValue(summary, 'bottom_up_initiatives'),
  }
}

interface FlatAction {
  entity: Ref2
  action: StrategicInsightSdgWireAction
}

function flattenActions(matrix: StrategicInsightSdgWireMatrixRow[]): FlatAction[] {
  const out: FlatAction[] = []
  for (const row of matrix) {
    for (const action of row.actions) {
      out.push({ entity: row.entity_id, action })
    }
  }
  return out
}

// Groups on sdg_id.number, NEVER sdg_id.id — the live dummy data reuses one id across two distinct
// SDGs (id 's6X9n1U8Bjl0' carries both SDG 12 and SDG 1). Grouping on id collapses two rows into
// one and silently drops half the data. Pinned by a mutation test in normalize-sdg.check.ts.
function groupByNumber(flat: FlatAction[]): Map<number, FlatAction[]> {
  const groups = new Map<number, FlatAction[]>()
  for (const item of flat) {
    const number = item.action.sdg_id.number
    if (!groups.has(number)) groups.set(number, [])
    groups.get(number)!.push(item)
  }
  return groups
}

function deriveMatrixRow(
  number: number,
  items: FlatAction[],
  fallbackExecutionPercentage: number,
): StrategicInsightSdgMatrixRow {
  const first = items[0]!.action.sdg_id
  const aligned_count = items.filter((i) => i.action.plan_origin === 'HOLDING').length
  const initiated_count = items.filter(
    (i) => i.action.plan_origin === 'INITIATE' || i.action.plan_origin === 'SUBSIDIARY',
  ).length
  const take = items.filter((i) => i.action.adoption_status === 'TAKE').length
  const skip = items.filter((i) => i.action.adoption_status === 'SKIP').length
  const take_rate =
    take + skip > 0 ? Math.round((take / (take + skip)) * 100) : fallbackExecutionPercentage

  return {
    // sdg.id keyed on String(number), not the wire id, so matrix rows and detail items can be
    // joined unambiguously on the same key despite the id-duplication trap above.
    sdg: { id: String(number), number, name: first.name },
    take_rate,
    aligned_count,
    initiated_count,
  }
}

function deriveDetailItem(item: FlatAction): StrategicInsightSdgDetailItem {
  const { entity, action } = item
  const decision: TakeSkipDecision =
    action.adoption_status === 'TAKE' ? 'Take' : action.adoption_status === 'SKIP' ? 'Skip' : null

  return {
    id: action.ids,
    sdg_id: String(action.sdg_id.number),
    entity,
    key_business_action: action.key_business_action,
    action_indicator: action.indicator_id ? { id: action.indicator_id.id, name: action.indicator_id.name } : null,
    created_by_level: action.plan_origin === 'HOLDING' ? 'Holding' : 'Subsidiary',
    unverified: action.plan_origin !== 'HOLDING',
    decision,
    skip_reason: null, // not sent by the backend at all
  }
}

export function normalizeSdg(wire: StrategicInsightSdgWireResponse): StrategicInsightSdgResponse {
  const kpi = deriveKpi(wire.summary)
  const flat = flattenActions(wire.matrix)
  const fallbackExecutionPercentage = wire.matrix[0]?.execution_percentage ?? 0

  const groups = groupByNumber(flat)
  const matrix = [...groups.entries()]
    .map(([number, items]) => deriveMatrixRow(number, items, fallbackExecutionPercentage))
    .sort((a, b) => a.sdg.number - b.sdg.number)

  const detail = flat.map(deriveDetailItem)

  return { kpi, matrix, detail }
}

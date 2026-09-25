// Adapts the wire shape GET /v1/strategic-insight/sdg actually sends (StrategicInsightSdgWireResponse,
// see types.d.ts) into the canonical StrategicInsightSdgResponse — one row per entity, one cell per
// SDG column, cell status/percentage derived client-side per the confirmed precedence rule.
// See plans/sdg-dashboard-adjustments/plan.md ("Contract this is built on") for the e1a3b38 contract
// this is built against, and docs/dashboard-sdg-api-gaps.md for the gap analysis.
//
// Pure, dependency-free (no vue, no '@/' alias) so normalize-sdg.check.ts can run under a plain node
// runner, matching normalize.ts's convention.

// `period` isn't part of the canonical StrategicInsightSdgDetailItem — it's carried here purely as
// an internal filtering key.
//
// BE-confirmed 2026-09-15: period lives on each action, not on the parent matrix row.
interface FlatAction {
  entity: Ref2
  entityType: 'HOLDING' | 'SUBSIDIARY'
  executionPercentage: number
  action: StrategicInsightSdgWireAction
  period: number
}

function flattenActions(matrix: StrategicInsightSdgWireMatrixRow[]): FlatAction[] {
  const out: FlatAction[] = []
  for (const row of matrix) {
    for (const action of row.actions) {
      out.push({
        entity: row.entity_id,
        entityType: row.entity_type,
        executionPercentage: row.execution_percentage,
        action,
        period: action.period,
      })
    }
  }
  return out
}

function applyFilters(flat: FlatAction[], filters: StrategicInsightFilterParams): FlatAction[] {
  return flat.filter((item) => {
    if (filters.period && String(item.period) !== filters.period) return false
    if (filters.entity_id && item.entity.id !== filters.entity_id) return false
    return true
  })
}

// Distinct sdg_id.id across ALL actions, label = first sdg_id.name seen for that id. See the TRAP
// comment on StrategicInsightSdgWireAction['sdg_id'] in types.d.ts — id EwGok8Dh3xXQ carries two
// different names in example 200; this must collapse to one column.
//
// group: HOLDING only if Master SDG (SDG Adoption Management) marks that SDG "Adopted", else
// INITIATE (rendered "Bottom-Up Initiatives"). NOT inferred from plan_origin: a Holding-origin
// action plan can still sit on a non-adopted SDG, and inferring from it put SDG 1 under "Holding
// SDGs". Sorted (group, number), HOLDING first, so each group's columns stay contiguous — a
// colspan-based grouping header can't span non-adjacent columns.
function deriveColumns(flat: FlatAction[], adopted: Set<string>): StrategicInsightSdgColumn[] {
  const byId = new Map<string, StrategicInsightSdgColumn>()
  for (const { action } of flat) {
    const { id, name, number } = action.sdg_id
    if (!byId.has(id)) byId.set(id, { sdg_id: id, name, number, group: adopted.has(id) ? 'HOLDING' : 'INITIATE' })
  }
  return [...byId.values()].sort((a, b) => {
    if (a.group !== b.group) return a.group === 'HOLDING' ? -1 : 1
    return a.number - b.number
  })
}

// A Holding mandate counts only once the entity actually took it. The backend sends every mandate
// available to an entity (PENDING/SKIP included), so counting plan_origin alone reported the whole
// mandate pool (35/43 per entity) as "Holding" in the Strategic Alignment Gap chart.
export function isTakenMandate(action: { plan_origin: string; adoption_status: string }): boolean {
  return action.plan_origin === 'HOLDING' && action.adoption_status === 'TAKE'
}

const percent = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0)

// Recomputed from the same filtered actions the matrix and chart use, so the four cards can't
// disagree with them (the backend's own summary[] reported 164% alignment, and ignores the
// client-side filters). name/description stay the backend's; unknown keys pass through.
function deriveSummary(
  wireSummary: StrategicInsightSdgWireSummary[],
  flat: FlatAction[],
  adopted: Set<string>,
  masterSdgs: StrategicInsightMasterSdg[],
): StrategicInsightSdgSummary[] {
  const onRoadmap = flat.filter((i) => adopted.has(i.action.sdg_id.id)).length
  const mandates = flat.filter((i) => i.action.plan_origin === 'HOLDING')
  const values: Record<string, Pick<StrategicInsightSdgSummary, 'value' | 'total'>> = {
    sdg_roadmap: { value: adopted.size, total: masterSdgs.length },
    strategic_alignment: { value: percent(onRoadmap, flat.length) },
    execution_rate: { value: percent(mandates.filter((i) => isTakenMandate(i.action)).length, mandates.length) },
    bottom_up_initiatives: { value: flat.length - onRoadmap },
  }
  return wireSummary.map((s) => ({ ...s, ...values[s.key] }))
}

// INITIATE > TAKE > SKIP precedence (decision 1). Anything else (e.g. PENDING) falls through to
// NONE only when there are literally no actions in the cell — an unrecognized status among real
// actions still counts toward action_count/take_percentage but doesn't itself win precedence.
function cellStatus(actions: StrategicInsightSdgWireAction[]): SdgCellStatus {
  if (actions.length === 0) return 'NONE'
  if (actions.some((a) => a.adoption_status === 'INITIATE')) return 'INITIATE'
  if (actions.some((a) => a.adoption_status === 'TAKE')) return 'TAKE'
  if (actions.some((a) => a.adoption_status === 'SKIP')) return 'SKIP'
  return 'NONE'
}

function deriveCell(sdgId: string, actions: StrategicInsightSdgWireAction[]): StrategicInsightSdgCell {
  const take = actions.filter((a) => a.adoption_status === 'TAKE').length
  return {
    sdg_id: sdgId,
    status: cellStatus(actions),
    take_percentage: actions.length > 0 ? Math.round((take / actions.length) * 100) : 0,
    action_count: actions.length,
  }
}

function deriveMatrixRow(
  items: FlatAction[],
  columns: StrategicInsightSdgColumn[],
): StrategicInsightSdgMatrixRow {
  const first = items[0]!
  const byColumn = new Map<string, StrategicInsightSdgWireAction[]>()
  for (const { action } of items) {
    const list = byColumn.get(action.sdg_id.id) ?? []
    list.push(action)
    byColumn.set(action.sdg_id.id, list)
  }

  return {
    entity: first.entity,
    entity_type: first.entityType,
    execution_percentage: first.executionPercentage,
    holding_count: items.filter((i) => isTakenMandate(i.action)).length,
    initiate_count: items.filter((i) => i.action.plan_origin === 'INITIATE').length,
    // rectangular: a column this entity has no action for still gets an explicit empty cell.
    cells: columns.map((col) => deriveCell(col.sdg_id, byColumn.get(col.sdg_id) ?? [])),
  }
}

function deriveDetailItem(item: FlatAction): StrategicInsightSdgDetailItem {
  const { entity, action } = item
  return {
    id: action.ids,
    entity_id: entity.id,
    sdg_id: action.sdg_id.id,
    sdg_name: action.sdg_id.name,
    key_business_action: action.key_business_action,
    plan_origin: action.plan_origin,
    adoption_status: action.adoption_status,
  }
}

export function normalizeSdg(
  wire: StrategicInsightSdgWireResponse,
  masterSdgs: StrategicInsightMasterSdg[],
  filters: StrategicInsightFilterParams = {},
): StrategicInsightSdgResponse {
  const adopted = new Set(masterSdgs.filter((s) => s.status === 'Adopted').map((s) => s.id))
  const flat = applyFilters(flattenActions(wire.matrix), filters)
  const columns = deriveColumns(flat, adopted)

  const byEntity = new Map<string, FlatAction[]>()
  for (const item of flat) {
    const list = byEntity.get(item.entity.id) ?? []
    list.push(item)
    byEntity.set(item.entity.id, list)
  }

  const matrix = [...byEntity.values()].map((items) => deriveMatrixRow(items, columns))
  const detail = flat.map(deriveDetailItem)

  return { summary: deriveSummary(wire.summary, flat, adopted, masterSdgs), columns, matrix, detail }
}

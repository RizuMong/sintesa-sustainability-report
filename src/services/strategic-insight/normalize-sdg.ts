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
// group: HOLDING if ANY action for that sdg_id has plan_origin HOLDING, else INITIATE (rule 1 in
// the follow-up plan). Sorted (group, number), HOLDING first, so each group's columns stay
// contiguous — a colspan-based grouping header can't span non-adjacent columns.
function deriveColumns(flat: FlatAction[]): StrategicInsightSdgColumn[] {
  const byId = new Map<string, StrategicInsightSdgColumn>()
  for (const { action } of flat) {
    const { id, name, number } = action.sdg_id
    if (!byId.has(id)) byId.set(id, { sdg_id: id, name, number, group: 'INITIATE' })
    if (action.plan_origin === 'HOLDING') byId.get(id)!.group = 'HOLDING'
  }
  return [...byId.values()].sort((a, b) => {
    if (a.group !== b.group) return a.group === 'HOLDING' ? -1 : 1
    return a.number - b.number
  })
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
    holding_count: items.filter((i) => i.action.plan_origin === 'HOLDING').length,
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
  filters: StrategicInsightFilterParams = {},
): StrategicInsightSdgResponse {
  const flat = applyFilters(flattenActions(wire.matrix), filters)
  const columns = deriveColumns(flat)

  const byEntity = new Map<string, FlatAction[]>()
  for (const item of flat) {
    const list = byEntity.get(item.entity.id) ?? []
    list.push(item)
    byEntity.set(item.entity.id, list)
  }

  const matrix = [...byEntity.values()].map((items) => deriveMatrixRow(items, columns))
  const detail = flat.map(deriveDetailItem)

  return { summary: wire.summary, columns, matrix, detail }
}

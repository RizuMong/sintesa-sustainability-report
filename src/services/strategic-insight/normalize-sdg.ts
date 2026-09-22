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

// `period` isn't part of the canonical StrategicInsightSdgDetailItem — it's carried here purely as
// an internal filtering key so DEMO_PAD's client-side period filter (rule 4) has something real to
// filter on, for both real and padded actions alike.
//
// BE-confirmed 2026-09-15: period now lives on each action, not on the parent matrix row (the row
// no longer carries it at all — BE removed it because it wasn't needed there).
interface FlatAction {
  entity: Ref2
  action: StrategicInsightSdgWireAction
  period: number
}

function flattenActions(matrix: StrategicInsightSdgWireMatrixRow[]): FlatAction[] {
  const out: FlatAction[] = []
  for (const row of matrix) {
    for (const action of row.actions) {
      out.push({ entity: row.entity_id, action, period: action.period })
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

// The 17 official UN Sustainable Development Goals. Permanent vocabulary, deliberately declared
// OUTSIDE the DEMO_PAD block below: the take-rate chart has to render all 17 categories (GROU-833
// AC-2) whether or not the backend has data for a goal, so this list must survive the day the demo
// padding is deleted.
export const SDG_CATALOG: { number: number; name: string }[] = [
  { number: 1, name: 'No Poverty' },
  { number: 2, name: 'Zero Hunger' },
  { number: 3, name: 'Good Health and Well-being' },
  { number: 4, name: 'Quality Education' },
  { number: 5, name: 'Gender Equality' },
  { number: 6, name: 'Clean Water and Sanitation' },
  { number: 7, name: 'Affordable and Clean Energy' },
  { number: 8, name: 'Decent Work and Economic Growth' },
  { number: 9, name: 'Industry, Innovation and Infrastructure' },
  { number: 10, name: 'Reduced Inequalities' },
  { number: 11, name: 'Sustainable Cities and Communities' },
  { number: 12, name: 'Responsible Consumption and Production' },
  { number: 13, name: 'Climate Action' },
  { number: 14, name: 'Life Below Water' },
  { number: 15, name: 'Life on Land' },
  { number: 16, name: 'Peace, Justice and Strong Institutions' },
  { number: 17, name: 'Partnerships for the Goals' },
]

// The wire's sdg_id.name is the bare code ("SDG 1"), not a title, and SdgPage.vue renders
// "SDG {{number}} — {{name}}" — so passing it straight through prints "SDG 1 — SDG 1". Prefer the
// real UN goal title from SDG_CATALOG, falling back to whatever the wire said for a number outside
// 1..17.
function sdgName(number: number, wireName: string): string {
  return SDG_CATALOG.find((s) => s.number === number)?.name ?? wireName
}

// Zero-fills the matrix out to all 17 goals, sorted by number (GROU-833 AC-2: the take-rate chart
// shows every SDG, not only the ones the payload happens to carry). Additive and non-destructive —
// a goal the backend DID return is passed through untouched; a missing one becomes an explicit
// 0% / 0 / 0 row rather than a gap in the axis. Pure, so normalize-sdg.check.ts can assert on it.
export function padMatrixToAllSdgs(
  matrix: StrategicInsightSdgMatrixRow[],
): StrategicInsightSdgMatrixRow[] {
  const byNumber = new Map(matrix.map((row) => [row.sdg.number, row]))
  return SDG_CATALOG.map(
    (goal) =>
      byNumber.get(goal.number) ?? {
        sdg: { id: String(goal.number), number: goal.number, name: goal.name },
        take_rate: 0,
        aligned_count: 0,
        initiated_count: 0,
      },
  )
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
    sdg: { id: String(number), number, name: sdgName(number, first.name) },
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

// ponytail: mockup-demo padding. The live endpoint returns ONE holding row and TWO actions
// (SDG 1, SDG 12 only), and ignores every filter param (period=1999 and entity_id=zzzzzz both
// return byte-identical payloads — verified live 2026-09-10), so without this the matrix, the
// chart and the drill-down all render a single bar and the filter selects do nothing visible.
// Everything below is invented to make the page demonstrable for a mock-up review. Real live
// data always wins for the same SDG (padding is additive-only, see mergeWithPadding below).
// Delete this whole block, and the DEMO_PAD flag, the day the backend returns real
// multi-entity/multi-SDG data and honours period/entity_id server-side.
export const DEMO_PAD = true

// The mockup's 10-SDG roadmap (docs/dashboard-sdg-api-gaps.md's proposed `sdgs[]`, transcribed
// verbatim): adopted = 5, 7, 8, 12, 13, 16; non-adopted (bottom-up only) = 1, 3, 14, 15.
const ROADMAP_SDGS: { number: number; short_name: string; adopted: boolean }[] = [
  { number: 1, short_name: 'No Poverty', adopted: false },
  { number: 3, short_name: 'Health', adopted: false },
  { number: 5, short_name: 'Gender Eq.', adopted: true },
  { number: 7, short_name: 'Clean Energy', adopted: true },
  { number: 8, short_name: 'Decent Work', adopted: true },
  { number: 12, short_name: 'Resp. Cons.', adopted: true },
  { number: 13, short_name: 'Climate', adopted: true },
  { number: 14, short_name: 'Life Below Water', adopted: false },
  { number: 15, short_name: 'Life on Land', adopted: false },
  { number: 16, short_name: 'Peace & Justice', adopted: true },
]

// The mockup's subsidiaries, used to vary the entity on padded drill-down rows.
const PAD_ENTITIES: Ref2[] = [
  { id: 'e1', name: 'Widjajatunggal Sejahtera (WS)' },
  { id: 'e2', name: 'Sintesa Duta Sejahtera (SDS)' },
  { id: 'e3', name: 'Mitra Energi Persada (MEPPO)' },
  { id: 'e4', name: 'Sentra Bangun Gemilang (SBG)' },
]

// Padded periods, matching the two years mock-api-server.ts's master-period route offers.
const PAD_PERIODS = [2024, 2025]

// Deterministic PRNG seeded off the SDG number — never Math.random(), so the demo doesn't change
// on every refetch. mulberry32, a small well-known integer hash/PRNG.
function seededRandom(seed: number): () => number {
  let t = seed >>> 0
  return () => {
    t = (t + 0x6d2b79f5) >>> 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)]!
}

// Fabricates 2-3 plausible actions for an SDG the live payload has no data for, cloned from a real
// action's text fields with the entity/period/decision varied deterministically off the SDG number.
// Adopted SDGs skew HOLDING/TAKE (mirrors a mandated, executed roadmap item); non-adopted SDGs skew
// INITIATE (mirrors a bottom-up subsidiary proposal), matching the mockup's two column groups.
function paddedActionsFor(
  meta: (typeof ROADMAP_SDGS)[number],
  template: StrategicInsightSdgWireAction,
  sdgId: string,
): FlatAction[] {
  const rand = seededRandom(meta.number * 7919) // 7919 is prime, just decorrelates adjacent seeds
  const count = 2 + Math.floor(rand() * 2) // 2 or 3, deterministic per SDG
  const out: FlatAction[] = []
  for (let i = 0; i < count; i += 1) {
    const entity = pick(PAD_ENTITIES, rand)
    const period = pick(PAD_PERIODS, rand)
    const planOrigin: StrategicInsightSdgWireAction['plan_origin'] = meta.adopted
      ? rand() < 0.75
        ? 'HOLDING'
        : 'INITIATE'
      : rand() < 0.75
        ? 'INITIATE'
        : 'SUBSIDIARY'
    const adoptionStatus = rand() < 0.7 ? 'TAKE' : 'SKIP'
    out.push({
      entity,
      period,
      action: {
        ...template,
        ids: `demo-pad-${meta.number}-${i}`,
        sdg_id: { id: sdgId, name: `SDG ${meta.number}`, number: meta.number },
        adoption_status: adoptionStatus,
        plan_origin: planOrigin,
        period, // keep the action's own period in sync with FlatAction.period (BE moved it here)
      },
    })
  }
  return out
}

// Additive merge: every roadmap SDG the real payload already has real actions for is left
// untouched; only roadmap SDGs with ZERO real actions get a padded group appended. Real data for
// the same SDG is never overwritten.
function mergeWithPadding(groups: Map<number, FlatAction[]>, wire: StrategicInsightSdgWireResponse): void {
  const template = wire.matrix[0]?.actions[0]
  if (!template) return // nothing to clone the shape from — leave padding off rather than invent a shape
  for (const meta of ROADMAP_SDGS) {
    if (groups.has(meta.number)) continue // real data wins, additive only
    groups.set(meta.number, paddedActionsFor(meta, template, String(meta.number)))
  }
}

function applyFilters(flat: FlatAction[], filters: StrategicInsightFilterParams): FlatAction[] {
  return flat.filter((item) => {
    if (filters.period && String(item.period) !== filters.period) return false
    if (filters.entity_id && item.entity.id !== filters.entity_id) return false
    return true
  })
}

export function normalizeSdg(
  wire: StrategicInsightSdgWireResponse,
  filters: StrategicInsightFilterParams = {},
): StrategicInsightSdgResponse {
  const kpi = deriveKpi(wire.summary)
  const flat = flattenActions(wire.matrix)
  const fallbackExecutionPercentage = wire.matrix[0]?.execution_percentage ?? 0

  const groups = groupByNumber(flat)
  if (DEMO_PAD) mergeWithPadding(groups, wire)

  // Query params are ignored server-side (verified live 2026-09-10: period=1999 and
  // entity_id=zzzzzz both return byte-identical payloads), so filtering happens here, over
  // whatever set (real, or real+padded) normalizeSdg was about to render.
  const filteredGroups = new Map(
    [...groups.entries()].map(([number, items]) => [number, applyFilters(items, filters)] as const),
  )

  const matrix = [...filteredGroups.entries()]
    .filter(([, items]) => items.length > 0)
    .map(([number, items]) => deriveMatrixRow(number, items, fallbackExecutionPercentage))
    .sort((a, b) => a.sdg.number - b.sdg.number)

  const detail = [...filteredGroups.values()].flat().map(deriveDetailItem)

  return { kpi, matrix, detail }
}

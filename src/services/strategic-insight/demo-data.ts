// Fixture data for the GRI Quantitative dashboard MOCK-UP.
//
// ponytail: this whole module is fake data. It exists because the dashboard is a demo and the
// backend cannot yet fill it: GET /v1/strategic-insight/gri-quantitative returns 2 of 8 categories,
// one entity, one period, and ignores all three query params (verified live 2026-09-10, see
// docs/dashboard-gri-quantitative-api-gaps.md gaps G1-G3). Delete this module, its fixture, and the
// USE_DEMO_GRI_DATA branch in api.ts the day the backend serves real multi-entity, multi-period
// data. Nothing else depends on it.
//
// What is real and what is invented:
//   REAL      — the shape, the 8 categories, dimensions[], the members, metric keys, summary keys,
//               units and aggregation flags all come verbatim from the committed contract example
//               (fixtures/gri-quantitative-base.json, regenerate with scripts/generate-demo-base.ts).
//   INVENTED  — the 15 entities, the 2023/2024/2025 periods, and every numeric value.
//
// Pure and dependency-free (no vue, no '@/' alias) so demo-data.check.ts runs under a plain
// `node --experimental-strip-types` runner, matching aggregate.ts/chart-spec.ts's convention.
import base from './fixtures/gri-quantitative-base.json' with { type: 'json' }

// The 15 PTs the mockup lists. Names are plausible expansions of the codes; only WS matches a real
// master-entity row, because GET /v1/master-entity/index returns 7 rows with duplicate codes and
// cannot populate this dropdown (gap C2).
const DEMO_ENTITIES: { id: string; code: string; name: string }[] = [
  { id: 'Ks6BgE75YiQ1', code: 'WS', name: 'Waskita Sintesa' },
  { id: 'demo-ent-SDS', code: 'SDS', name: 'Sintesa Duta Sejahtera' },
  { id: 'demo-ent-MEPPO', code: 'MEPPO', name: 'Meppo Gen' },
  { id: 'demo-ent-SBG', code: 'SBG', name: 'Sintesa Banten Geothermal' },
  { id: 'demo-ent-SGE', code: 'SGE', name: 'Sintesa Green Energy' },
  { id: 'demo-ent-TES', code: 'TES', name: 'Tirta Energi Sentosa' },
  { id: 'demo-ent-MPRD', code: 'MPRD', name: 'Mitra Prima Rekadaya' },
  { id: 'demo-ent-MD', code: 'MD', name: 'Menara Delapan' },
  { id: 'demo-ent-TA', code: 'TA', name: 'Tunas Agro' },
  { id: 'demo-ent-TRS', code: 'TRS', name: 'Trisula Sejahtera' },
  { id: 'demo-ent-MPH', code: 'MPH', name: 'Multi Pratama Hutama' },
  { id: 'demo-ent-SPP', code: 'SPP', name: 'Sintesa Property Persada' },
  { id: 'demo-ent-SPM', code: 'SPM', name: 'Sintesa Prima Mandiri' },
  { id: 'demo-ent-GSME', code: 'GSME', name: 'Graha Sintesa Mitra Energi' },
  { id: 'demo-ent-PMB', code: 'PMB', name: 'Prima Manunggal Bersama' },
]

const DEMO_PERIODS = [2023, 2024, 2025]

export const demoEntities = DEMO_ENTITIES.map((e) => ({ ...e }))
export const demoPeriods = [...DEMO_PERIODS]

// ---- deterministic jitter ----
//
// Deliberately NOT Math.random(). A demo that renders different numbers on every refresh is worse
// than one with fixed numbers (the audience notices, and a screenshot never matches the screen),
// and it would make scripts/run-dashboard-acceptance.sh flaky — that run asserts chart geometry.
// FNV-1a over the item's own coordinates, so a given entity/period/metric/label combination always
// produces the same value, and reordering the loops below cannot change the output.
function hash(seed: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h
}

// Stable pseudo-random in [0, 1).
function unit(seed: string): number {
  return hash(seed) / 0x100000000
}

// Absolute metrics (headcount, GJ, tons): scale the template value by ±35% per entity, plus a mild
// upward year-on-year drift so the trend lines actually slope instead of drawing a flat bar.
function scaleAbsolute(templateValue: number, seed: string, periodIndex: number): number {
  const spread = 0.65 + unit(seed) * 0.7 // 0.65 .. 1.35
  const drift = 1 + periodIndex * 0.08 // 2023 -> 1.00, 2024 -> 1.08, 2025 -> 1.16
  const scaled = templateValue * spread * drift
  // Keep small counts (fatalities, governance members) as whole numbers; a "0.4 fatalities" bar is
  // the kind of detail that discredits a demo.
  return templateValue < 100 ? Math.round(scaled) : Math.round(scaled / 10) * 10
}

// Ratio metrics (salary ratio ~0.95, percentages 0..100, average training hours) must NOT be scaled
// like totals: stretching them produces out-of-range nonsense — a "1.88 salary ratio" is the exact
// bug aggregate.ts's AVERAGE handling exists to prevent.
//
// Jitter is RELATIVE (±15%) rather than a fixed absolute delta, because these metrics differ in
// magnitude by two orders (0.95 salary ratio vs 36 training hours vs 28.5%). A fixed ±0.04 delta
// moved the salary ratio believably but left every training-hours bar reading exactly 36, which
// renders as a chart of identical bars — technically populated, visibly broken.
function scaleRatio(
  templateValue: number,
  seed: string,
  isPercentage: boolean,
  periodIndex = 0,
  metricKey = '',
): number {
  // 0.94 .. 1.06. Deliberately tighter than scaleAbsolute's +/-35%: a ratio metric's whole range is
  // narrow, so the same relative spread that looks like healthy variation on a headcount pushes an
  // individual entity's salary ratio above parity (seen at 1.13) even when the member average sits
  // below it. The check asserts the per-ITEM value, not just the average, because the PT-comparison
  // chart plots entities individually.
  const spread = 0.94 + unit(seed) * 0.12
  const drift = 1 + periodIndex * 0.03 // gentle, so the trend line slopes without leaving range
  const value = templateValue * spread * drift
  return Math.round(clampToRange(metricKey, value, isPercentage) * 100) / 100
}

// The believable range for a metric, declared rather than arrived at by tuning multipliers.
//
// Chasing this with scale factors alone does not converge: bias x spread x year-drift compound, so
// pulling the salary ratio under parity by shrinking one factor just moved the overshoot somewhere
// else (1.13 -> 1.05 -> ...). A stated ceiling says what the metric MEANS instead: GRI 405-2 reports
// a pay gap, so women out-earning men in a demo reads as a sign error.
const METRIC_RANGE: Record<string, { min: number; max: number }> = {
  salary_ratio_female_to_male: { min: 0.78, max: 1.0 },
  avg_training_hours: { min: 4, max: 120 },
}

function clampToRange(metricKey: string, value: number, isPercentage: boolean): number {
  const range = METRIC_RANGE[metricKey]
  const min = range?.min ?? 0
  const max = range?.max ?? (isPercentage ? 100 : Number.POSITIVE_INFINITY)
  return Math.min(Math.max(value, min), max)
}

function isRatioItem(item: StrategicInsightGriItem): boolean {
  return item.aggregation === 'AVERAGE' || item.input_type === 'PERCENTAGE'
}

// ---- member cross-product ----
//
// The contract example ships ONE item per metric (e.g. worker_type only ever INTERN), so even at 15
// entities most dimension members would have no data and chart-spec's card() would drop the card as
// all-zero. So each template is also expanded across every member of every dimension it is labelled
// with: an item labelled {incident_type, employment_status} becomes the full 4x2 grid. That is what
// makes a stacked bar actually stack.
//
// MEMBER_MAGNITUDE corrects the one place where that cross-product lies. OHS's `incident_type`
// dimension mixes units: RECORDABLE is a count (8) while HOURS_WORKED is a duration (1.340.000).
// Expanding the hours-worked template across the whole dimension gave the fatalities bar the
// hours-worked magnitude — a chart reading "37 million deaths". The multiplier restores each
// member's real order of magnitude relative to the template it was expanded from.
// Keyed by metric_key, then dimension, then member. Metric-keyed rather than dimension-keyed
// because the same dimension means different things to different metrics: `employee_category`
// should order training HOURS (seniors get more) but must NOT order the salary RATIO, where every
// category sits near parity and a 0.5x junior would read as "juniors paid half".
const MEMBER_MAGNITUDE: Record<string, Record<string, Record<string, number>>> = {
  // Relative to RECORDABLE. Fatalities are rare, high-consequence injuries uncommon. Without this
  // the cross-product gave the fatalities bar the hours-worked magnitude: "37 million deaths".
  work_related_injuries: {
    incident_type: {
      FATALITY: 0.05,
      HIGH_CONSEQUENCE: 0.12,
      RECORDABLE: 1,
      HOURS_WORKED: 1,
    },
  },
  // The mockup's own figures order these: Senior 44,6h vs Junior 22,9h.
  avg_training_hours: {
    employee_category: { SENIOR: 1, MID: 0.72, JUNIOR: 0.5, STAFF: 0.42 },
  },
}

// Some dimensions are determined by the metric itself and must NOT be cross-expanded.
// `water_withdrawal` is withdrawal by definition; expanding it to water_flow=DISCHARGE invents
// "withdrawal that is actually discharge", and the two then render at the same height because they
// came from one template. chart-spec's water trend chart splits on water_flow, so it needs the two
// directions to come from their own metrics, which is exactly what the contract does.
const METRIC_OWNED_DIMENSIONS = new Set(['water_flow'])

// Each dimension member gets a fixed level of its own, on top of the per-entity jitter.
//
// Without this, every member of a dimension converges to the same height: the per-entity spread is
// symmetric noise, so averaging 15 entities (or summing them) returns ~the template value for every
// member. The Rasio Gaji chart drew Senior, Mid, Junior and Staff at an identical 0.95, and the fuel
// and water-source breakdowns were flat within 3%.
//
// Levels are assigned by RANK, not by hashing each member independently: independent hashes collide
// (two members landing within 0.9% of each other, seen on OHS employment_status and Water
// water_source), which is exactly the flat chart this exists to prevent. Ranking spreads the
// members evenly across the band and guarantees a visible gap between adjacent ones.
const BIAS_BAND = { min: 0.75, max: 1.25 }

function memberLevels(dimension: StrategicInsightDimension, spreadScale: number): Map<string, number> {
  const ranked = [...dimension.members].sort(
    (a, b) => unit(`rank|${dimension.key}|${a.key}`) - unit(`rank|${dimension.key}|${b.key}`),
  )
  const levels = new Map<string, number>()
  const n = ranked.length
  ranked.forEach((member, index) => {
    const t = n === 1 ? 0.5 : index / (n - 1)
    const raw = BIAS_BAND.min + t * (BIAS_BAND.max - BIAS_BAND.min)
    // spreadScale pulls the band toward 1 for ratio metrics, whose believable range is narrow.
    levels.set(member.key, 1 + (raw - 1) * spreadScale)
  })
  return levels
}

// `spreadScale` narrows for ratio metrics: a salary ratio biased by ±25% lands well above parity,
// i.e. women out-earning men across the board, which is not what GRI 405-2 reports.
function memberBias(
  category: StrategicInsightGriCategory,
  metricKey: string,
  labels: Record<string, string>,
  spreadScale = 1,
): number {
  let bias = 1
  for (const [dimensionKey, memberKey] of Object.entries(labels)) {
    // A dimension with an explicit ordering for this metric is skipped: random bias would swamp
    // the ordering it exists to impose (junior training hours drawn above senior).
    if (MEMBER_MAGNITUDE[metricKey]?.[dimensionKey]) continue
    const dimension = category.dimensions.find((d) => d.key === dimensionKey)
    if (!dimension) continue
    bias *= memberLevels(dimension, spreadScale).get(memberKey) ?? 1
  }
  return bias
}

// An item's magnitude multiplier, relative to the template it was expanded from.
function magnitudeFor(
  metricKey: string,
  labels: Record<string, string>,
  templateLabels: Record<string, string>,
): number {
  const perDimension = MEMBER_MAGNITUDE[metricKey]
  if (!perDimension) return 1
  let factor = 1
  for (const [dimensionKey, memberKey] of Object.entries(labels)) {
    const table = perDimension[dimensionKey]
    if (!table) continue
    const templateMember = templateLabels[dimensionKey]
    if (templateMember === undefined) continue
    factor *= (table[memberKey] ?? 1) / (table[templateMember] ?? 1)
  }
  return factor
}

// Items whose template and target member belong to different units are skipped entirely rather than
// rescaled: HOURS_WORKED is hours, every other incident_type member is a count. Cross-expanding
// between them would invent "3 fatalities measured in hours".
const UNIT_ISOLATED_MEMBERS: Record<string, string[]> = {
  incident_type: ['HOURS_WORKED'],
}

function isUnitIsolationViolation(
  labels: Record<string, string>,
  templateLabels: Record<string, string>,
): boolean {
  for (const [dimensionKey, isolated] of Object.entries(UNIT_ISOLATED_MEMBERS)) {
    const templateMember = templateLabels[dimensionKey]
    const targetMember = labels[dimensionKey]
    if (templateMember === undefined || targetMember === undefined) continue
    // Exactly one side isolated = crossing a unit boundary.
    if (isolated.includes(templateMember) !== isolated.includes(targetMember)) return true
  }
  return false
}

function labelCombinations(
  category: StrategicInsightGriCategory,
  labels: Record<string, string>,
): Record<string, string>[] {
  const keys = Object.keys(labels)
  if (keys.length === 0) return [{}]
  let combos: Record<string, string>[] = [{}]
  for (const key of keys) {
    const members = category.dimensions.find((d) => d.key === key)?.members ?? []
    // An unknown dimension key keeps the template's own value rather than dropping the item.
    const values =
      METRIC_OWNED_DIMENSIONS.has(key) || members.length === 0
        ? [labels[key]!]
        : members.map((m) => m.key)
    combos = combos.flatMap((combo) => values.map((value) => ({ ...combo, [key]: value })))
  }
  return combos
}

// The display string for a coordinate. Mirrors what the backend would put in `description`:
// the member names joined, so it stays a human-readable localized label. Never used as a grouping
// key — that is what labels{} is for (gap A2).
function describe(
  category: StrategicInsightGriCategory,
  labels: Record<string, string>,
  fallback: string,
): string {
  const parts = Object.entries(labels).map(([dimensionKey, memberKey]) => {
    const dimension = category.dimensions.find((d) => d.key === dimensionKey)
    return dimension?.members.find((m) => m.key === memberKey)?.name ?? memberKey
  })
  return parts.length > 0 ? parts.join(' · ') : fallback
}

// ---- summary recomputation ----
//
// KPI cards must agree with the charts beneath them. The example's summary values were written for
// a single entity and a single year, so leaving them alone would put "8.614" above a chart totalling
// ~400.000 — the first thing a demo audience spots.
//
// Rather than scale them by a fudge factor, every one of the 32 keys is DERIVED from the same items
// the charts plot. Each entry says which items feed the card; SUM keys sum them, AVERAGE keys
// average them (never sum — that is the "450 training hours" bug), and RATIO keys are a share of a
// pair. So a card and its chart cannot disagree by construction.
//
// ponytail: this table is the demo's stand-in for gap A3 (the backend defines 6 of the 32 summary
// keys). It goes away with the rest of this module once summary[] is complete server-side.
type SummarySource =
  | { kind: 'sum' | 'average'; metric: string; labels?: Record<string, string> }
  | { kind: 'ratio'; metric: string; labels: Record<string, string>; against: Record<string, string>[] }

const SUMMARY_SOURCES: Record<string, SummarySource> = {
  // General
  total_employee: { kind: 'sum', metric: 'employee_headcount' },
  male: { kind: 'sum', metric: 'employee_headcount', labels: { gender: 'MALE' } },
  female: { kind: 'sum', metric: 'employee_headcount', labels: { gender: 'FEMALE' } },
  permanent_employee: { kind: 'sum', metric: 'employee_headcount_by_status', labels: { employment_status: 'PERMANENT' } },
  contract_employee: { kind: 'sum', metric: 'employee_headcount_by_status', labels: { employment_status: 'CONTRACT' } },
  // Energy
  total_non_renewable: { kind: 'sum', metric: 'energy_consumption', labels: { renewability: 'NON_RENEWABLE' } },
  total_renewable: { kind: 'sum', metric: 'energy_consumption', labels: { renewability: 'RENEWABLE' } },
  renewable_ratio: {
    kind: 'ratio',
    metric: 'energy_consumption',
    labels: { renewability: 'RENEWABLE' },
    against: [{ renewability: 'RENEWABLE' }, { renewability: 'NON_RENEWABLE' }],
  },
  // Waste
  total_divert: { kind: 'sum', metric: 'waste_diverted' },
  total_disposal: { kind: 'sum', metric: 'waste_directed_to_disposal' },
  total_recycled: { kind: 'sum', metric: 'waste_diverted', labels: { waste_route: 'RECYCLED' } },
  total_landfill: { kind: 'sum', metric: 'waste_directed_to_disposal', labels: { waste_route: 'LANDFILL' } },
  // Water
  total_withdrawal: { kind: 'sum', metric: 'water_withdrawal' },
  total_discharge: { kind: 'sum', metric: 'water_discharge' },
  surface_water: { kind: 'sum', metric: 'water_withdrawal', labels: { water_source: 'SURFACE' } },
  third_party_water: { kind: 'sum', metric: 'water_withdrawal', labels: { water_source: 'THIRD_PARTY' } },
  // Diversity — governance shares are a % of the governance body, not of all employees (gap A3).
  governance_male_ratio: {
    kind: 'ratio',
    metric: 'governance_body_composition',
    labels: { gender: 'MALE' },
    against: [{ gender: 'MALE' }, { gender: 'FEMALE' }],
  },
  governance_female_ratio: {
    kind: 'ratio',
    metric: 'governance_body_composition',
    labels: { gender: 'FEMALE' },
    against: [{ gender: 'MALE' }, { gender: 'FEMALE' }],
  },
  salary_ratio_senior: { kind: 'average', metric: 'salary_ratio_female_to_male', labels: { employee_category: 'SENIOR' } },
  salary_ratio_junior: { kind: 'average', metric: 'salary_ratio_female_to_male', labels: { employee_category: 'JUNIOR' } },
  // Employment
  new_hire_male: { kind: 'sum', metric: 'new_employee_hires', labels: { gender: 'MALE' } },
  new_hire_female: { kind: 'sum', metric: 'new_employee_hires', labels: { gender: 'FEMALE' } },
  parental_entitled_male: { kind: 'sum', metric: 'parental_leave', labels: { gender: 'MALE', parental_stage: 'ENTITLED' } },
  parental_entitled_female: { kind: 'sum', metric: 'parental_leave', labels: { gender: 'FEMALE', parental_stage: 'ENTITLED' } },
  // OHS
  work_related_fatalities: { kind: 'sum', metric: 'work_related_injuries', labels: { incident_type: 'FATALITY' } },
  high_consequence_injuries: { kind: 'sum', metric: 'work_related_injuries', labels: { incident_type: 'HIGH_CONSEQUENCE' } },
  recordable_injuries: { kind: 'sum', metric: 'work_related_injuries', labels: { incident_type: 'RECORDABLE' } },
  total_hours_worked: { kind: 'sum', metric: 'work_related_injuries', labels: { incident_type: 'HOURS_WORKED' } },
  // Training — averages, never sums.
  avg_training_hours_male: { kind: 'average', metric: 'avg_training_hours', labels: { gender: 'MALE' } },
  avg_training_hours_female: { kind: 'average', metric: 'avg_training_hours', labels: { gender: 'FEMALE' } },
  avg_training_hours_senior: { kind: 'average', metric: 'avg_training_hours', labels: { employee_category: 'SENIOR' } },
  avg_training_hours_junior: { kind: 'average', metric: 'avg_training_hours', labels: { employee_category: 'JUNIOR' } },
}

function matching(
  items: StrategicInsightGriItem[],
  metric: string,
  labels: Record<string, string> = {},
): number[] {
  return items
    .filter(
      (i) =>
        i.metric_key === metric &&
        typeof i.value === 'number' &&
        Object.entries(labels).every(([k, v]) => i.labels[k] === v),
    )
    .map((i) => i.value as number)
}

function round(value: number): number {
  return Math.abs(value) >= 100 ? Math.round(value) : Math.round(value * 100) / 100
}

// Returns undefined when no item feeds the key, so the caller can keep the contract's own value
// rather than replacing a real figure with a 0.
function deriveSummary(
  items: StrategicInsightGriItem[],
  key: string,
): number | undefined {
  const source = SUMMARY_SOURCES[key]
  if (!source) return undefined

  if (source.kind === 'ratio') {
    const part = matching(items, source.metric, source.labels).reduce((a, b) => a + b, 0)
    const whole = source.against
      .flatMap((labels) => matching(items, source.metric, labels))
      .reduce((a, b) => a + b, 0)
    return whole === 0 ? undefined : round((part / whole) * 100)
  }

  const values = matching(items, source.metric, source.labels)
  if (values.length === 0) return undefined
  const total = values.reduce((a, b) => a + b, 0)
  const value = source.kind === 'average' ? total / values.length : total
  return round(source.kind === 'average' ? clampToRange(source.metric, value, false) : value)
}

// ---- the fixture ----

export interface DemoGriOptions {
  entities?: { id: string; code: string; name: string }[]
  periods?: number[]
}

// Deep-clones the base on every call so a caller mutating the result cannot poison the next one
// (the JSON import is a single shared object).
function baseCategories(): StrategicInsightGriCategory[] {
  return JSON.parse(JSON.stringify(base)) as StrategicInsightGriCategory[]
}

export function demoGriQuantitative(
  options: DemoGriOptions = {},
): StrategicInsightGriQuantitativeResponse {
  const entities = options.entities ?? DEMO_ENTITIES
  const periods = options.periods ?? DEMO_PERIODS

  return baseCategories().map((category) => {
    const templates = category.items
    const items: StrategicInsightGriItem[] = []
    let sequence = 0

    for (const template of templates) {
      for (const labels of labelCombinations(category, template.labels)) {
        if (isUnitIsolationViolation(labels, template.labels)) continue
        const magnitude = magnitudeFor(template.metric_key, labels, template.labels)
        // Ratio metrics get a narrower, slightly-below-1 bias band so salary ratios stay under
        // parity and percentages stay believable.
        const bias = isRatioItem(template)
          ? memberBias(category, template.metric_key, labels, 0.35)
          : memberBias(category, template.metric_key, labels)
        for (const [periodIndex, period] of periods.entries()) {
          for (const entity of entities) {
            const seed = `${category.category_id.id}|${template.metric_key}|${JSON.stringify(labels)}|${entity.code}|${period}`
            sequence += 1

            let value: number | string | boolean
            if (typeof template.value !== 'number') {
              // TEXT / DATE / BOOLEAN disclosures: one per entity/period, carried through
              // unchanged. No widget plots them (gap C1); they exist so the payload stays honest.
              value = template.value
            } else if (isRatioItem(template)) {
              value = scaleRatio(
                template.value * magnitude * bias,
                seed,
                template.input_type === 'PERCENTAGE',
                periodIndex,
                template.metric_key,
              )
            } else {
              value = scaleAbsolute(template.value * magnitude * bias, seed, periodIndex)
            }

            items.push({
              ...template,
              id: `demo-${category.category_id.id}-${sequence}`,
              period,
              entity: { ...entity },
              labels,
              description: describe(category, labels, template.description),
              value,
            })
          }
        }
      }
    }

    return {
      ...category,
      summary: category.summary.map((s) => {
        const derived = deriveSummary(items, s.key)
        return derived === undefined ? s : { ...s, value: derived }
      }),
      items,
    }
  })
}

// ---- client-side filtering ----
//
// The backend accepts period/entity_id/category_id and ignores all three (4/4 probes returned
// byte-identical payloads, gap G3), so the two dropdowns on the page would do nothing. Filter here
// instead, following the scope rule the page already assumes (gap A4):
//   - summary[] is recomputed under the filter, because KPI cards show the current selection;
//   - items[] is left UNFILTERED by period, because the trend charts plot every year and the
//     PT-comparison chart every entity regardless of the filter. Pruning items[] here would empty
//     every chart on the page — the exact failure A4 warns about.
// entity_id does narrow items[], since a single-entity view legitimately shows one entity's trend.
export function applyDemoFilters(
  categories: StrategicInsightGriQuantitativeResponse,
  params: StrategicInsightFilterParams = {},
): StrategicInsightGriQuantitativeResponse {
  const period = params.period ? Number(params.period) : null
  const entityId = params.entity_id || null
  const categoryId = params.category_id || null

  const scoped = categoryId
    ? categories.filter((c) => c.category_id.id === categoryId)
    : categories

  if (!period && !entityId) return scoped

  return scoped.map((category) => {
    const inScope = category.items.filter(
      (i) => (!period || i.period === period) && (!entityId || i.entity.id === entityId),
    )
    // Recompute each KPI from the items in scope where the items can support it, so the cards move
    // with the filter. Where no item carries that summary's concept (26 of 32 keys have no
    // item-level source — gap A3), scale the unfiltered value by the selection's share instead of
    // showing a stale figure or an em-dash.
    const share = category.items.length > 0 ? inScope.length / category.items.length : 0
    return {
      ...category,
      summary: category.summary.map((s) =>
        s.aggregation === 'SUM'
          ? { ...s, value: Math.round(s.value * share) }
          : s /* AVERAGE/PERCENTAGE are scope-invariant by construction */,
      ),
      // entity narrows items[]; period does NOT (see the A4 note above).
      items: entityId ? category.items.filter((i) => i.entity.id === entityId) : category.items,
    }
  })
}

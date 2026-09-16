// Adapts the wire shape GET /v1/strategic-insight/gri-quantitative actually sends
// (StrategicInsightGriWireCategory[], see types.d.ts) into the canonical
// StrategicInsightGriCategory[] that aggregate.ts/chart-spec.ts/tab-index.ts and
// GriQuantitativePage.vue already consume. This is the ONLY place in the codebase that knows the
// wire shape — everything downstream still describes one shape, so the page has no branching.
//
// Why an adapter instead of rewriting the downstream helpers to the wire shape: chart-spec.ts
// (565 lines, 27 cards, 18 dimensions) is correct against the canonical shape and was validated by
// a real browser run (run-dashboard-acceptance.sh). Rewriting it to group on `description` would
// re-introduce gap A2 — the exact bug the labels model exists to prevent (raw free text, localized
// and editable, used as a chart-series key). When BE eventually adds `labels{}`/`dimensions[]`
// natively, the derivation steps below become pass-throughs and get deleted; nothing else changes.
//
// Pure, dependency-free (no vue, no '@/' alias) so normalize.check.ts can run under a plain node
// runner, matching aggregate.ts/chart-spec.ts's convention.

// ---- category_id: bare uppercase token -> Ref2 ----
//
// ponytail: this table is an FE-side stand-in for a field the backend should send (see gap A1 in
// docs/dashboard-gri-quantitative-api-gaps.md — BE confirmed the *shape* is current, but
// `category` is still a bare string with no id, which this table exists to patch around). Delete
// this table and the lookup below the day `category_id: {id, name}` arrives on the wire; the ids
// here are transcribed from the committed contract's `Response Dummy` example so they resolve
// against the same master-category rows GET /v1/master-category/index returns.
const CATEGORY_SLUGS: Record<string, { id: string; name: string }> = {
  GENERAL: { id: 'gbqp0oQHcJ5', name: 'General' },
  ENERGY: { id: 'QRHwbmCAc4qK', name: 'Energy' },
  WASTE: { id: 'PuhrwZ5NYMbZ', name: 'Waste' },
  WATER: { id: 'hfUlk15BIv2H', name: 'Water' },
  DIVERSITY: { id: 'gbqp0NVHVJ7U', name: 'Diversity & Equal Opportunity' },
  EMPLOYMENT: { id: 'SxD1zsTIOsMX', name: 'Employment' },
  OHS: { id: '6XnLWDcgkx1f', name: 'OHS' },
  TRAINING: { id: 'miz42eKxO36s', name: 'Training & Education' },
}

function titleCase(token: string): string {
  return token
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w[0]!.toUpperCase() + w.slice(1))
    .join(' ')
}

// Unknown token passes through as { id: token, name: titleCase(token) } so a new category the
// table hasn't been taught yet still renders as a tab (falls through to the generic renderer in
// chart-spec.ts) instead of vanishing from the page silently.
function resolveCategoryId(token: string): Ref2 {
  return CATEGORY_SLUGS[token] ?? { id: token, name: titleCase(token) }
}

// ---- gri_codes: unique items[].gri_code, trimmed to their tab root, first-seen order ----
//
// '2-7a' -> '2-7', '302-1a' -> '302-1', '2-2' -> '2-2' (no trailing letter, already a root). This
// is what resolveTab() in chart-spec.ts pattern-matches on
// (`codes.some((c) => c === prefix || c.startsWith(\`${prefix}-\`))`), so keeping the trailing
// letter here would silently drop every tab to the generic renderer — resolveTab() only matches
// tab roots, not leaf disclosure codes.
function trimGriCode(code: string): string {
  return code.replace(/[a-zA-Z]+$/, '')
}

function griCodesOf(items: StrategicInsightGriWireItem[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const item of items) {
    const root = trimGriCode(item.gri_code)
    if (!seen.has(root)) {
      seen.add(root)
      out.push(root)
    }
  }
  return out
}

// ---- slug: metric_name -> metric_key ----
//
// Matches the convention DetailPage.vue's slugify() already uses for MKI schema keys, and the
// exact convention chart-spec.ts's byMetric() calls assume ('Employee Headcount' -> 'employee_headcount').
function slug(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

// ---- Phase 2: description -> labels, via a declared vocabulary ----
//
// Per-category-token list of { dimension, member, name, aliases[] }. Seeded from the wire's
// actual `description` values (verified live 2026-09-10) and the committed contract's
// `Response Dummy` example (api/Dashboard/GRI - Quantitative.yml), which carries the full 8-tab
// member set the mockup needs — the live payload only exercises 2 of those tabs today (gap G2),
// but the vocabulary is written for all 8 so it doesn't need re-deriving when BE ships the rest.
//
// `aliases` exists because the same dimension member is spelled differently in different tabs:
// General/Employment/Training call gender members 'Laki-laki'/'Perempuan', Diversity/Employment
// call the same MALE/FEMALE pair 'Pria'/'Wanita' — both spellings must resolve to the same member
// key. Likewise 'Tetap'/'Kontrak' (General) vs 'Karyawan Tetap'/'Karyawan Kontrak' (OHS).
interface VocabEntry {
  dimension: string
  dimensionName: string
  member: string
  name: string
  aliases: string[]
}

const DIMENSION_VOCABULARY: Record<string, VocabEntry[]> = {
  GENERAL: [
    { dimension: 'gender', dimensionName: 'Gender', member: 'MALE', name: 'Male', aliases: ['Pria', 'Laki-laki'] },
    { dimension: 'gender', dimensionName: 'Gender', member: 'FEMALE', name: 'Female', aliases: ['Wanita', 'Perempuan'] },
    { dimension: 'employment_status', dimensionName: 'Employment Status', member: 'PERMANENT', name: 'Permanent', aliases: ['Karyawan Tetap', 'Tetap'] },
    { dimension: 'employment_status', dimensionName: 'Employment Status', member: 'CONTRACT', name: 'Contract', aliases: ['Karyawan Kontrak', 'Kontrak'] },
    { dimension: 'worker_type', dimensionName: 'Non-Employee Worker Type', member: 'CONTRACTOR', name: 'Contractor', aliases: ['Kontraktor'] },
    { dimension: 'worker_type', dimensionName: 'Non-Employee Worker Type', member: 'INTERN', name: 'Intern', aliases: ['Magang'] },
    { dimension: 'worker_type', dimensionName: 'Non-Employee Worker Type', member: 'VOLUNTEER', name: 'Volunteer', aliases: ['Sukarela'] },
    { dimension: 'worker_type', dimensionName: 'Non-Employee Worker Type', member: 'OUTSOURCED', name: 'Outsource', aliases: [] },
  ],
  ENERGY: [
    { dimension: 'renewability', dimensionName: 'Energy Source', member: 'NON_RENEWABLE', name: 'Non-Renewable', aliases: [] },
    { dimension: 'renewability', dimensionName: 'Energy Source', member: 'RENEWABLE', name: 'Renewable', aliases: [] },
    { dimension: 'fuel_type', dimensionName: 'Fuel Type', member: 'DIESEL', name: 'Diesel', aliases: ['Solar'] },
    { dimension: 'fuel_type', dimensionName: 'Fuel Type', member: 'BIODIESEL', name: 'Biodiesel', aliases: [] },
    { dimension: 'fuel_type', dimensionName: 'Fuel Type', member: 'GRID', name: 'Grid/Coal', aliases: ['Grid/Batubara'] },
  ],
  WASTE: [
    { dimension: 'waste_route', dimensionName: 'Waste Route', member: 'RECYCLED', name: 'Recycled', aliases: [] },
    { dimension: 'waste_route', dimensionName: 'Waste Route', member: 'COMPOSTED', name: 'Composted', aliases: [] },
    { dimension: 'waste_route', dimensionName: 'Waste Route', member: 'RECOVERY', name: 'Recovery', aliases: [] },
    { dimension: 'waste_route', dimensionName: 'Waste Route', member: 'LANDFILL', name: 'Landfill', aliases: [] },
    { dimension: 'waste_route', dimensionName: 'Waste Route', member: 'INCINERATION', name: 'Incineration', aliases: [] },
    { dimension: 'waste_route', dimensionName: 'Waste Route', member: 'OTHER', name: 'Other', aliases: [] },
  ],
  WATER: [
    { dimension: 'water_flow', dimensionName: 'Water Flow', member: 'WITHDRAWAL', name: 'Withdrawal', aliases: ['Penarikan'] },
    { dimension: 'water_flow', dimensionName: 'Water Flow', member: 'DISCHARGE', name: 'Discharge', aliases: ['Pembuangan'] },
    { dimension: 'water_source', dimensionName: 'Water Source', member: 'SURFACE', name: 'Surface', aliases: [] },
    { dimension: 'water_source', dimensionName: 'Water Source', member: 'GROUNDWATER', name: 'Groundwater', aliases: [] },
    { dimension: 'water_source', dimensionName: 'Water Source', member: 'SEAWATER', name: 'Seawater', aliases: [] },
    { dimension: 'water_source', dimensionName: 'Water Source', member: 'THIRD_PARTY', name: 'Third-party', aliases: [] },
  ],
  DIVERSITY: [
    { dimension: 'gender', dimensionName: 'Gender', member: 'MALE', name: 'Male', aliases: ['Pria', 'Laki-laki'] },
    { dimension: 'gender', dimensionName: 'Gender', member: 'FEMALE', name: 'Female', aliases: ['Wanita', 'Perempuan'] },
    { dimension: 'age_band', dimensionName: 'Age Group', member: 'UNDER_30', name: '<30 years', aliases: ['<30 tahun'] },
    { dimension: 'age_band', dimensionName: 'Age Group', member: 'BETWEEN_30_50', name: '30-50 years', aliases: ['30-50 tahun'] },
    { dimension: 'age_band', dimensionName: 'Age Group', member: 'OVER_50', name: '>50 years', aliases: ['>50 tahun'] },
    { dimension: 'employee_category', dimensionName: 'Employee Category', member: 'SENIOR', name: 'Senior', aliases: [] },
    { dimension: 'employee_category', dimensionName: 'Employee Category', member: 'MID', name: 'Mid', aliases: [] },
    { dimension: 'employee_category', dimensionName: 'Employee Category', member: 'JUNIOR', name: 'Junior', aliases: [] },
    { dimension: 'employee_category', dimensionName: 'Employee Category', member: 'STAFF', name: 'Staff', aliases: [] },
  ],
  EMPLOYMENT: [
    { dimension: 'gender', dimensionName: 'Gender', member: 'MALE', name: 'Male', aliases: ['Pria', 'Laki-laki'] },
    { dimension: 'gender', dimensionName: 'Gender', member: 'FEMALE', name: 'Female', aliases: ['Wanita', 'Perempuan'] },
    { dimension: 'age_band', dimensionName: 'Age Group', member: 'UNDER_30', name: '<30 years', aliases: ['<30 tahun'] },
    { dimension: 'age_band', dimensionName: 'Age Group', member: 'BETWEEN_30_50', name: '30-50 years', aliases: ['30-50 tahun'] },
    { dimension: 'age_band', dimensionName: 'Age Group', member: 'OVER_50', name: '>50 years', aliases: ['>50 tahun'] },
    { dimension: 'parental_stage', dimensionName: 'Parental Leave Stage', member: 'ENTITLED', name: 'Entitled', aliases: ['Berhak'] },
    { dimension: 'parental_stage', dimensionName: 'Parental Leave Stage', member: 'TOOK', name: 'Took', aliases: ['Mengambil'] },
    { dimension: 'parental_stage', dimensionName: 'Parental Leave Stage', member: 'RETURNED', name: 'Returned', aliases: ['Kembali'] },
  ],
  OHS: [
    { dimension: 'incident_type', dimensionName: 'Incident Type', member: 'FATALITY', name: 'Work-related fatality', aliases: ['Kematian akibat kerja'] },
    { dimension: 'incident_type', dimensionName: 'Incident Type', member: 'HIGH_CONSEQUENCE', name: 'High-consequence injury (non-fatal)', aliases: ['Cedera berat (non-fatal)'] },
    { dimension: 'incident_type', dimensionName: 'Incident Type', member: 'RECORDABLE', name: 'Recordable incident', aliases: ['Kecelakaan tercatat'] },
    { dimension: 'incident_type', dimensionName: 'Incident Type', member: 'HOURS_WORKED', name: 'Total hours worked', aliases: ['Total jam kerja'] },
    { dimension: 'employment_status', dimensionName: 'Employment Status', member: 'PERMANENT', name: 'Permanent Employee', aliases: ['Tetap', 'Karyawan Tetap'] },
    { dimension: 'employment_status', dimensionName: 'Employment Status', member: 'CONTRACT', name: 'Contract Employee', aliases: ['Kontrak', 'Karyawan Kontrak'] },
  ],
  TRAINING: [
    { dimension: 'gender', dimensionName: 'Gender', member: 'MALE', name: 'Male', aliases: ['Pria', 'Laki-laki'] },
    { dimension: 'gender', dimensionName: 'Gender', member: 'FEMALE', name: 'Female', aliases: ['Wanita', 'Perempuan'] },
    { dimension: 'employee_category', dimensionName: 'Employee Category', member: 'SENIOR', name: 'Senior', aliases: [] },
    { dimension: 'employee_category', dimensionName: 'Employee Category', member: 'MID', name: 'Mid', aliases: [] },
    { dimension: 'employee_category', dimensionName: 'Employee Category', member: 'JUNIOR', name: 'Junior', aliases: [] },
    { dimension: 'employee_category', dimensionName: 'Employee Category', member: 'STAFF', name: 'Staff', aliases: [] },
  ],
}

// case- and accent-insensitive, trimmed
function normalizeText(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function buildLookup(entries: VocabEntry[]): Map<string, VocabEntry> {
  const lookup = new Map<string, VocabEntry>()
  for (const entry of entries) {
    lookup.set(normalizeText(entry.name), entry)
    for (const alias of entry.aliases) lookup.set(normalizeText(alias), entry)
  }
  return lookup
}

// A composite description like 'Non-Renewable — Solar' or 'Wanita — <30 tahun' splits on the
// em-dash separator into one token per dimension the item is coordinate-tagged on; a plain
// description ('Laki-laki') is a single token. Each token is matched against the category's
// vocabulary independently, so a two-dimension split (OHS: incident type × employment status) is
// expressible even though the wire still sends it as one flat string.
const DESCRIPTION_SPLIT_RE = /\s+—\s+/

function deriveLabels(
  categoryToken: string,
  description: string,
  warnings: string[],
  itemId: string,
): Record<string, string> {
  const entries = DIMENSION_VOCABULARY[categoryToken]
  if (!entries || !description) return {}
  const lookup = buildLookup(entries)
  const tokens = description.split(DESCRIPTION_SPLIT_RE)
  const labels: Record<string, string> = {}
  let allMatched = true
  for (const token of tokens) {
    const match = lookup.get(normalizeText(token))
    if (match) {
      labels[match.dimension] = match.member
    } else {
      allMatched = false
    }
  }
  if (!allMatched && Object.keys(labels).length === 0) {
    // Not invented: an item with no labels is excluded from dimension series by itemsAt() already,
    // so the chart drops rather than lying about a member it isn't actually reporting.
    warnings.push(
      `item ${itemId}: description '${description}' matched no declared vocabulary member (category ${categoryToken})`,
    )
  }
  return labels
}

// dimensions[] per category: the members actually observed, in vocabulary-declared order (never
// object key order — chart series order must be stable across refetches, per chart-spec.ts's
// seriesByDimension/seriesOverPeriods contract).
function dimensionsObserved(
  categoryToken: string,
  items: StrategicInsightGriItem[],
): StrategicInsightDimension[] {
  const entries = DIMENSION_VOCABULARY[categoryToken]
  if (!entries) return []
  const observed = new Map<string, Set<string>>()
  for (const item of items) {
    for (const [dimension, member] of Object.entries(item.labels)) {
      if (!observed.has(dimension)) observed.set(dimension, new Set())
      observed.get(dimension)!.add(member)
    }
  }
  const byDimension = new Map<string, { name: string; members: StrategicInsightDimensionMember[] }>()
  for (const entry of entries) {
    const memberSet = observed.get(entry.dimension)
    if (!memberSet || !memberSet.has(entry.member)) continue
    if (!byDimension.has(entry.dimension)) {
      byDimension.set(entry.dimension, { name: entry.dimensionName, members: [] })
    }
    byDimension.get(entry.dimension)!.members.push({ key: entry.member, name: entry.name })
  }
  return [...byDimension.entries()].map(([key, { name, members }]) => ({ key, name, members }))
}

// ---- Phase 3: items[].aggregation (G1), stated not guessed ----
//
// ponytail: items[].aggregation is absent from the wire and cannot be inferred from input_type —
// salary ratios and average training hours are plain NUMBERs that must still AVERAGE (summing them
// produced the visible "1.88 ratio" and "~450 average hours" bugs, see aggregate.ts's comment on
// aggregateItems). This allow-list is an FE-side stand-in for a BE field, not a real derivation:
// delete this table and default-to-SUM fallback the day items[].aggregation arrives on the wire,
// and read the value straight through instead.
//
// Everything not on this list, and not input_type PERCENTAGE, is SUM. A PERCENTAGE item (e.g. the
// Female Manager Ratio disclosure) is itself already a ratio, so combining several across entities
// must average them too, same rule as the two NUMBER exceptions below — just reached by input_type
// instead of by metric_key, per the plan's allow-list definition.
const AVERAGE_METRIC_KEYS = new Set(['salary_ratio_female_to_male', 'avg_training_hours'])

function aggregationFor(metricKey: string, inputType: StrategicInsightInputType): StrategicInsightAggregation {
  if (inputType === 'PERCENTAGE' || AVERAGE_METRIC_KEYS.has(metricKey)) return 'AVERAGE'
  return 'SUM'
}

export interface NormalizeResult {
  categories: StrategicInsightGriCategory[]
  warnings: string[]
}

// A category that already carries `category_id`/`dimensions[]` is CANONICAL, not wire — it has
// nothing left to derive. Two callers depend on this: scripts/mock-api-server.ts serves the
// canonical demo fixture through the same api.ts path the browser uses, and the day the backend
// migrates it will start sending this shape for real. Passing it through untouched (rather than
// crashing in titleCase on an undefined `category`) is what makes the adapter idempotent, so the
// migration becomes a no-op here instead of a rewrite.
function isCanonical(category: unknown): category is StrategicInsightGriCategory {
  return (
    typeof category === 'object' &&
    category !== null &&
    'category_id' in category &&
    typeof (category as StrategicInsightGriCategory).category_id?.id === 'string'
  )
}

export function normalizeGriQuantitative(
  wire: StrategicInsightGriQuantitativeWireResponse | StrategicInsightGriQuantitativeResponse,
): NormalizeResult {
  const warnings: string[] = []

  const categories: StrategicInsightGriCategory[] = wire.map((rawCategory, index) => {
    if (isCanonical(rawCategory)) return rawCategory
    const wireCategory = rawCategory as StrategicInsightGriWireCategory
    const category_id = resolveCategoryId(wireCategory.category)
    const gri_codes = griCodesOf(wireCategory.items)

    const items: StrategicInsightGriItem[] = wireCategory.items.map((wireItem) => ({
      id: wireItem.id,
      period: wireItem.period,
      entity: wireItem.entity,
      gri_code: wireItem.gri_code,
      metric_key: slug(wireItem.metric_name),
      metric_name: wireItem.metric_name,
      labels: deriveLabels(wireCategory.category, wireItem.description, warnings, wireItem.id),
      description: wireItem.description,
      value: wireItem.value,
      unit: wireItem.unit_id,
      input_type: wireItem.input_type,
      aggregation: aggregationFor(slug(wireItem.metric_name), wireItem.input_type),
    }))

    const summary: StrategicInsightGriSummary[] = wireCategory.summary.map((s) => ({
      key: s.key,
      name: s.name,
      value: s.value,
      unit: s.unit_id,
      aggregation: s.aggregation,
      ...(s.total !== undefined ? { total: s.total } : {}),
    }))

    return {
      category_id,
      gri_codes,
      sequence: index + 1,
      dimensions: dimensionsObserved(wireCategory.category, items),
      summary,
      items,
    }
  })

  return { categories, warnings }
}

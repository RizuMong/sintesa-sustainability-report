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
    { dimension: 'gender', dimensionName: 'Gender', member: 'MALE', name: 'Laki-laki', aliases: ['Pria'] },
    { dimension: 'gender', dimensionName: 'Gender', member: 'FEMALE', name: 'Perempuan', aliases: ['Wanita'] },
    { dimension: 'employment_status', dimensionName: 'Status Karyawan', member: 'PERMANENT', name: 'Tetap', aliases: ['Karyawan Tetap'] },
    { dimension: 'employment_status', dimensionName: 'Status Karyawan', member: 'CONTRACT', name: 'Kontrak', aliases: ['Karyawan Kontrak'] },
    { dimension: 'worker_type', dimensionName: 'Tipe Pekerja Non-Karyawan', member: 'CONTRACTOR', name: 'Kontraktor', aliases: [] },
    { dimension: 'worker_type', dimensionName: 'Tipe Pekerja Non-Karyawan', member: 'INTERN', name: 'Magang', aliases: [] },
    { dimension: 'worker_type', dimensionName: 'Tipe Pekerja Non-Karyawan', member: 'VOLUNTEER', name: 'Sukarela', aliases: [] },
    { dimension: 'worker_type', dimensionName: 'Tipe Pekerja Non-Karyawan', member: 'OUTSOURCED', name: 'Outsource', aliases: [] },
  ],
  ENERGY: [
    { dimension: 'renewability', dimensionName: 'Sumber Energi', member: 'NON_RENEWABLE', name: 'Non-Renewable', aliases: [] },
    { dimension: 'renewability', dimensionName: 'Sumber Energi', member: 'RENEWABLE', name: 'Renewable', aliases: [] },
    { dimension: 'fuel_type', dimensionName: 'Jenis Bahan Bakar', member: 'DIESEL', name: 'Solar', aliases: [] },
    { dimension: 'fuel_type', dimensionName: 'Jenis Bahan Bakar', member: 'BIODIESEL', name: 'Biodiesel', aliases: [] },
    { dimension: 'fuel_type', dimensionName: 'Jenis Bahan Bakar', member: 'GRID', name: 'Grid/Batubara', aliases: [] },
  ],
  WASTE: [
    { dimension: 'waste_route', dimensionName: 'Rute Limbah', member: 'RECYCLED', name: 'Recycled', aliases: [] },
    { dimension: 'waste_route', dimensionName: 'Rute Limbah', member: 'COMPOSTED', name: 'Composted', aliases: [] },
    { dimension: 'waste_route', dimensionName: 'Rute Limbah', member: 'RECOVERY', name: 'Recovery', aliases: [] },
    { dimension: 'waste_route', dimensionName: 'Rute Limbah', member: 'LANDFILL', name: 'Landfill', aliases: [] },
    { dimension: 'waste_route', dimensionName: 'Rute Limbah', member: 'INCINERATION', name: 'Incineration', aliases: [] },
    { dimension: 'waste_route', dimensionName: 'Rute Limbah', member: 'OTHER', name: 'Other', aliases: [] },
  ],
  WATER: [
    { dimension: 'water_flow', dimensionName: 'Aliran Air', member: 'WITHDRAWAL', name: 'Penarikan', aliases: [] },
    { dimension: 'water_flow', dimensionName: 'Aliran Air', member: 'DISCHARGE', name: 'Pembuangan', aliases: [] },
    { dimension: 'water_source', dimensionName: 'Sumber Air', member: 'SURFACE', name: 'Surface', aliases: [] },
    { dimension: 'water_source', dimensionName: 'Sumber Air', member: 'GROUNDWATER', name: 'Groundwater', aliases: [] },
    { dimension: 'water_source', dimensionName: 'Sumber Air', member: 'SEAWATER', name: 'Seawater', aliases: [] },
    { dimension: 'water_source', dimensionName: 'Sumber Air', member: 'THIRD_PARTY', name: 'Third-party', aliases: [] },
  ],
  DIVERSITY: [
    { dimension: 'gender', dimensionName: 'Gender', member: 'MALE', name: 'Pria', aliases: ['Laki-laki'] },
    { dimension: 'gender', dimensionName: 'Gender', member: 'FEMALE', name: 'Wanita', aliases: ['Perempuan'] },
    { dimension: 'age_band', dimensionName: 'Kelompok Umur', member: 'UNDER_30', name: '<30 tahun', aliases: [] },
    { dimension: 'age_band', dimensionName: 'Kelompok Umur', member: 'BETWEEN_30_50', name: '30-50 tahun', aliases: [] },
    { dimension: 'age_band', dimensionName: 'Kelompok Umur', member: 'OVER_50', name: '>50 tahun', aliases: [] },
    { dimension: 'employee_category', dimensionName: 'Kategori Karyawan', member: 'SENIOR', name: 'Senior', aliases: [] },
    { dimension: 'employee_category', dimensionName: 'Kategori Karyawan', member: 'MID', name: 'Mid', aliases: [] },
    { dimension: 'employee_category', dimensionName: 'Kategori Karyawan', member: 'JUNIOR', name: 'Junior', aliases: [] },
    { dimension: 'employee_category', dimensionName: 'Kategori Karyawan', member: 'STAFF', name: 'Staff', aliases: [] },
  ],
  EMPLOYMENT: [
    { dimension: 'gender', dimensionName: 'Gender', member: 'MALE', name: 'Pria', aliases: ['Laki-laki'] },
    { dimension: 'gender', dimensionName: 'Gender', member: 'FEMALE', name: 'Wanita', aliases: ['Perempuan'] },
    { dimension: 'age_band', dimensionName: 'Kelompok Umur', member: 'UNDER_30', name: '<30 tahun', aliases: [] },
    { dimension: 'age_band', dimensionName: 'Kelompok Umur', member: 'BETWEEN_30_50', name: '30-50 tahun', aliases: [] },
    { dimension: 'age_band', dimensionName: 'Kelompok Umur', member: 'OVER_50', name: '>50 tahun', aliases: [] },
    { dimension: 'parental_stage', dimensionName: 'Tahap Cuti Orang Tua', member: 'ENTITLED', name: 'Berhak', aliases: [] },
    { dimension: 'parental_stage', dimensionName: 'Tahap Cuti Orang Tua', member: 'TOOK', name: 'Mengambil', aliases: [] },
    { dimension: 'parental_stage', dimensionName: 'Tahap Cuti Orang Tua', member: 'RETURNED', name: 'Kembali', aliases: [] },
  ],
  OHS: [
    { dimension: 'incident_type', dimensionName: 'Jenis Insiden', member: 'FATALITY', name: 'Kematian akibat kerja', aliases: [] },
    { dimension: 'incident_type', dimensionName: 'Jenis Insiden', member: 'HIGH_CONSEQUENCE', name: 'Cedera berat (non-fatal)', aliases: [] },
    { dimension: 'incident_type', dimensionName: 'Jenis Insiden', member: 'RECORDABLE', name: 'Kecelakaan tercatat', aliases: [] },
    { dimension: 'incident_type', dimensionName: 'Jenis Insiden', member: 'HOURS_WORKED', name: 'Total jam kerja', aliases: [] },
    { dimension: 'employment_status', dimensionName: 'Status Karyawan', member: 'PERMANENT', name: 'Karyawan Tetap', aliases: ['Tetap'] },
    { dimension: 'employment_status', dimensionName: 'Status Karyawan', member: 'CONTRACT', name: 'Karyawan Kontrak', aliases: ['Kontrak'] },
  ],
  TRAINING: [
    { dimension: 'gender', dimensionName: 'Gender', member: 'MALE', name: 'Pria', aliases: ['Laki-laki'] },
    { dimension: 'gender', dimensionName: 'Gender', member: 'FEMALE', name: 'Wanita', aliases: ['Perempuan'] },
    { dimension: 'employee_category', dimensionName: 'Kategori Karyawan', member: 'SENIOR', name: 'Senior', aliases: [] },
    { dimension: 'employee_category', dimensionName: 'Kategori Karyawan', member: 'MID', name: 'Mid', aliases: [] },
    { dimension: 'employee_category', dimensionName: 'Kategori Karyawan', member: 'JUNIOR', name: 'Junior', aliases: [] },
    { dimension: 'employee_category', dimensionName: 'Kategori Karyawan', member: 'STAFF', name: 'Staff', aliases: [] },
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

export interface NormalizeResult {
  categories: StrategicInsightGriCategory[]
  warnings: string[]
}

export function normalizeGriQuantitative(
  wire: StrategicInsightGriQuantitativeWireResponse,
): NormalizeResult {
  const warnings: string[] = []

  const categories: StrategicInsightGriCategory[] = wire.map((wireCategory, index) => {
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
      aggregation: 'SUM',
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

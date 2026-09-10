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
      labels: {},
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
      dimensions: [],
      summary,
      items,
    }
  })

  return { categories, warnings }
}

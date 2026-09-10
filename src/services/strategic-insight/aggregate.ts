// pure, dependency-free — kept separate from api.ts so api.check.ts can import it via a relative
// path without Node having to resolve the '@/' tsconfig alias.
//
// Shapes come from the `Contract` example in api/Dashboard/GRI - Quantitative.yml. The rule that
// drives this whole file: chart series are grouped on `items[].labels` (stable dimension member
// keys), never on `items[].description` (a localized, editable display string) — gap A2 in
// docs/dashboard-gri-quantitative-api-gaps.md.

// `value` is typed `number | string | boolean` because one payload carries NUMBER, PERCENTAGE,
// TEXT, DATE and BOOLEAN disclosures. Charts only ever plot the numeric ones.
export function isNumericItem(item: StrategicInsightGriItem): boolean {
  return (
    (item.input_type === 'NUMBER' || item.input_type === 'PERCENTAGE') &&
    typeof item.value === 'number' &&
    Number.isFinite(item.value)
  )
}

function numericValue(item: StrategicInsightGriItem): number {
  return isNumericItem(item) ? (item.value as number) : 0
}

// Periods present in the data, ascending — the x-axis of every trend chart.
//
// Deliberately derived from items[] rather than the period filter: items[] is documented as
// unfiltered, because the trend charts plot every period regardless of the active filter (gap A4).
export function periodsOf(items: StrategicInsightGriItem[]): number[] {
  return [...new Set(items.map((i) => i.period))].sort((a, b) => a - b)
}

// Items sitting at a given coordinate, e.g. dimensionKey 'gender', memberKey 'MALE'.
// An item with no entry for that dimension is not a member of it and is excluded.
export function itemsAt(
  items: StrategicInsightGriItem[],
  dimensionKey: string,
  memberKey: string,
): StrategicInsightGriItem[] {
  return items.filter((i) => i.labels[dimensionKey] === memberKey)
}

// AC-75: when a selection spans several entities and/or periods, absolute metrics sum
// (total tons of waste) and ratio metrics average (% renewable energy, salary ratios).
//
// Which of the two applies is read from `items[].aggregation`, NOT inferred from `input_type`.
// Inferring was a real bug: salary ratios and average-training-hours are `input_type: NUMBER`
// (they are plain numbers, not percentages), so they got summed — two entities each reporting a
// 0.94 salary ratio produced "1.88", and training hours across 15 entities read ~450 average
// hours instead of ~30. `input_type` describes how a value is entered and rendered;
// `aggregation` describes how it combines. They are different questions.
export function aggregateItems(items: StrategicInsightGriItem[]): number {
  const numeric = items.filter(isNumericItem)
  if (numeric.length === 0) return 0
  const total = numeric.reduce((sum, item) => sum + numericValue(item), 0)
  // A mixed selection should not silently pick one rule; averaging is the safe default because
  // summing ratios produces a value outside the metric's own range (a "1.88 ratio"), whereas
  // averaging a set of sums merely under-reports a total that the KPI cards already carry exactly.
  const isRatio = numeric.some((i) => i.aggregation === 'AVERAGE')
  return isRatio ? total / numeric.length : total
}

// One chart series per member of a dimension, each carrying one point per period.
// Series and points come out in declared order (dimensions[].members[], then ascending period) so
// the chart is stable across refetches rather than following object key order.
export function seriesByDimension(
  category: StrategicInsightGriCategory,
  dimensionKey: string,
  items: StrategicInsightGriItem[] = category.items,
): { key: string; name: string; data: number[] }[] {
  const dimension = category.dimensions.find((d) => d.key === dimensionKey)
  if (!dimension) return []
  const periods = periodsOf(items)
  return dimension.members.map((member) => ({
    key: member.key,
    name: member.name,
    data: periods.map((period) =>
      aggregateItems(itemsAt(items, dimensionKey, member.key).filter((i) => i.period === period)),
    ),
  }))
}

// The PT-comparison bar chart: one bar per entity, entities in first-seen order.
// `code` is the short label the mockup prints under each bar ('WS', 'SDS', ...).
//
// Goes through aggregateItems per entity rather than summing directly, so an AVERAGE metric
// (training hours) shows each entity's average instead of its running total.
export function totalsByEntity(
  items: StrategicInsightGriItem[],
): { id: string; code: string; name: string; value: number }[] {
  const order: string[] = []
  const grouped = new Map<string, StrategicInsightGriItem[]>()
  for (const item of items) {
    if (!isNumericItem(item)) continue
    const existing = grouped.get(item.entity.id)
    if (existing) existing.push(item)
    else {
      grouped.set(item.entity.id, [item])
      order.push(item.entity.id)
    }
  }
  return order.map((id) => {
    const group = grouped.get(id)!
    return {
      id,
      code: group[0]!.entity.code,
      name: group[0]!.entity.name,
      value: aggregateItems(group),
    }
  })
}

// Tabs, in the order the backend declared. Sorted rather than trusted as-received so a payload
// that arrives out of order still renders General first.
export function orderedCategories(
  categories: StrategicInsightGriQuantitativeResponse,
): StrategicInsightGriCategory[] {
  return [...categories].sort((a, b) => a.sequence - b.sequence)
}

// KPI card lookup. Returns undefined rather than 0 for a missing key so the page can render an
// em-dash placeholder — a real 0 and "the backend never sent this key" are different states, and
// 26 of the 32 keys the mockup needs are still unimplemented backend-side (gap A3).
export function summaryValue(
  category: StrategicInsightGriCategory,
  key: string,
): StrategicInsightGriSummary | undefined {
  return category.summary.find((s) => s.key === key)
}

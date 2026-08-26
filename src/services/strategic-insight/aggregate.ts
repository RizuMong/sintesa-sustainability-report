// pure, dependency-free — kept separate from api.ts so api.check.ts can import it via a relative
// path without Node having to resolve the '@/' tsconfig alias.

// AC-75: when the active filter resolves to more than one underlying row (All Entities and/or
// All Periods selected), the FE aggregates rather than the backend — sum absolute metrics
// (e.g. total tons of waste), average ratio metrics (e.g. % renewable energy).
export function aggregateMetricRows(rows: StrategicInsightMetricRow[], isRatio: boolean): number {
  if (rows.length === 0) return 0
  const total = rows.reduce((sum, row) => sum + row.value, 0)
  return isRatio ? total / rows.length : total
}

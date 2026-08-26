// pure, dependency-free — kept separate from api.ts so api.check.ts can import
// it via a relative path without Node having to resolve the '@/' tsconfig alias.

// Nudge only makes sense for a row that is actually overdue and not yet in a terminal Approved state (AC-68).
export function canNudge(row: TrackingRow): boolean {
  return row.is_overdue && row.status !== 'Approved'
}

// clamp defensively — a backend aggregate glitch shouldn't render a >100%/<0% bar
export function clampCompletion(percent: number): number {
  return Math.min(100, Math.max(0, percent))
}

// pure, dependency-free — kept separate from api.ts so api.check.ts can import
// it via a relative path without Node having to resolve the '@/' tsconfig alias.

export function resolveDecisionStatus(decision: 'Take' | 'Skip'): ActionPlanItemStatus {
  return decision === 'Take' ? 'Taken' : 'Skipped'
}

// AC-93/94 — Skip requires a non-empty Justification; Take never requires one; no decision
// yet is not something to block on (row still 'Pending Response').
export function skipRequiresJustification(decision: TakeSkipDecision, skipReason: string): boolean {
  if (decision !== 'Skip') return true
  return skipReason.trim().length > 0
}

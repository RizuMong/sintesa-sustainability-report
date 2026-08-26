// pure, dependency-free — kept separate from api.ts so api.check.ts can import it via a relative
// path without Node having to resolve the '@/' tsconfig alias.

// AC-106 — Notes/Reason is required to submit a change request.
export function isChangeRequestNotesValid(notes: string): boolean {
  return notes.trim().length > 0
}

// A change request must actually change something — reject a proposed set identical to existing.
export function hasProposedChanges(
  existing: Partial<ActionPlanMatrixRow>,
  proposed: Partial<ActionPlanMatrixRow>,
): boolean {
  const keys = new Set([...Object.keys(existing), ...Object.keys(proposed)]) as Set<keyof ActionPlanMatrixRow>
  for (const key of keys) {
    if (JSON.stringify(existing[key]) !== JSON.stringify(proposed[key])) return true
  }
  return false
}

export function canSubmitChangeRequest(
  notes: string,
  existing: Partial<ActionPlanMatrixRow>,
  proposed: Partial<ActionPlanMatrixRow>,
): boolean {
  return isChangeRequestNotesValid(notes) && hasProposedChanges(existing, proposed)
}

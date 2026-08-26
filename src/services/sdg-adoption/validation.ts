// pure, dependency-free — kept separate from api.ts so api.check.ts can import
// it via a relative path without Node having to resolve the '@/' tsconfig alias.

// AC-45: Adopted -> Not Adopted is blocked while the goal has active Action Plan Matrix rows.
// Adopting a previously-not-adopted goal is always allowed, so this guard only applies one way.
export function canDeactivateSdgGoal(goal: SdgGoal): boolean {
  return !goal.has_active_action_plan
}

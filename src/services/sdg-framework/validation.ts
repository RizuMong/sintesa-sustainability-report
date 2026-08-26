// pure, dependency-free — kept separate from api.ts so api.check.ts can import
// it via a relative path without Node having to resolve the '@/' tsconfig alias.

// ponytail: hardcoded until Platform Administrator ships an Investment Impact entity-scope
// config screen — AC-47/48 only says "certain entities", no admin screen exists yet.
export const INVESTMENT_IMPACT_ENTITY_NAMES = ['SDS', 'SBG', 'MEPPO']

// AC-53: no_code must be unique within one SDG parent framework's Action Plan Matrix
export function isDuplicateMatrixRowCode(rows: ActionPlanMatrixRow[], noCode: string, excludeId?: string): boolean {
  const needle = noCode.trim().toLowerCase()
  return rows.some((row) => row.id !== excludeId && row.no_code.trim().toLowerCase() === needle)
}

// AC-54: a row that's already been Taken by a subsidiary can't be deleted
export function canDeleteMatrixRow(row: ActionPlanMatrixRow): boolean {
  return row.taken_by_count === 0
}

// AC-49/50/51: Applicable Entities is required (min 1) only when the framework is not applied to all entities
export function isApplicableEntitiesValid(isAppliedToAllEntity: boolean, applicableEntityIds: string[]): boolean {
  return isAppliedToAllEntity || applicableEntityIds.length >= 1
}

// AC-47/48: Investment Impact is only selectable when the entity scope includes a whitelisted entity
export function isInvestmentImpactAllowed(entityNames: string[]): boolean {
  return entityNames.some((name) => INVESTMENT_IMPACT_ENTITY_NAMES.includes(name))
}

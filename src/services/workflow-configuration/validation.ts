// Pure validation logic, kept import-free (no `@/lib/http`) so `api.check.ts` can run it directly
// under plain node without path-alias resolution.

// AC-31: an Entity may have at most one Active Workflow per Workflow Name — checked client-side before save.
// `excludeId` lets an update ignore its own current record when re-checking.
export function hasActiveWorkflowConflict(
  existing: WorkflowConfig[],
  candidate: { entity_id: string; workflow_name: WorkflowName },
  excludeId?: string,
): boolean {
  return existing.some(
    (w) =>
      w.id !== excludeId &&
      w.status === 'Active' &&
      w.entity_id === candidate.entity_id &&
      w.workflow_name === candidate.workflow_name,
  )
}

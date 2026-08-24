import { http, unwrap } from '@/lib/http'

export { hasActiveWorkflowConflict } from './validation'

export type WorkflowConfigPayload = {
  id?: string
  workflow_name: WorkflowName
  entity_id: string
  approval_lines: WorkflowApprovalLine[]
}

// ponytail: no `api/Workflow Configuration/` contract exists yet (confirmed via grep) — endpoints below follow
// the established `/v1/<module>/index|create|update|delete` convention as a placeholder, flagged unconfirmed.
const workflowConfigurationApi = {
  async getWorkflowConfiguration() {
    return unwrap<WorkflowConfig[]>(http.get('/v1/workflow-configuration/index'))
  },

  async createWorkflowConfiguration(payload: WorkflowConfigPayload) {
    return unwrap<WorkflowConfig>(http.post('/v1/workflow-configuration/create', payload))
  },

  async updateWorkflowConfiguration(payload: WorkflowConfigPayload & { id: string }) {
    return unwrap<WorkflowConfig>(http.post('/v1/workflow-configuration/update', payload))
  },

  // soft-delete only (AC per plan §2) — deactivate flips status to Inactive, never a hard delete
  async deactivateWorkflowConfiguration({ id }: { id: string }) {
    return unwrap<WorkflowConfig>(http.post('/v1/workflow-configuration/delete', { id }))
  },
}

export { workflowConfigurationApi }

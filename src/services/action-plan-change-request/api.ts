import { http, unwrap } from '@/lib/http'
import { canSubmitChangeRequest, hasProposedChanges, isChangeRequestNotesValid } from './validation'

export { canSubmitChangeRequest, hasProposedChanges, isChangeRequestNotesValid } from './validation'

// ponytail: no api/ contract exists for Action Plan Change Request yet — follows the sibling REST
// convention `{{base_url}}/v1/action-plan-change-request/index|detail|create` per CLAUDE.md §2.4.
// No update/approve endpoint here: that belongs to Stream E's Holding approval page.

export interface ActionPlanChangeRequestPayload {
  action_plan_id: string
  existing: Partial<ActionPlanMatrixRow>
  proposed: Partial<ActionPlanMatrixRow>
  notes: string
}

const actionPlanChangeRequestApi = {
  async getChangeRequests() {
    return unwrap<ActionPlanChangeRequest[]>(http.get('/v1/action-plan-change-request/index'))
  },
  async getChangeRequest(id: string) {
    return unwrap<ActionPlanChangeRequest>(http.get('/v1/action-plan-change-request/detail', { params: { id } }))
  },
  async createChangeRequest(payload: ActionPlanChangeRequestPayload) {
    if (!canSubmitChangeRequest(payload.notes, payload.existing, payload.proposed)) {
      throw new Error('Notes are required and the proposed values must differ from the existing plan.')
    }
    return unwrap<ActionPlanChangeRequest>(http.post('/v1/action-plan-change-request/create', payload))
  },
}

export { actionPlanChangeRequestApi }

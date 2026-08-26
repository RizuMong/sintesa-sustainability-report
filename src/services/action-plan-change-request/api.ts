import { http, unwrap } from '@/lib/http'
import { canSubmitChangeRequest } from './validation'

export { canSubmitChangeRequest, hasProposedChanges, isChangeRequestNotesValid } from './validation'

// ponytail: no api/ contract exists for Action Plan Change Request yet — index/detail/create follow
// the sibling REST convention `{{base_url}}/v1/action-plan-change-request/index|detail|create` per
// Stream I's brief (§5-I); approve/reject are the same guessed convention, added for Stream E's
// Holding approval page (`/action-plan-change-request/approval`), which owns that decision flow.

export interface ActionPlanChangeRequestPayload {
  action_plan_id: string
  existing: Partial<ActionPlanMatrixRow>
  proposed: Partial<ActionPlanMatrixRow>
  notes: string
}

const actionPlanChangeRequestApi = {
  async getIndex(params: { status?: string } = {}) {
    return unwrap<ActionPlanChangeRequest[]>(http.get('/v1/action-plan-change-request/index', { params }))
  },
  async getDetail(id: string) {
    return unwrap<ActionPlanChangeRequest>(http.get('/v1/action-plan-change-request/detail', { params: { id } }))
  },
  async create(payload: ActionPlanChangeRequestPayload) {
    if (!canSubmitChangeRequest(payload.notes, payload.existing, payload.proposed)) {
      throw new Error('Notes are required and the proposed values must differ from the existing plan.')
    }
    return unwrap<ActionPlanChangeRequest>(http.post('/v1/action-plan-change-request/create', payload))
  },
  async approve(id: string, reviewer_notes?: string) {
    return unwrap<Record<string, never>>(http.post('/v1/action-plan-change-request/approve', { id, reviewer_notes }))
  },
  async reject(id: string, reviewer_notes: string) {
    return unwrap<Record<string, never>>(http.post('/v1/action-plan-change-request/reject', { id, reviewer_notes }))
  },
}

export { actionPlanChangeRequestApi }

import { http, unwrap } from '@/lib/http'
import { resolveInitiatedPlanGovernance } from './validation'

export { resolveInitiatedPlanGovernance } from './validation'

// ponytail: no api/ contract exists for Initiate New Plan yet — follows the sibling REST convention
// `{{base_url}}/v1/initiate-new-plan/index|detail|create|update|submit` until backend confirms.

export interface InitiatedPlanPayload {
  sdg_id: string
  sdg_adopted: boolean
  origin_entity_id: string
  rows: ActionPlanMatrixRow[]
}

const initiateNewPlanApi = {
  async getInitiatedPlans() {
    return unwrap<InitiatedPlan[]>(http.get('/v1/initiate-new-plan/index'))
  },
  async getInitiatedPlan(id: string) {
    return unwrap<InitiatedPlan>(http.get('/v1/initiate-new-plan/detail', { params: { id } }))
  },
  async createInitiatedPlan(payload: InitiatedPlanPayload) {
    const governance = resolveInitiatedPlanGovernance(payload.sdg_adopted)
    return unwrap<InitiatedPlan>(
      http.post('/v1/initiate-new-plan/create', {
        ...payload,
        created_by_level: 'Subsidiary',
        status: governance.status,
        unverified: governance.unverified,
      }),
    )
  },
  // update is exposed for the Holding approval flow (Stream E) that flips `status` on a
  // `Pending Review` plan — never touches `unverified`, which stays permanent per AC-104.
  async updateInitiatedPlan(payload: InitiatedPlan) {
    return unwrap<InitiatedPlan>(http.post('/v1/initiate-new-plan/update', payload))
  },
}

export { initiateNewPlanApi }

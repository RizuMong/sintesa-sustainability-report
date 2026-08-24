import { http, unwrap } from '@/lib/http'

export { buildRetriggeredLogRow } from './rules'

// ponytail: no `api/` contract exists for this module — read-only index + retrigger endpoints follow
// the sibling `/v1/<module>/index` convention and an unconfirmed `/retrigger` action, flagged for backend confirmation.
const generateActionPlanLogApi = {
  async index() {
    return unwrap<GenerateActionPlanLog[]>(http.get('/v1/generate-action-plan-log/index'))
  },
  async retrigger(id: string) {
    return unwrap<GenerateActionPlanLog>(http.post('/v1/generate-action-plan-log/retrigger', { id }))
  },
}

export { generateActionPlanLogApi }

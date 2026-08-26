import { http, unwrap } from '@/lib/http'

// ponytail: unconfirmed contract (Stream I's own plan lists only index/detail/create — approve/reject
// follow the sibling convention since the Holding approval screen needs them). Whole file is a
// temporary stub of Stream I's module, reconcile at merge.

const actionPlanChangeRequestApi = {
  async getIndex(params: { status?: string } = {}) {
    return unwrap<ActionPlanChangeRequest[]>(http.get('/v1/action-plan-change-request/index', { params }))
  },
  async approve(id: string, reviewer_notes?: string) {
    return unwrap<Record<string, never>>(http.post('/v1/action-plan-change-request/approve', { id, reviewer_notes }))
  },
  async reject(id: string, reviewer_notes: string) {
    return unwrap<Record<string, never>>(http.post('/v1/action-plan-change-request/reject', { id, reviewer_notes }))
  },
}

export { actionPlanChangeRequestApi }

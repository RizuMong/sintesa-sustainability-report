import { http, unwrap } from '@/lib/http'

// ponytail: unconfirmed contract (Stream F's own plan lists only index/detail/create/update/submit —
// approval/approve/reject follow the sibling convention until F confirms). Whole file is a temporary
// stub of Stream F's module, reconcile at merge.

const reportPlanRealizationApi = {
  async getApprovalList(params: { entity_id?: string; period?: string } = {}) {
    return unwrap<RealizationReport[]>(http.get('/v1/report-plan-realization/approval/index', { params }))
  },
  async approve(id: string, remarks?: string) {
    return unwrap<Record<string, never>>(http.post('/v1/report-plan-realization/approve', { id, remarks }))
  },
  async reject(id: string, remarks: string) {
    return unwrap<Record<string, never>>(http.post('/v1/report-plan-realization/reject', { id, remarks }))
  },
}

export { reportPlanRealizationApi }

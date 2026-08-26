import { http, unwrap } from '@/lib/http'

// ponytail: unconfirmed contract — no api/Report Plan Realization/ folder exists yet. Follows
// the sibling {{base_url}}/v1/<module>/index|detail|update|submit convention (CLAUDE.md §2.4).

export { canSubmitRealization, isEditableRealization, isRealizationWindowOpen } from './validation'

const reportPlanRealizationApi = {
  async getReportPlanRealization() {
    return unwrap<RealizationReport[]>(http.get('/v1/report-plan-realization/index'))
  },
  async getReportPlanRealizationDetail(id: string) {
    return unwrap<RealizationReport>(http.get('/v1/report-plan-realization/detail', { params: { id } }))
  },
  async updateReportPlanRealization(payload: { id: string; value: string; evidence_url: string | null }) {
    return unwrap<RealizationReport>(http.post('/v1/report-plan-realization/update', payload))
  },
  async submitReportPlanRealization(payload: { id: string }) {
    return unwrap<RealizationReport>(http.post('/v1/report-plan-realization/submit', payload))
  },
  // ponytail: unconfirmed contract — approval trio added for the Review & Approval Tab 3
  // (Stream E, FSD 2.4). Mirrors evaluate-gri-quantitative's confirmed approval shape.
  async getApprovalList() {
    return unwrap<RealizationReport[]>(http.get('/v1/report-plan-realization/approval/index'))
  },
  async approveReportPlanRealization(payload: { id: string; remarks?: string }) {
    return unwrap<RealizationReport>(http.post('/v1/report-plan-realization/approve', payload))
  },
  async rejectReportPlanRealization(payload: { id: string; remarks: string }) {
    return unwrap<RealizationReport>(http.post('/v1/report-plan-realization/reject', payload))
  },
}

export { reportPlanRealizationApi }

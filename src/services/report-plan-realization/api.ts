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
}

export { reportPlanRealizationApi }

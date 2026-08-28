import { http, unwrap } from '@/lib/http'

// All endpoints confirmed in api/Evaluate GRI - Quantitative/*.yml.
export {
  approvalSummary,
  cellKey,
  fromSubmissionValues,
  groupItemsByCategory,
  hasDuplicateSubmission,
  isReadOnly,
  latestRejectionNote,
  requestorSummary,
  rowKey,
  toSubmissionValue,
} from './validation'

const evaluateGriQuantitativeApi = {
  async getRequestorList(params: { entity_id?: string; period?: string; template_id?: string } = {}) {
    return unwrap<EvaluateGriQuantitativeSummary[]>(http.get('/v1/evaluate-gri-quantitative/index', { params }))
  },
  async getApprovalList(params: { entity_id?: string; period?: string; template_id?: string } = {}) {
    return unwrap<EvaluateGriQuantitativeSummary[]>(
      http.get('/v1/evaluate-gri-quantitative/approval/index', { params }),
    )
  },
  async getDetail(id: string) {
    return unwrap<EvaluateGriQuantitative>(http.get('/v1/evaluate-gri-quantitative/detail', { params: { id } }))
  },
  async create(payload: EvaluateGriQuantitativeCreatePayload) {
    return unwrap<EvaluateGriQuantitative>(http.post('/v1/evaluate-gri-quantitative/create', payload))
  },
  async update(payload: EvaluateGriQuantitativeUpdatePayload) {
    return unwrap<EvaluateGriQuantitative>(http.post('/v1/evaluate-gri-quantitative/update', payload))
  },
  async submit(id: string) {
    return unwrap<Partial<EvaluateGriQuantitative>>(http.post('/v1/evaluate-gri-quantitative/submit', { id }))
  },
  async cancel(id: string) {
    return unwrap<Partial<EvaluateGriQuantitative>>(http.post('/v1/evaluate-gri-quantitative/cancel', { id }))
  },
  async approve(id: string, remarks?: string) {
    return unwrap<Record<string, never>>(http.post('/v1/evaluate-gri-quantitative/approve', { id, remarks }))
  },
  async reject(id: string, remarks: string) {
    return unwrap<Record<string, never>>(http.post('/v1/evaluate-gri-quantitative/reject', { id, remarks }))
  },
  async remove(id: string) {
    return unwrap<Record<string, never>>(http.delete('/v1/evaluate-gri-quantitative/delete', { params: { id } }))
  },
}

export { evaluateGriQuantitativeApi }

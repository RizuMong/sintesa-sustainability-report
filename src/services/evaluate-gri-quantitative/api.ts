import { http, unwrap } from '@/lib/http'

// All endpoints confirmed in api/Evaluate GRI - Quantitative/*.yml.
export {
  approvalSummary,
  cellKey,
  fromSubmissionValues,
  groupItemsByCategory,
  hasDuplicateSubmission,
  isApprovedByMe,
  isDetailReadOnly,
  isReadOnly,
  latestApproverNote,
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
  async approve(id: string, remarks?: string, silentToast = false) {
    return unwrap<Record<string, never>>(
      http.post('/v1/evaluate-gri-quantitative/approve', { id, remarks }, { meta: { silentToast } }),
    )
  },
  async reject(id: string, remarks: string, silentToast = false) {
    return unwrap<Record<string, never>>(
      http.post('/v1/evaluate-gri-quantitative/reject', { id, remarks }, { meta: { silentToast } }),
    )
  },
  // GROU-657 — third approver decision: hand the submission back for revision. Per
  // api/…/Request Revision.yml both fields are mandatory, and the 200 answers data: {}.
  // Index Requestor.yml's 'Data Request Revision' example shows the result: flow_status returns
  // to 'draft' with action/status REQUEST_REVISION recorded on the approval log.
  async requestRevision(id: string, remarks: string, silentToast = false) {
    return unwrap<Record<string, never>>(
      http.post('/v1/evaluate-gri-quantitative/request-revision', { id, remarks }, { meta: { silentToast } }),
    )
  },
  async remove(id: string) {
    return unwrap<Record<string, never>>(http.delete('/v1/evaluate-gri-quantitative/delete', { params: { id } }))
  },
}

export { evaluateGriQuantitativeApi }

import { http, unwrap } from '@/lib/http'

export { canSubmitGriQualSubmission, isGriQualSubmissionLocked, textareaLabelFor } from './validation'

// ponytail: unconfirmed contract — no `api/Evaluate GRI - Qualitative/` collection exists yet.
// Mirrors the confirmed sibling contract in `api/Evaluate GRI - Quantitative/*.yml` field-for-field
// (same index/approval-index/detail/create/update/submit/approve/reject/cancel shape, same
// {code,data,error,message} envelope). Flag every method below until a real contract lands.
const evaluateGriQualitativeApi = {
  // ponytail: unconfirmed contract, mirrors evaluate-gri-quantitative
  async index(params?: { entity_id?: string; period?: string; template_id?: string }) {
    return unwrap<GriQualSubmission[]>(http.get('/v1/evaluate-gri-qualitative/index', { params }))
  },
  // ponytail: unconfirmed contract, mirrors evaluate-gri-quantitative
  async approvalIndex(params?: { entity_id?: string; period?: string; template_id?: string }) {
    return unwrap<GriQualSubmission[]>(http.get('/v1/evaluate-gri-qualitative/approval/index', { params }))
  },
  // ponytail: unconfirmed contract, mirrors evaluate-gri-quantitative
  async detail(id: string) {
    return unwrap<GriQualSubmission>(http.get('/v1/evaluate-gri-qualitative/detail', { params: { id } }))
  },
  // ponytail: unconfirmed contract, mirrors evaluate-gri-quantitative
  async create(payload: { entity_id: string; period_id: string; template_id: string }) {
    return unwrap<GriQualSubmission>(http.post('/v1/evaluate-gri-qualitative/create', payload))
  },
  // ponytail: unconfirmed contract, mirrors evaluate-gri-quantitative
  async update(payload: { id: string; disclosures: GriQualSubmissionDisclosure[] }) {
    return unwrap<GriQualSubmission>(http.post('/v1/evaluate-gri-qualitative/update', payload))
  },
  // ponytail: unconfirmed contract, mirrors evaluate-gri-quantitative
  async submit(id: string) {
    return unwrap<GriQualSubmission>(http.post('/v1/evaluate-gri-qualitative/submit', { id }))
  },
  // ponytail: unconfirmed contract, mirrors evaluate-gri-quantitative — consumed by Stream E's approval tab
  async approve(id: string) {
    return unwrap<GriQualSubmission>(http.post('/v1/evaluate-gri-qualitative/approve', { id }))
  },
  // ponytail: unconfirmed contract, mirrors evaluate-gri-quantitative — consumed by Stream E's approval tab
  async reject(payload: { id: string; notes: string }) {
    return unwrap<GriQualSubmission>(http.post('/v1/evaluate-gri-qualitative/reject', payload))
  },
  // ponytail: unconfirmed contract, mirrors evaluate-gri-quantitative
  async cancel(id: string) {
    return unwrap<GriQualSubmission>(http.post('/v1/evaluate-gri-qualitative/cancel', { id }))
  },
}

export { evaluateGriQualitativeApi }

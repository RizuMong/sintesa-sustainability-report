import { http, unwrap } from '@/lib/http'

// ponytail: unconfirmed contract, mirrors evaluate-gri-quantitative (Stream D's own plan note) —
// and this whole file is a temporary stub of Stream D's module, reconcile at merge.

const evaluateGriQualitativeApi = {
  async getApprovalList(params: { entity_id?: string; period?: string; template_id?: string } = {}) {
    return unwrap<GriQualSubmission[]>(http.get('/v1/evaluate-gri-qualitative/approval/index', { params }))
  },
  async approve(id: string, remarks?: string) {
    return unwrap<Record<string, never>>(http.post('/v1/evaluate-gri-qualitative/approve', { id, remarks }))
  },
  async reject(id: string, remarks: string) {
    return unwrap<Record<string, never>>(http.post('/v1/evaluate-gri-qualitative/reject', { id, remarks }))
  },
}

export { evaluateGriQualitativeApi }

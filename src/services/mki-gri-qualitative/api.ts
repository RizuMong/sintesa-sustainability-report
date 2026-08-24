import { http, unwrap } from '@/lib/http'
import { isLocked } from './rules'

export { isSnakeCaseCode, isLocked } from './rules'

// ponytail: no dedicated api/ contract file exists for MKI GRI-Qualitative yet — mirrors the
// confirmed sibling contract in `api/Master Key Indicator/GRI - Quantitative/*.yml` (same
// /v1/mki/<type>/index|create|update|delete shape, envelope {code,data,error,message}). Flag as
// unconfirmed until a real `api/Master Key Indicator/GRI - Qualitative/*.yml` contract exists.
const mkiGriQualitativeApi = {
  async index(params?: { name?: string }) {
    const list = await unwrap<Omit<MkiGriQualitative, 'locked'>[]>(http.get('/v1/mki/gri-qualitative/index', { params }))
    return list.map((item) => ({ ...item, locked: isLocked(item) }))
  },
  async create(payload: MkiGriQualitativePayload) {
    return unwrap<MkiGriQualitative>(http.post('/v1/mki/gri-qualitative/create', payload))
  },
  async update(payload: MkiGriQualitativePayload & { id: string }) {
    return unwrap<MkiGriQualitative>(http.post('/v1/mki/gri-qualitative/update', payload))
  },
  // soft-delete only (business rule: "hanya dapat dinonaktifkan") — the sibling MKI Delete
  // endpoint is understood to deactivate server-side, not hard-delete.
  async remove(params: { id: string }) {
    return unwrap<Record<string, never>>(http.delete('/v1/mki/gri-qualitative/delete', { params }))
  },
}

export { mkiGriQualitativeApi }

import { http, unwrap } from '@/lib/http'
import { isLocked } from './rules'

export { isSnakeCaseCode, isLocked } from './rules'

// ponytail: no dedicated api/ contract file exists for MKI SDG yet — mirrors the confirmed sibling
// contract in `api/Master Key Indicator/GRI - Quantitative/*.yml` (same /v1/mki/<type>/index|create|
// update|delete shape, envelope {code,data,error,message}). Flag as unconfirmed until a real
// `api/Master Key Indicator/SDG/*.yml` contract exists.
const mkiSdgApi = {
  async index(params?: { indicator_name?: string }) {
    const list = await unwrap<Omit<MkiSdg, 'locked'>[]>(http.get('/v1/mki/sdg/index', { params }))
    return list.map((item) => ({ ...item, locked: isLocked(item) }))
  },
  async create(payload: MkiSdgPayload) {
    return unwrap<MkiSdg>(http.post('/v1/mki/sdg/create', payload))
  },
  async update(payload: MkiSdgPayload & { id: string }) {
    return unwrap<MkiSdg>(http.post('/v1/mki/sdg/update', payload))
  },
  // soft-delete only (business rule: "hanya dapat dinonaktifkan") — the sibling MKI Delete
  // endpoint is understood to deactivate server-side, not hard-delete.
  async remove(params: { id: string }) {
    return unwrap<Record<string, never>>(http.delete('/v1/mki/sdg/delete', { params }))
  },
}

export { mkiSdgApi }

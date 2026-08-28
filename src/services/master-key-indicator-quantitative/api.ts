import { http, unwrap } from '@/lib/http'

// All endpoints confirmed in api/Master Key Indicator/GRI - Quantitative/*.yml.
const masterKeyIndicatorQuantitativeApi = {
  async getList(params: { name?: string; category_id?: string } = {}) {
    return unwrap<MkiGriQuantitative[]>(http.get('/v1/mki/gri-quantitative/index', { params }))
  },
  async create(payload: MkiGriQuantitativePayload) {
    return unwrap<MkiGriQuantitative>(http.post('/v1/mki/gri-quantitative/create', payload))
  },
  async update(payload: MkiGriQuantitativePayload & { id: string }) {
    return unwrap<MkiGriQuantitative>(http.post('/v1/mki/gri-quantitative/update', payload))
  },
  async remove(id: string) {
    return unwrap<Record<string, never>>(http.delete('/v1/mki/gri-quantitative/delete', { params: { id } }))
  },
}

export { masterKeyIndicatorQuantitativeApi }

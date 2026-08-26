import { http, unwrap } from '@/lib/http'

export { aggregateMetricRows } from './aggregate'

// All three endpoints confirmed in api/Dashboard/*.yml (method + URL only, see types.d.ts ponytail
// note re: response shape).
const strategicInsightApi = {
  async getSdgInsight(params: StrategicInsightFilterParams = {}) {
    return unwrap<StrategicInsightSdgResponse>(http.get('/v1/strategic-insight/sdg', { params }))
  },
  async getGriQuantitativeInsight(params: StrategicInsightFilterParams = {}) {
    return unwrap<StrategicInsightGriQuantitativeResponse>(
      http.get('/v1/strategic-insight/gri-quantitative', { params }),
    )
  },
  async getGriQualitativeInsight(params: StrategicInsightFilterParams = {}) {
    return unwrap<StrategicInsightGriQualitativeResponse>(
      http.get('/v1/strategic-insight/gri-qualitative', { params }),
    )
  },
}

export { strategicInsightApi }

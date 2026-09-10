import { http, unwrap } from '@/lib/http'
import { normalizeSdg } from './normalize-sdg'

export {
  aggregateItems,
  isNumericItem,
  itemsAt,
  orderedCategories,
  periodsOf,
  seriesByDimension,
  summaryValue,
  totalsByEntity,
} from './aggregate'

export { categoryCaption, chartCardsFor } from './chart-spec'
export type { ChartCard, ChartCardKind, ChartCardSeries, ChartCardWidth } from './chart-spec'
export { nextTabIndex } from './tab-index'

// gri-quantitative matches the `Response Dummy` example in api/Dashboard/GRI - Quantitative.yml.
// sdg: wire shape verified live 2026-09-10 (.temp/api-verify/sdg-probe/sdg.json), converted at the
// boundary by normalizeSdg() — see normalize-sdg.ts and docs/dashboard-sdg-api-gaps.md.
// ponytail: gri-qualitative has no entry in api/Dashboard/ at all — the URL below follows the
// sibling naming convention and is unverified. Confirm before relying on it.
const strategicInsightApi = {
  async getSdgInsight(params: StrategicInsightFilterParams = {}) {
    const wire = await unwrap<StrategicInsightSdgWireResponse>(
      http.get('/v1/strategic-insight/sdg', { params }),
    )
    return normalizeSdg(wire)
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

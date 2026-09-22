import { http, unwrap } from '@/lib/http'
import { logger } from '@/lib/logger'
import { applyDemoFilters, demoGriQuantitative } from './demo-data'
import { normalizeGriQuantitative } from './normalize'
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
export { demoEntities, demoPeriods } from './demo-data'
export { SDG_CATALOG, padMatrixToAllSdgs } from './normalize-sdg'
export type { ChartCard, ChartCardKind, ChartCardSeries, ChartCardWidth } from './chart-spec'
export { nextTabIndex } from './tab-index'

// gri-quantitative matches the wire shape GET /v1/strategic-insight/gri-quantitative actually
// sends (StrategicInsightGriWireCategory[], verified live 2026-09-10 — see normalize.ts's header
// for why this is treated as current rather than "pre-migration"), converted at the boundary by
// normalizeGriQuantitative(). Every other consumer of this module keeps seeing the canonical
// StrategicInsightGriQuantitativeResponse shape.
// sdg: wire shape verified live 2026-09-10 (.temp/api-verify/sdg-probe/sdg.json), converted at the
// boundary by normalizeSdg() — see normalize-sdg.ts and docs/dashboard-sdg-api-gaps.md.
// ponytail: gri-qualitative has no entry in api/Dashboard/ at all — the URL below follows the
// sibling naming convention and is unverified. Confirm before relying on it.
// ponytail: the mock-up switch. `true` makes the GRI Quantitative page fall back to
// demo-data.ts whenever the backend cannot fill it. Flip to `false` — and delete demo-data.ts,
// its fixture and this block — once the backend serves all 8 categories across several entities
// and periods, i.e. once gaps G2/G3 in docs/dashboard-gri-quantitative-api-gaps.md close.
export const USE_DEMO_GRI_DATA = true

// The page needs several entities and periods to draw a trend or a PT comparison at all. Anything
// less renders one-point lines and drops the comparison chart entirely (chart-spec's
// `entities.length > 1` guard), which is exactly what the live backend returns today.
function demoFallbackReason(categories: StrategicInsightGriQuantitativeResponse): string | null {
  if (categories.length < 8) return `only ${categories.length} of 8 categories`
  const periods = new Set(categories.flatMap((c) => c.items.map((i) => i.period)))
  if (periods.size < 2) return `only ${periods.size} period(s) — no trend to plot`
  const entities = new Set(categories.flatMap((c) => c.items.map((i) => i.entity.id)))
  if (entities.size < 2) return `only ${entities.size} entity(ies) — no comparison to plot`
  return null
}

// Returns null instead of throwing: a failed request is a demo-fallback trigger, not an error to
// surface, and the page should still render something useful with an expired token.
async function fetchGriQuantitative(
  params: StrategicInsightFilterParams,
): Promise<StrategicInsightGriQuantitativeResponse | null> {
  try {
    const wire = await unwrap<StrategicInsightGriQuantitativeWireResponse>(
      http.get('/v1/strategic-insight/gri-quantitative', { params }),
    )
    return normalizeGriQuantitative(wire).categories
  } catch (error) {
    if (!USE_DEMO_GRI_DATA) throw error
    logger.warn('[strategic-insight] GRI Quantitative request failed; falling back to demo data', error)
    return null
  }
}

const strategicInsightApi = {
  async getSdgInsight(params: StrategicInsightFilterParams = {}) {
    const wire = await unwrap<StrategicInsightSdgWireResponse>(
      http.get('/v1/strategic-insight/sdg', { params }),
    )
    return normalizeSdg(wire, params)
  },
  async getGriQuantitativeInsight(params: StrategicInsightFilterParams = {}) {
    const live = await fetchGriQuantitative(params)
    if (!USE_DEMO_GRI_DATA) return live ?? []

    // Fall back to the fixture when the request failed OR when the answer is too thin to fill the
    // page. Both are demo-fatal in the same way: an audience sees empty tabs either way.
    const reason = live === null ? 'request failed' : demoFallbackReason(live)
    if (reason === null) return live!

    logger.warn(
      `[strategic-insight] GRI Quantitative is rendering DEMO FIXTURE DATA (${reason}). ` +
        'These numbers are not real — see src/services/strategic-insight/demo-data.ts.',
    )
    return applyDemoFilters(demoGriQuantitative(), params)
  },
  async getGriQualitativeInsight(params: StrategicInsightFilterParams = {}) {
    return unwrap<StrategicInsightGriQualitativeResponse>(
      http.get('/v1/strategic-insight/gri-qualitative', { params }),
    )
  },
}

export { strategicInsightApi }

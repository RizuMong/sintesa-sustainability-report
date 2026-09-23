import { useQuery } from '@tanstack/vue-query'
import { computed, reactive, toValue, type MaybeRefOrGetter } from 'vue'
import { useGetMasterEntity } from '@/services/master-entity'
import { useGetMasterPeriod } from '@/services/master-period'
import { strategicInsightApi, USE_DEMO_GRI_DATA } from './api'
import { demoEntities, demoPeriods } from './demo-data'

export function useSdgInsight(filters: MaybeRefOrGetter<StrategicInsightFilterParams>) {
  return useQuery({
    queryKey: computed(() => ['strategicInsightApi.getSdgInsight', toValue(filters)]),
    queryFn: () => strategicInsightApi.getSdgInsight(toValue(filters)),
  })
}

export function useGriQuantitativeInsight(filters: MaybeRefOrGetter<StrategicInsightFilterParams>) {
  return useQuery({
    queryKey: computed(() => ['strategicInsightApi.getGriQuantitativeInsight', toValue(filters)]),
    queryFn: () => strategicInsightApi.getGriQuantitativeInsight(toValue(filters)),
  })
}

export function useGriQualitativeInsight(filters: MaybeRefOrGetter<StrategicInsightFilterParams>) {
  return useQuery({
    queryKey: computed(() => ['strategicInsightApi.getGriQualitativeInsight', toValue(filters)]),
    queryFn: () => strategicInsightApi.getGriQualitativeInsight(toValue(filters)),
  })
}

// ponytail: no impact-vocabulary endpoint exists anywhere in api/ (checked Master SDG/ too), and
// api/Dashboard/SDG.yml (e1a3b38) declares the param's enum as these two literal wire strings —
// not uppercase tokens. Hardcoded until a master-impact endpoint shows up.
export const IMPACT_OPTIONS = ['Investment Impact', 'Operation Impact']

// Shared "Reporting Period + Entity" global filter bar (AC-71, AC-73, AC-74) — all three dashboard
// pages use the same two selects and the same active-filter label, so it lives here once instead of
// three times. `impact` is SDG-only: the GRI pages never render that select, so `state.impact` stays
// '' for them and `params.impact` stays undefined — no param leaks onto GRI requests.
export function useStrategicInsightFilterState() {
  const state = reactive<{ period: string; entityId: string; impact: string }>({
    period: '',
    entityId: '',
    impact: '',
  })

  // ponytail: the two selects fall back to the demo vocabulary for the same reason the dashboard
  // itself does — GET /v1/master-period returns a single active year, and /v1/master-entity returns
  // 7 rows with duplicate codes (gap C2). A dropdown with one option cannot demonstrate a filter.
  // Remove this fallback together with demo-data.ts.
  const { data: periodData } = useGetMasterPeriod()
  const livePeriods = computed(() => (periodData.value ?? []).filter((p) => p.status === 'Active'))
  const periods = computed(() =>
    USE_DEMO_GRI_DATA && livePeriods.value.length < 2
      ? demoPeriods.map((year) => ({ id: `demo-period-${year}`, year, status: 'Active' }) as MasterPeriod)
      : livePeriods.value,
  )

  const { data: entityData } = useGetMasterEntity()
  const liveEntities = computed(() => (entityData.value ?? []).filter((e) => e.status === 'Active'))
  const entities = computed(() =>
    USE_DEMO_GRI_DATA && liveEntities.value.length < 2
      ? demoEntities.map((e) => ({ ...e, status: 'Active' }) as unknown as MasterEntity)
      : liveEntities.value,
  )

  const params = computed<StrategicInsightFilterParams>(() => ({
    period: state.period || undefined,
    entity_id: state.entityId || undefined,
    impact: state.impact || undefined,
  }))

  // e.g. "WS · 2025 · Investment Impact" or "All Entities · All Periods · All Impacts" (AC-76 dynamic subtitle)
  const activeFilterLabel = computed(() => {
    const entityLabel = state.entityId ? (entities.value.find((e) => e.id === state.entityId)?.name ?? '') : 'All Entities'
    const periodLabel = state.period
      ? (periods.value.find((p) => String(p.year) === state.period)?.year ?? state.period)
      : 'All Periods'
    const impactLabel = state.impact || 'All Impacts'
    return `${entityLabel} · ${periodLabel} · ${impactLabel}`
  })

  return { state, periods, entities, params, activeFilterLabel }
}

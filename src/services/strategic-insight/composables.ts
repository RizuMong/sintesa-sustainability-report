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

// Shared "Reporting Period + Entity" global filter bar (AC-71, AC-73, AC-74) — all three dashboard
// pages use the same two selects and the same active-filter label, so it lives here once instead of
// three times.
export function useStrategicInsightFilterState() {
  const state = reactive<{ period: string; entityId: string }>({ period: '', entityId: '' })

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
  }))

  // e.g. "WS · 2025" or "All Entities · All Periods" (AC-76 dynamic subtitle)
  const activeFilterLabel = computed(() => {
    const entityLabel = state.entityId ? (entities.value.find((e) => e.id === state.entityId)?.name ?? '') : 'All Entities'
    const periodLabel = state.period
      ? (periods.value.find((p) => String(p.year) === state.period)?.year ?? state.period)
      : 'All Periods'
    return `${entityLabel} · ${periodLabel}`
  })

  return { state, periods, entities, params, activeFilterLabel }
}

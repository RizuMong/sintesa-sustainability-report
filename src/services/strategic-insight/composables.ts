import { useQuery } from '@tanstack/vue-query'
import { computed, reactive, toValue, type MaybeRefOrGetter } from 'vue'
import { useGetMasterEntity } from '@/services/master-entity'
import { useGetMasterPeriod } from '@/services/master-period'
import { strategicInsightApi } from './api'

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

  const { data: periodData } = useGetMasterPeriod()
  const periods = computed(() => (periodData.value ?? []).filter((p) => p.status === 'Active'))

  const { data: entityData } = useGetMasterEntity()
  const entities = computed(() => (entityData.value ?? []).filter((e) => e.status === 'Active'))

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

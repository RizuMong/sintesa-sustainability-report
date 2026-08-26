<template>
  <MpFlex direction="column" backgroundColor="background.stage" minHeight="100vh">
    <MpFlex paddingX="24px" paddingY="24px" backgroundColor="background.surface" justifyContent="space-between" alignItems="flex-start" wrap="wrap" gap="4">
      <MpFlex direction="column">
        <MpText size="label-small" color="text.secondary">Dashboard</MpText>
        <MpText as="h1" size="h1">GRI — Quantitative</MpText>
      </MpFlex>

      <MpFlex gap="3">
        <MpFormControl id="gri-quant-filter-period">
          <MpFormLabel>Reporting Period</MpFormLabel>
          <MpSelect v-model="filterState.state.period" placeholder="All Periods" is-full-width>
            <option value="">All Periods</option>
            <option v-for="p in filterState.periods.value" :key="p.id" :value="String(p.year)">{{ p.year }}</option>
          </MpSelect>
        </MpFormControl>
        <MpFormControl id="gri-quant-filter-entity">
          <MpFormLabel>Entity</MpFormLabel>
          <MpSelect v-model="filterState.state.entityId" placeholder="All Entities" is-full-width>
            <option value="">All Entities</option>
            <option v-for="e in filterState.entities.value" :key="e.id" :value="e.id">{{ e.name }}</option>
          </MpSelect>
        </MpFormControl>
      </MpFlex>
    </MpFlex>

    <MpFlex direction="column" paddingX="24px" paddingTop="16px">
      <!-- MpTabs' props aren't verified here (no pixel-hub MCP in this environment) — a manual
           MpButtonGroup toggle reuses components already proven elsewhere in this codebase
           (e.g. src/pages/evaluate-gri-quantitative/RequestorPage.vue) instead of guessing them. -->
      <MpButtonGroup>
        <MpButton
          v-for="tab in tabs"
          :key="tab.key"
          :variant="activeTab === tab.key ? 'primary' : 'secondary'"
          size="sm"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </MpButton>
      </MpButtonGroup>
    </MpFlex>

    <MpFlex v-if="isLoading" direction="column" padding="24px" gap="2">
      <MpSkeleton v-for="i in 3" :key="i" height="56px" rounded="md" />
    </MpFlex>

    <MpFlex v-else direction="column" padding="24px" gap="6">
      <MpText size="label" color="text.secondary">Menampilkan: {{ filterState.activeFilterLabel.value }}</MpText>

      <template v-if="activeTabMetrics.length">
        <MpFlex gap="4" wrap="wrap">
          <SummaryBox v-for="metric in activeTabMetrics" :key="metric.gri_code" :label="`${metric.title} (${metric.gri_code})`" :amount="formatMetricValue(metric)" />
        </MpFlex>

        <MpFlex v-if="activeTab === 'general' && generalComparisonMetric" direction="column" gap="3">
          <MpText as="h2" size="h3" weight="semiBold">Perbandingan antar PT — {{ generalComparisonMetric.title }}</MpText>
          <MpChart
            id="gri-quant-pt-comparison"
            :title="generalComparisonMetric.title"
            type="bar"
            width-container="660px"
            width-chart="660px"
            :data="ptComparisonData"
          />
        </MpFlex>
      </template>

      <MpFlex v-else direction="column" alignItems="center" gap="2" paddingY="10">
        <MpImage
          src="https://cdn.mekari.design/illustration/blank-slate/NoData_PB_L_01.png"
          alt="empty state illustration"
          layout="fixed"
          :width="160"
          :height="128"
          object-fit="contain"
          :is-show-loading="false"
        />
        <MpText size="label" color="text.secondary">No available yet</MpText>
      </MpFlex>
    </MpFlex>
  </MpFlex>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  MpFlex,
  MpText,
  MpChart,
  MpSelect,
  MpFormControl,
  MpFormLabel,
  MpSkeleton,
  MpImage,
  MpButton,
  MpButtonGroup,
} from '@mekari/pixel3'
import SummaryBox from '@/components/SummaryBox.vue'
import { aggregateMetricRows, useGriQuantitativeInsight, useStrategicInsightFilterState } from '@/services/strategic-insight'

type TabKey = 'general' | 'energy' | 'waste' | 'water' | 'diversity' | 'employment' | 'ohs' | 'training'

// FSD 2.7 AC-76 — 8 thematic tabs, each scoped to its own fixed set of GRI disclosure codes.
const tabs: { key: TabKey; label: string; codes: string[] }[] = [
  { key: 'general', label: 'General', codes: ['2-7', '2-8'] },
  { key: 'energy', label: 'Energy', codes: ['302-1'] },
  { key: 'waste', label: 'Waste', codes: ['306-4', '306-5'] },
  { key: 'water', label: 'Water', codes: ['303-3', '303-4'] },
  { key: 'diversity', label: 'Diversity', codes: ['405-1', '405-2'] },
  { key: 'employment', label: 'Employment', codes: ['401-1', '401-3'] },
  { key: 'ohs', label: 'OHS', codes: ['403-9'] },
  { key: 'training', label: 'Training', codes: ['404-1'] },
]

const activeTab = ref<TabKey>('general')

const filterState = useStrategicInsightFilterState()
const { data, isLoading } = useGriQuantitativeInsight(filterState.params)

const metrics = computed(() => data.value?.metrics ?? [])

const activeTabMetrics = computed(() => {
  const codes = tabs.find((t) => t.key === activeTab.value)?.codes ?? []
  return metrics.value.filter((m) => codes.includes(m.gri_code))
})

function formatMetricValue(metric: StrategicInsightGriMetric): string {
  const value = aggregateMetricRows(metric.rows, metric.is_ratio)
  const rounded = Math.round(value * 100) / 100
  return metric.unit ? `${rounded} ${metric.unit}` : String(rounded)
}

// AC-77 — General tab's PT-comparison bar chart, one bar per entity in the current filter scope.
const generalComparisonMetric = computed(() => activeTabMetrics.value[0])
const ptComparisonData = computed(() => {
  const rows = generalComparisonMetric.value?.rows ?? []
  return {
    labels: rows.map((r) => r.entity.name),
    datasets: [{ label: generalComparisonMetric.value?.title ?? '', data: rows.map((r) => r.value) }],
  }
})
</script>

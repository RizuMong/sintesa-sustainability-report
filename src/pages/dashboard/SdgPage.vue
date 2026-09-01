<template>
  <MpFlex direction="column" backgroundColor="background.stage" minHeight="100vh">
    <MpFlex paddingX="24px" paddingY="24px" backgroundColor="background.surface" justifyContent="space-between" alignItems="flex-start" wrap="wrap" gap="4">
      <MpFlex direction="column">
        <MpText size="label-small" color="text.secondary">Dashboard</MpText>
        <MpText as="h1" size="h1">SDG</MpText>
      </MpFlex>

      <MpFlex gap="3" class="dashboard-filters">
        <MpFormControl id="sdg-filter-period">
          <MpFormLabel>Reporting Period</MpFormLabel>
          <MpSelect v-model="filterState.state.period" placeholder="All Periods" is-full-width>
            <option value="">All Periods</option>
            <option v-for="p in filterState.periods.value" :key="p.id" :value="String(p.year)">{{ p.year }}</option>
          </MpSelect>
        </MpFormControl>
        <MpFormControl id="sdg-filter-entity">
          <MpFormLabel>Entity</MpFormLabel>
          <MpSelect v-model="filterState.state.entityId" placeholder="All Entities" is-full-width>
            <option value="">All Entities</option>
            <option v-for="e in filterState.entities.value" :key="e.id" :value="e.id">{{ e.name }}</option>
          </MpSelect>
        </MpFormControl>
      </MpFlex>
    </MpFlex>

    <MpFlex v-if="isLoading" direction="column" padding="24px" gap="2">
      <MpSkeleton v-for="i in 4" :key="i" height="56px" rounded="md" />
    </MpFlex>

    <MpFlex v-else direction="column" padding="24px" gap="6" class="sdg-print-area">
      <div :class="css({ display: 'grid', gridTemplateColumns: '4', gap: '4' })">
        <SummaryBox variant="blue" label="Holding SDG Roadmap" :amount="kpi.holding_sdg_roadmap" />
        <SummaryBox variant="green" label="Strategic Alignment %" :amount="`${kpi.strategic_alignment_rate}%`" />
        <SummaryBox variant="orange" label="Execution Rate (Take)" :amount="`${kpi.execution_rate_take}%`" />
        <SummaryBox variant="gray" label="Bottom-Up Initiatives" :amount="kpi.bottom_up_initiatives" />
      </div>

      <MpFlex direction="column" gap="3">
        <MpText as="h2" size="h3" weight="semiBold">Strategic Action Matrix — Take Rate per SDG</MpText>
        <MpTableContainer v-if="matrix.length">
          <MpTable>
            <MpTableHead>
              <MpTableRow>
                <MpTableCell scope="col">SDG</MpTableCell>
                <MpTableCell scope="col">Take Rate</MpTableCell>
                <MpTableCell scope="col">Aligned</MpTableCell>
                <MpTableCell scope="col">Initiated</MpTableCell>
              </MpTableRow>
            </MpTableHead>
            <MpTableBody>
              <MpTableRow v-for="row in matrix" :key="row.sdg.id">
                <MpTableCell as="td" scope="row" @click="selectedSdgId = row.sdg.id" :class="css({ cursor: 'pointer' })">
                  SDG {{ row.sdg.number }} — {{ row.sdg.name }}
                </MpTableCell>
                <MpTableCell as="td" scope="row" @click="selectedSdgId = row.sdg.id" :class="css({ cursor: 'pointer' })">
                  {{ row.take_rate }}%
                </MpTableCell>
                <MpTableCell as="td" scope="row" @click="selectedSdgId = row.sdg.id" :class="css({ cursor: 'pointer' })">
                  {{ row.aligned_count }}
                </MpTableCell>
                <MpTableCell as="td" scope="row" @click="selectedSdgId = row.sdg.id" :class="css({ cursor: 'pointer' })">
                  {{ row.initiated_count }}
                </MpTableCell>
              </MpTableRow>
            </MpTableBody>
          </MpTable>
        </MpTableContainer>
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

      <MpFlex direction="column" gap="3">
        <MpText as="h2" size="h3" weight="semiBold">Aligned vs Initiated per SDG</MpText>
        <MpChart
          id="sdg-aligned-vs-initiated"
          title="Aligned vs Initiated"
          type="bar"
          width-container="100%"
          width-chart="100%"
          :data="alignedVsInitiatedData"
        />
        <!-- print-ready / zero-hover (AC-70..73): every value the chart plots is repeated here as
             plain text, so the numbers are still readable with no mouse and on a printed page. -->
        <MpFlex direction="column" gap="1" class="sdg-chart-labels">
          <MpText v-for="row in matrix" :key="row.sdg.id" size="label-small" color="text.secondary">
            SDG {{ row.sdg.number }} — {{ row.sdg.name }}: Aligned {{ row.aligned_count }} / Initiated {{ row.initiated_count }}
          </MpText>
        </MpFlex>
      </MpFlex>

      <MpFlex v-if="selectedSdgId" direction="column" gap="3">
        <MpText as="h2" size="h3" weight="semiBold">
          Detail — SDG {{ selectedMatrixRow?.sdg.number }} {{ selectedMatrixRow?.sdg.name }}
        </MpText>
        <MpTableContainer v-if="selectedDetail.length">
          <MpTable>
            <MpTableHead>
              <MpTableRow>
                <MpTableCell scope="col">Entity</MpTableCell>
                <MpTableCell scope="col">Key Business Action</MpTableCell>
                <MpTableCell scope="col">Action Indicator</MpTableCell>
                <MpTableCell scope="col">Created By</MpTableCell>
                <MpTableCell scope="col">Decision</MpTableCell>
                <MpTableCell scope="col">Skip Reason</MpTableCell>
              </MpTableRow>
            </MpTableHead>
            <MpTableBody>
              <MpTableRow v-for="item in selectedDetail" :key="item.id">
                <MpTableCell as="td" scope="row">{{ item.entity.name }}</MpTableCell>
                <MpTableCell as="td" scope="row">{{ item.key_business_action }}</MpTableCell>
                <MpTableCell as="td" scope="row">{{ item.action_indicator?.name ?? '-' }}</MpTableCell>
                <MpTableCell as="td" scope="row">
                  <MpFlex direction="column" gap="1" alignItems="flex-start">
                    <MpText size="label-small">{{ item.created_by_level }}</MpText>
                    <MpBadge v-if="item.unverified" for="tableStatus" type="announcement">Unverified / Non-Official SDG</MpBadge>
                  </MpFlex>
                </MpTableCell>
                <MpTableCell as="td" scope="row">
                  <MpBadge for="tableStatus" :type="decisionBadgeType[item.decision ?? 'none']">{{ item.decision ?? 'Pending' }}</MpBadge>
                </MpTableCell>
                <MpTableCell as="td" scope="row">{{ item.skip_reason ?? '-' }}</MpTableCell>
              </MpTableRow>
            </MpTableBody>
          </MpTable>
        </MpTableContainer>
        <MpText v-else size="label" color="text.secondary">No action plan items for this SDG yet.</MpText>
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
  MpTable,
  MpTableHead,
  MpTableBody,
  MpTableRow,
  MpTableCell,
  MpTableContainer,
  MpBadge,
  css,
} from '@mekari/pixel3'
import SummaryBox from '@/components/SummaryBox.vue'
import { useSdgInsight, useStrategicInsightFilterState } from '@/services/strategic-insight'

const filterState = useStrategicInsightFilterState()
const { data, isLoading } = useSdgInsight(filterState.params)

const kpi = computed<StrategicInsightSdgKpi>(
  () =>
    data.value?.kpi ?? {
      holding_sdg_roadmap: 0,
      strategic_alignment_rate: 0,
      execution_rate_take: 0,
      bottom_up_initiatives: 0,
    },
)
const matrix = computed(() => data.value?.matrix ?? [])
const detail = computed(() => data.value?.detail ?? [])

const selectedSdgId = ref<string | null>(null)
const selectedMatrixRow = computed(() => matrix.value.find((row) => row.sdg.id === selectedSdgId.value))
const selectedDetail = computed(() => detail.value.filter((item) => item.sdg_id === selectedSdgId.value))

const alignedVsInitiatedData = computed(() => ({
  labels: matrix.value.map((row) => `SDG ${row.sdg.number}`),
  datasets: [
    { label: 'Aligned', data: matrix.value.map((row) => row.aligned_count) },
    { label: 'Initiated', data: matrix.value.map((row) => row.initiated_count) },
  ],
}))

// none === decision null (Pending Response) — kept out of the global TakeSkipDecision union
const decisionBadgeType: Record<'Take' | 'Skip' | 'none', 'completed' | 'announcement' | 'information'> = {
  Take: 'completed',
  Skip: 'announcement',
  none: 'information',
}
</script>

<style scoped>
@media print {
  .dashboard-filters {
    display: none;
  }
  .sdg-print-area {
    padding: 12px;
  }
  @page {
    size: A4;
    margin: 12mm;
  }
}
</style>

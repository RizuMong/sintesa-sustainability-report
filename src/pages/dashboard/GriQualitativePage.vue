<template>
  <MpFlex direction="column" backgroundColor="background.stage" minHeight="100vh">
    <MpFlex paddingX="24px" paddingY="24px" backgroundColor="background.surface" justifyContent="space-between" alignItems="flex-start" wrap="wrap" gap="4">
      <MpFlex direction="column">
        <MpText size="label-small" color="text.secondary">Dashboard</MpText>
        <MpText as="h1" size="h1">GRI — Qualitative</MpText>
      </MpFlex>

      <MpFlex gap="3">
        <MpFormControl id="gri-qual-filter-period">
          <MpFormLabel>Reporting Period</MpFormLabel>
          <MpSelect v-model="filterState.state.period" placeholder="All Periods" is-full-width>
            <option value="">All Periods</option>
            <option v-for="p in filterState.periods.value" :key="p.id" :value="String(p.year)">{{ p.year }}</option>
          </MpSelect>
        </MpFormControl>
        <MpFormControl id="gri-qual-filter-entity">
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

    <MpFlex v-else direction="column" padding="24px" gap="6">
      <MpText size="label" color="text.secondary">Menampilkan: {{ filterState.activeFilterLabel.value }}</MpText>

      <div :class="css({ display: 'grid', gridTemplateColumns: '3', gap: '4' })">
        <SummaryBox variant="blue" label="Total narasi" :amount="narratives.length" :badge="narratives.length" />
        <SummaryBox variant="green" label="Sudah diisi" :amount="answeredCount" :badge="answeredCount" />
        <SummaryBox variant="orange" label="Belum diisi" :amount="narratives.length - answeredCount" :badge="narratives.length - answeredCount" />
      </div>

      <MpFlex gap="4" wrap="wrap">
        <MpChart
          id="gri-qual-review-status"
          title="Status pengisian"
          type="doughnut"
          width-container="330px"
          width-chart="330px"
          height-chart="240px"
          :data="statusChartData"
        />
      </MpFlex>

      <MpTableContainer v-if="narratives.length">
        <MpTable>
          <MpTableHead>
            <MpTableRow>
              <MpTableCell scope="col">GRI Code</MpTableCell>
              <MpTableCell scope="col">Title</MpTableCell>
              <MpTableCell scope="col">Entity</MpTableCell>
              <MpTableCell scope="col">Period</MpTableCell>
              <MpTableCell scope="col">Status</MpTableCell>
            </MpTableRow>
          </MpTableHead>
          <MpTableBody>
            <MpTableRow v-for="item in narratives" :key="`${item.gri_code}-${item.entity.id}-${item.period}`">
              <MpTableCell as="td" scope="row">{{ item.gri_code }}</MpTableCell>
              <MpTableCell as="td" scope="row">{{ item.title }}</MpTableCell>
              <MpTableCell as="td" scope="row">{{ item.entity.name }}</MpTableCell>
              <MpTableCell as="td" scope="row">{{ item.period }}</MpTableCell>
              <MpTableCell as="td" scope="row">
                <MpBadge for="tableStatus" :type="item.answered ? 'completed' : 'announcement'">{{ item.answered ? 'Answered' : 'Pending' }}</MpBadge>
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
  </MpFlex>
</template>

<script setup lang="ts">
import { computed } from 'vue'
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
import { useGriQualitativeInsight, useStrategicInsightFilterState } from '@/services/strategic-insight'

const filterState = useStrategicInsightFilterState()
const { data, isLoading } = useGriQualitativeInsight(filterState.params)

const narratives = computed(() => data.value?.narratives ?? [])
const answeredCount = computed(() => narratives.value.filter((n) => n.answered).length)

const statusChartData = computed(() => ({
  labels: ['Answered', 'Pending'],
  datasets: [{ label: 'Narasi', data: [answeredCount.value, narratives.value.length - answeredCount.value] }],
}))
</script>

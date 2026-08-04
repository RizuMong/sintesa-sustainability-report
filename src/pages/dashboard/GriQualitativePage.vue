<template>
  <MpFlex direction="column" backgroundColor="background.stage" minHeight="100vh">
    <MpFlex paddingX="24px" paddingY="24px" backgroundColor="background.surface">
      <MpFlex direction="column">
        <MpText size="label-small" color="text.secondary">Dashboard</MpText>
        <MpText as="h1" size="h1">GRI — Qualitative</MpText>
      </MpFlex>
    </MpFlex>

    <MpFlex direction="column" padding="24px" gap="6">
      <MpFlex gap="4">
        <SummaryBox label="Total narasi terkumpul" amount="18" />
        <SummaryBox label="Sudah direview" amount="12" />
        <SummaryBox label="Menunggu review" amount="6" />
      </MpFlex>

      <MpFlex gap="4" wrap="wrap">
        <MpChart
          id="gri-qual-topic-coverage"
          title="Cakupan topik per kategori"
          type="bar"
          width-container="330px"
          width-chart="330px"
          :is-horizontal="true"
          :data="topicData"
        />
        <MpChart
          id="gri-qual-review-status"
          title="Status review"
          type="doughnut"
          width-container="330px"
          width-chart="330px"
          height-chart="240px"
          :data="statusData"
        />
      </MpFlex>
    </MpFlex>
  </MpFlex>
</template>

<script setup lang="ts">
import { MpFlex, MpText, MpChart } from '@mekari/pixel3'
import SummaryBox from '@/components/SummaryBox.vue'

const topicData = {
  labels: ['Tata kelola', 'Sosial', 'Lingkungan', 'Ekonomi'],
  datasets: [{ label: 'Narasi', data: [4, 6, 5, 3] }],
}

const statusData = {
  labels: ['Reviewed', 'Pending'],
  datasets: [{ label: 'Narasi', data: [12, 6] }],
}
</script>

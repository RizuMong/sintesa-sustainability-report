<template>
  <MpFlex direction="column" backgroundColor="background.stage" minHeight="100vh">
    <MpFlex paddingX="24px" paddingY="24px" backgroundColor="background.surface">
      <MpFlex direction="column">
        <MpText size="label-small" color="text.secondary">Dashboard</MpText>
        <MpText as="h1" size="h1">GRI — Quantitative</MpText>
      </MpFlex>
    </MpFlex>

    <MpFlex direction="column" padding="24px" gap="6">
      <MpFlex gap="4">
        <SummaryBox label="Total indikator" amount="42" />
        <SummaryBox label="Sudah diverifikasi" amount="31" />
        <SummaryBox label="Menunggu approval" amount="7" />
      </MpFlex>

      <MpFlex gap="4" wrap="wrap">
        <MpChart
          id="gri-quant-emission-trend"
          title="Emisi GHG per kuartal (tCO2e)"
          type="bar"
          width-container="330px"
          width-chart="330px"
          :data="emissionData"
        />
        <MpChart
          id="gri-quant-status-breakdown"
          title="Status evaluasi"
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

const emissionData = {
  labels: ['Q1', 'Q2', 'Q3', 'Q4'],
  datasets: [{ label: 'Scope 1', data: [1250, 1180, 1300, 1090] }],
}

const statusData = {
  labels: ['Approved', 'Submitted', 'Draft'],
  datasets: [{ label: 'Evaluasi', data: [31, 7, 4] }],
}
</script>

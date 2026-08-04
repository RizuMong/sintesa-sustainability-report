<template>
  <MpFlex direction="column" backgroundColor="background.stage" minHeight="100vh">
    <MpFlex paddingX="24px" paddingY="24px" backgroundColor="background.surface">
      <MpFlex direction="column">
        <MpText size="label-small" color="text.secondary">Dashboard</MpText>
        <MpText as="h1" size="h1">SDG</MpText>
      </MpFlex>
    </MpFlex>

    <MpFlex direction="column" padding="24px" gap="6">
      <MpFlex gap="4">
        <SummaryBox label="Total goal terpetakan" amount="12" />
        <SummaryBox label="On track" amount="8" />
        <SummaryBox label="Perlu perhatian" amount="4" />
      </MpFlex>

      <MpFlex gap="4" wrap="wrap">
        <MpChart
          id="sdg-goal-progress"
          title="Progress per SDG goal"
          type="bar"
          width-container="660px"
          width-chart="660px"
          :data="goalData"
        />
      </MpFlex>
    </MpFlex>
  </MpFlex>
</template>

<script setup lang="ts">
import { MpFlex, MpText, MpChart } from '@mekari/pixel3'
import SummaryBox from '@/components/SummaryBox.vue'

const goalData = {
  labels: ['SDG 6', 'SDG 7', 'SDG 12', 'SDG 13'],
  datasets: [{ label: 'Progress (%)', data: [72, 65, 48, 80] }],
}
</script>

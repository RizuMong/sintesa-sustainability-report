<template>
  <MpFlex direction="row" gap="6">
    <MpFlex py="2" alignItems="center" flexShrink="0" width="176px">
      <MpText size="label" color="text.secondary">{{ label }}</MpText>
    </MpFlex>
    <MpFlex py="2" alignItems="center" flex="1">
      <MpText size="label" color="text.primary">{{ value || '—' }}</MpText>
    </MpFlex>
  </MpFlex>
</template>

<script setup lang="ts">
import { MpFlex, MpText } from '@mekari/pixel3'

defineProps<{ label: string; value: string | undefined }>()
</script>

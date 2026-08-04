<template>
  <MpFlex
    direction="column"
    borderWidth="1px"
    borderColor="border.default"
    rounded="md"
    padding="4"
    flex="1"
  >
    <MpText size="label-small" color="text.secondary">{{ label }}</MpText>
    <MpText as="h2" size="h2">{{ amount }}</MpText>
  </MpFlex>
</template>

<script setup lang="ts">
import { MpFlex, MpText } from '@mekari/pixel3'

defineProps<{ label: string; amount: string | number }>()
</script>
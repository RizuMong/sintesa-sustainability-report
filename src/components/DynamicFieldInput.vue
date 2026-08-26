<template>
  <MpFlex v-if="input_type === 'Number'" alignItems="center" gap="2">
    <MpInput
      :model-value="modelValue as string | number | null"
      type="number"
      :is-disabled="disabled"
      :placeholder="unit ? `e.g. 100 ${unit}` : 'e.g. 100'"
      @update:model-value="$emit('update:modelValue', $event)"
    />
    <MpText v-if="unit" size="label" color="text.secondary">{{ unit }}</MpText>
  </MpFlex>

  <MpFlex v-else-if="input_type === 'Percentage'" alignItems="center" gap="2">
    <MpInput
      :model-value="modelValue as string | number | null"
      type="number"
      :is-disabled="disabled"
      placeholder="0-100"
      @update:model-value="$emit('update:modelValue', $event)"
    />
    <MpText size="label" color="text.secondary">%</MpText>
  </MpFlex>

  <MpFlex v-else-if="input_type === 'Boolean'" alignItems="center" gap="2">
    <MpToggle
      :is-checked="modelValue === true"
      :is-disabled="disabled"
      @update:is-checked="$emit('update:modelValue', $event)"
    />
    <MpText size="label">{{ modelValue === true ? 'Ya' : 'Tidak' }}</MpText>
  </MpFlex>

  <MpTextarea
    v-else
    :model-value="modelValue as string | null"
    :is-disabled="disabled"
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>

<script setup lang="ts">
import { MpFlex, MpInput, MpText, MpToggle, MpTextarea } from '@mekari/pixel3'

// Dynamic Validation Engine field renderer (FSD 2.9 table, §4 of the impl plan) — one cell of the
// GRI submission matrix, dispatched by MkiInputType. Owned by Stream C, imported by D and F.
defineProps<{
  input_type: MkiInputType
  unit?: string | null
  modelValue: string | number | boolean | null
  disabled?: boolean
}>()

defineEmits<{
  'update:modelValue': [value: string | number | boolean | null]
}>()
</script>

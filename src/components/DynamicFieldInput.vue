<template>
  <MpFlex v-if="kind === 'number'" alignItems="center" gap="2">
    <MpInput
      :model-value="(modelValue ?? undefined) as string | number | undefined"
      type="number"
      :is-disabled="disabled"
      :placeholder="unit ? `e.g. 100 ${unit}` : 'e.g. 100'"
      @update:model-value="$emit('update:modelValue', $event)"
    />
    <MpText v-if="unit" size="label" color="text.secondary">{{ unit }}</MpText>
  </MpFlex>

  <MpFlex v-else-if="kind === 'percentage'" alignItems="center" gap="2">
    <MpInput
      :model-value="(modelValue ?? undefined) as string | number | undefined"
      type="number"
      :is-disabled="disabled"
      placeholder="0-100"
      @update:model-value="$emit('update:modelValue', $event)"
    />
    <MpText size="label" color="text.secondary">%</MpText>
  </MpFlex>

  <MpFlex v-else-if="kind === 'boolean'" alignItems="center" gap="2">
    <MpToggle
      :is-checked="modelValue === true"
      :is-disabled="disabled"
      @update:is-checked="$emit('update:modelValue', $event)"
    />
    <MpText size="label">{{ modelValue === true ? 'Ya' : 'Tidak' }}</MpText>
  </MpFlex>

  <MpInput
    v-else-if="kind === 'date'"
    :model-value="(modelValue ?? undefined) as string | undefined"
    type="date"
    :is-disabled="disabled"
    @update:model-value="$emit('update:modelValue', $event)"
  />

  <MpTextarea
    v-else
    :model-value="(modelValue ?? undefined) as string | undefined"
    :is-disabled="disabled"
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { MpFlex, MpInput, MpText, MpToggle, MpTextarea } from '@mekari/pixel3'

// Dynamic Validation Engine field renderer (FSD 2.9 table, §4 of the impl plan) — one cell of the
// GRI submission matrix, dispatched by input type. Owned by Stream C, imported by D and F.
// Two casings of the same enum reach this component — mki-sdg's Title-cased MkiInputType
// ('Number'|'Text'|'Percentage'|'Boolean') and the quantitative endpoints' SCREAMING_CASE
// MkiQuantInputType ('NUMBER'|'TEXT'|'PERCENTAGE'|'DATE'|'YES_NO') — so dispatch is case-folded here
// rather than duplicated per caller.
const props = defineProps<{
  input_type: MkiInputType | MkiQuantInputType
  unit?: string | null
  modelValue: string | number | boolean | null | undefined
  disabled?: boolean
}>()

defineEmits<{
  'update:modelValue': [value: string | number | boolean | null]
}>()

const kind = computed(() => {
  const type = String(props.input_type).toLowerCase()
  return type === 'yes_no' ? 'boolean' : type
})
</script>

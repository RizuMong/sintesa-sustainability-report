<template>
  <MpFlex v-if="input_type === 'Number'" alignItems="center" gap="2">
    <MpInput type="number" :model-value="modelValue" :is-disabled="disabled" @update:model-value="onUpdate" />
    <MpText v-if="unit" size="label">{{ unit }}</MpText>
  </MpFlex>

  <MpFlex v-else-if="input_type === 'Percentage'" alignItems="center" gap="2">
    <MpInput
      type="number"
      min="0"
      max="100"
      :model-value="modelValue"
      :is-disabled="disabled"
      @update:model-value="onUpdate"
    />
    <MpText size="label">%</MpText>
  </MpFlex>

  <MpFlex v-else-if="input_type === 'Boolean'" alignItems="center" gap="2">
    <MpToggle :is-checked="modelValue === 'true'" :is-disabled="disabled" @update:is-checked="onToggle" />
    <MpText size="label">{{ modelValue === 'true' ? 'Ya' : 'Tidak' }}</MpText>
  </MpFlex>

  <MpTextarea v-else :model-value="modelValue" :is-disabled="disabled" @update:model-value="onUpdate" />
</template>

<script setup lang="ts">
// ponytail: reconcile with Stream C at merge — Stream C owns this component (FSD §4 Dynamic
// Validation Engine). Built here at the same path/props/emits so Stream C's merge is a
// content swap, not a new file.
import { MpFlex, MpInput, MpText, MpTextarea, MpToggle } from '@mekari/pixel3'

defineProps<{
  input_type: MkiInputType
  unit?: string
  modelValue: string
  disabled?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [string] }>()

function onUpdate(value: string) {
  emit('update:modelValue', value)
}
function onToggle(checked: boolean) {
  emit('update:modelValue', String(checked))
}
</script>

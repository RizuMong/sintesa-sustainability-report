<template>
  <MpAutocomplete
    :model-value="modelValue"
    :data="options"
    label-prop="label"
    value-prop="value"
    :placeholder="placeholder"
    :is-clearable="clearable"
    is-full-width
    @update:model-value="(v: unknown) => emit('update:modelValue', v == null ? '' : String(v))"
  />
</template>

<script setup lang="ts">
import { MpAutocomplete } from '@mekari/pixel3'

withDefaults(defineProps<{
  modelValue: string
  options: { value: string; label: string }[]
  placeholder?: string
  clearable?: boolean
}>(), { clearable: true })
const emit = defineEmits<{ 'update:modelValue': [string] }>()
</script>

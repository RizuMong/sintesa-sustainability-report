<template>
  <div :class="css({ position: 'relative', display: 'inline-block' })">
    <MpPopover
      id="table-filter"
      is-manual
      :is-open="isOpen"
      placement="bottom-start"
      use-portal
      @close="isOpen = false"
    >
      <MpPopoverTrigger>
        <MpButton variant="secondary" left-icon="filter" @click="isOpen = !isOpen">Filter</MpButton>
      </MpPopoverTrigger>
      <MpPopoverContent :class="css({ width: '300px', padding: '4' })">
        <MpFlex direction="column" gap="4">
          <MpFormControl id="table-filter-column">
            <MpFormLabel>Filter by</MpFormLabel>
            <MpSelect v-model="column" placeholder="Select column" is-full-width>
              <option v-for="c in columns" :key="c.value" :value="c.value">{{ c.label }}</option>
            </MpSelect>
          </MpFormControl>
          <MpFormControl id="table-filter-value">
            <MpFormLabel>Filter value</MpFormLabel>
            <MpSelect v-if="valueOptions" v-model="value" placeholder="Select value" is-full-width :is-disabled="!column">
              <option v-for="o in valueOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
            </MpSelect>
            <MpInput v-else v-model="value" placeholder="Enter value" is-full-width :is-disabled="!column" />
          </MpFormControl>
          <MpFlex justifyContent="space-between" alignItems="center">
            <MpButton variant="ghost" size="sm" @click="onReset">Reset</MpButton>
            <MpButton variant="primary" size="sm" @click="onApply">Apply</MpButton>
          </MpFlex>
        </MpFlex>
      </MpPopoverContent>
    </MpPopover>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  MpFlex,
  MpButton,
  MpFormControl,
  MpFormLabel,
  MpSelect,
  MpInput,
  MpPopover,
  MpPopoverTrigger,
  MpPopoverContent,
  css,
} from '@mekari/pixel3'

export interface TableFilterOption {
  value: string
  label: string
}

export interface TableFilterColumn {
  value: string
  label: string
  options?: TableFilterOption[]
}

const props = defineProps<{ columns: TableFilterColumn[] }>()
const emit = defineEmits<{ apply: [{ column: string; value: string }]; reset: [] }>()

const isOpen = ref(false)
const column = ref('')
const value = ref('')

const valueOptions = computed(() => props.columns.find((c) => c.value === column.value)?.options)

watch(column, () => {
  value.value = ''
})

function onApply() {
  if (column.value && value.value) emit('apply', { column: column.value, value: value.value })
  isOpen.value = false
}

function onReset() {
  column.value = ''
  value.value = ''
  emit('reset')
  isOpen.value = false
}
</script>

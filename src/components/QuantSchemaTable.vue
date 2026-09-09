<template>
  <MpTableContainer>
    <MpTable>
      <MpTableHead>
        <MpTableRow>
          <MpTableCell v-for="col in columns" :key="col.key" scope="col">{{ col.name || col.key }}</MpTableCell>
          <MpTableCell v-for="metric in metrics" :key="metric.key" scope="col">
            {{ metric.name || metric.key }}
          </MpTableCell>
          <MpTableCell v-if="unitMode === 'UNIFORM' || unitMode === 'PER_ROW'" scope="col">Satuan</MpTableCell>
        </MpTableRow>
      </MpTableHead>
      <MpTableBody>
        <template v-for="displayRow in displayRows" :key="`${displayRow.kind}-${displayRow.sequence}`">
          <MpTableRow v-if="displayRow.kind === 'section'">
            <MpTableCell
              as="td"
              :colspan="totalColspan"
              :class="css({ backgroundColor: 'background.stage' })"
            >
              <MpText size="label" weight="semiBold">{{ displayRow.title }}</MpText>
            </MpTableCell>
          </MpTableRow>
          <MpTableRow v-else>
            <MpTableCell
              v-for="(col, colIndex) in columns"
              :key="col.key"
              as="td"
              scope="row"
              :class="colIndex === 0 && displayRow.depth === 1 ? css({ paddingLeft: '32px' }) : undefined"
            >
              {{ displayRow.labels[col.key] || '—' }}
            </MpTableCell>
            <MpTableCell v-for="metric in metrics" :key="metric.key" as="td" scope="row">
              <slot name="metric-cell" :row="displayRow" :metric="metric" :unit="displayRow.unit" />
            </MpTableCell>
            <MpTableCell v-if="unitMode === 'UNIFORM' || unitMode === 'PER_ROW'" as="td" scope="row">
              {{ displayRow.unit?.name || '—' }}
            </MpTableCell>
          </MpTableRow>
        </template>
        <MpTableRow v-if="!displayRows.length">
          <MpTableCell as="td" :colspan="totalColspan">
            <MpText size="label" color="text.secondary">No rows yet</MpText>
          </MpTableCell>
        </MpTableRow>
      </MpTableBody>
    </MpTable>
  </MpTableContainer>
</template>

<script setup lang="ts">
// GROU-651 phase 2: shared renderer for both the builder Live Preview and the Evaluate matrix, so
// section grouping / unit-mode rendering cannot drift between the two pages. Metric cell content
// differs per caller (input-type icon vs. a live DynamicFieldInput), so it is a scoped slot rather
// than a prop — see plan.md's phase-2 note.
import { computed } from 'vue'
import { MpTable, MpTableHead, MpTableBody, MpTableRow, MpTableCell, MpTableContainer, MpText, css } from '@mekari/pixel3'
import { toDisplayRows, type QuantDisplayRow } from '@/services/master-key-indicator-quantitative'

const props = defineProps<{
  columns: { key: string; name: string }[]
  metrics: MkiQuantMetric[]
  rows: (MkiQuantRow | EvaluateGriQuantitativeRow)[]
  unitMode?: MkiQuantUnitMode
  unit?: Ref2 | null
}>()

defineSlots<{
  'metric-cell'(props: {
    row: Extract<QuantDisplayRow, { kind: 'row' }>
    metric: MkiQuantMetric
    unit: Ref2 | null
  }): unknown
}>()

const displayRows = computed(() => toDisplayRows(props.rows, { unit_mode: props.unitMode, unit: props.unit }))

const totalColspan = computed(() => {
  const unitCol = props.unitMode === 'UNIFORM' || props.unitMode === 'PER_ROW' ? 1 : 0
  return props.columns.length + props.metrics.length + unitCol || 1
})
</script>

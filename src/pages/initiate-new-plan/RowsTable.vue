<!-- Editable/read-only Action Plan Matrix rows editor shared by initiate-new-plan's create and
     view screens. `ActionPlanMatrixRow` is Stream B's global (src/services/sdg-framework/types.d.ts) —
     this component only reads/writes its fields, never redeclares the type. -->
<template>
  <MpFlex direction="column" gap="4">
    <MpText size="h3" weight="semiBold">Action Plan Matrix</MpText>

    <MpFlex
      v-for="(row, i) in displayRows"
      :key="i"
      direction="column"
      gap="3"
      padding="16px"
      borderWidth="1px"
      borderColor="border.default"
      rounded="md"
    >
      <MpFlex justifyContent="space-between" alignItems="center">
        <MpText size="label" weight="semiBold">Row {{ i + 1 }}</MpText>
        <MpButton
          v-if="!readOnly && (rows as EditableRow[]).length > 1"
          variant="ghost"
          left-icon="delete"
          aria-label="Remove row"
          @click="removeRow(i)"
        />
      </MpFlex>

      <MpFlex gap="4">
        <MpFormControl :id="`row-code-${i}`" flex="1" is-required :is-disabled="readOnly">
          <MpFormLabel>No. Code</MpFormLabel>
          <MpInput :model-value="row.no_code" :is-disabled="readOnly" @update:model-value="(v: string) => setField(i, 'no_code', v)" />
        </MpFormControl>
        <MpFormControl :id="`row-pillar-${i}`" flex="1" is-required :is-disabled="readOnly">
          <MpFormLabel>Pillar</MpFormLabel>
          <MpSelect
            :model-value="row.pillar_id"
            placeholder="Select pillar"
            is-full-width
            :is-disabled="readOnly"
            @update:model-value="(v: string) => setField(i, 'pillar_id', v)"
          >
            <option value="" disabled>Select pillar</option>
            <option v-for="p in pillars" :key="p.id" :value="p.id">{{ p.name }}</option>
          </MpSelect>
        </MpFormControl>
      </MpFlex>

      <MpFormControl :id="`row-action-${i}`" is-required :is-disabled="readOnly">
        <MpFormLabel>Key Business Action</MpFormLabel>
        <MpTextarea :model-value="row.key_business_action" :is-disabled="readOnly" @update:model-value="(v: string) => setField(i, 'key_business_action', v)" />
      </MpFormControl>

      <MpFormControl :id="`row-solution-${i}`" :is-disabled="readOnly">
        <MpFormLabel>Detail Action Solution</MpFormLabel>
        <MpTextarea :model-value="row.detail_action_solution" :is-disabled="readOnly" @update:model-value="(v: string) => setField(i, 'detail_action_solution', v)" />
      </MpFormControl>

      <MpFlex gap="4">
        <MpFormControl :id="`row-indicator-${i}`" flex="1" :is-disabled="readOnly">
          <MpFormLabel>Action Indicator</MpFormLabel>
          <template v-if="readOnly">
            <MpInput :model-value="rowIndicatorName(row)" is-disabled />
          </template>
          <MpSelect
            v-else
            :model-value="(row as EditableRow).action_indicator_id"
            placeholder="Select indicator"
            is-full-width
            @update:model-value="(v: string) => setField(i, 'action_indicator_id', v)"
          >
            <option value="">None</option>
            <option v-for="mki in indicators" :key="mki.id" :value="mki.id">{{ mki.indicator_name }}</option>
          </MpSelect>
        </MpFormControl>
        <MpFormControl :id="`row-alignment-${i}`" flex="1" :is-disabled="readOnly">
          <MpFormLabel>Alignment</MpFormLabel>
          <MpInput :model-value="row.alignment" :is-disabled="readOnly" @update:model-value="(v: string) => setField(i, 'alignment', v)" />
        </MpFormControl>
      </MpFlex>
    </MpFlex>

    <MpButton
      v-if="!readOnly"
      size="sm"
      variant="ghost"
      left-icon="add"
      is-full-width
      :class="css({ borderWidth: '1px', borderStyle: 'dashed', borderColor: 'border.default', justifyContent: 'center' })"
      @click="addRow"
    >
      Add Row
    </MpButton>
  </MpFlex>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { MpFlex, MpText, MpButton, MpInput, MpSelect, MpTextarea, MpFormControl, MpFormLabel, css } from '@mekari/pixel3'

export interface EditableRow {
  no_code: string
  pillar_id: string
  key_business_action: string
  detail_action_solution: string
  action_indicator_id: string
  alignment: string
}

function emptyRow(): EditableRow {
  return { no_code: '', pillar_id: '', key_business_action: '', detail_action_solution: '', action_indicator_id: '', alignment: '' }
}

const props = defineProps<{
  rows: EditableRow[] | ActionPlanMatrixRow[]
  pillars: MasterPillar[] | undefined
  indicators: MkiSdg[] | undefined
  readOnly?: boolean
}>()
const emit = defineEmits<{ 'update:rows': [EditableRow[]] }>()

// always start an empty create-form with one row to edit
if (!props.readOnly && props.rows.length === 0) emit('update:rows', [emptyRow()])

const displayRows = computed(() => props.rows)

function rowIndicatorName(row: EditableRow | ActionPlanMatrixRow): string {
  return 'action_indicator' in row ? row.action_indicator?.name ?? '—' : '—'
}

function setField(i: number, field: keyof EditableRow, value: string) {
  if (props.readOnly) return
  const next = [...(props.rows as EditableRow[])]
  next[i] = { ...next[i], [field]: value }
  emit('update:rows', next)
}

function addRow() {
  emit('update:rows', [...(props.rows as EditableRow[]), emptyRow()])
}

function removeRow(i: number) {
  const next = [...(props.rows as EditableRow[])]
  next.splice(i, 1)
  emit('update:rows', next)
}
</script>

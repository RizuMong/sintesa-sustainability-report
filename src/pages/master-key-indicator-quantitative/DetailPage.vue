<template>
  <MpFlex direction="column" backgroundColor="background.surface" minHeight="100vh">
    <MpFlex justifyContent="space-between" alignItems="center" paddingX="24px" paddingY="24px">
      <MpFlex direction="row" gap="3">
        <MpButton variant="ghost" left-icon="arrows-left" aria-label="Back" @click="router.back()" />
        <MpFlex direction="column" alignItems="flex-start">
          <MpButton variant="textLink" as="a" href="#/master-key-indicator-quantitative">
            Master Key Indicator — Quantitative
          </MpButton>
          <MpFlex alignItems="center" gap="3">
            <MpText as="h1" size="h1">{{ isEdit ? form.description || 'Edit' : 'Create' }}</MpText>
            <MpBadge v-if="isEdit" for="tableStatus" :type="status === 'Active' ? 'completed' : 'announcement'">
              {{ status }}
            </MpBadge>
          </MpFlex>
        </MpFlex>
      </MpFlex>
      <MpButton v-if="isEdit" variant="ghost" left-icon="delete" @click="isConfirmingDelete = true">Delete</MpButton>
    </MpFlex>

    <MpFlex
      direction="row"
      flex="1"
      gap="6"
      backgroundColor="background.stage"
      borderTopWidth="1px"
      borderLeftWidth="1px"
      borderColor="border.default"
      roundedTopLeft="md"
      padding="24px"
    >
      <MpFlex v-if="isLoading" direction="column" gap="2" flex="1">
        <MpSkeleton v-for="i in 4" :key="i" height="56px" rounded="md" />
      </MpFlex>

      <template v-else>
        <MpFlex direction="column" gap="6" flex="1" maxWidth="640px">
          <MpFlex gap="6">
            <MpFormControl id="mki-category" is-required flex="1">
              <MpFormLabel>Category</MpFormLabel>
              <MpSelect v-model="form.categoryId" placeholder="Select category" is-full-width>
                <option value="" disabled>Select category</option>
                <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
              </MpSelect>
            </MpFormControl>
            <MpFormControl id="mki-code" is-required flex="1">
              <MpFormLabel>Code</MpFormLabel>
              <MpSelect v-model="form.code" placeholder="Select code" is-full-width>
                <option value="" disabled>Select code</option>
                <option v-for="g in griCodes" :key="g.id" :value="g.gri_code">
                  {{ g.gri_code }} — {{ g.disclosure_title }}
                </option>
              </MpSelect>
            </MpFormControl>
          </MpFlex>

          <MpFormControl id="mki-description" is-required>
            <MpFormLabel>Description</MpFormLabel>
            <MpInput v-model="form.description" placeholder="e.g. Work-related Injuries (403-9)" />
          </MpFormControl>

          <MpDivider />

          <MpFlex direction="column" gap="3">
            <MpText size="h3" weight="semiBold">Columns</MpText>
            <MpFlex
              v-for="(col, i) in form.columns"
              :key="i"
              gap="3"
              alignItems="flex-end"
              paddingBottom="3"
            >
              <MpFormControl :id="`col-name-${i}`" flex="1">
                <MpFormLabel v-if="i === 0">Column name</MpFormLabel>
                <MpInput v-model="col.name" placeholder="e.g. Employee Type" @update:model-value="syncColumnKey(col)" />
              </MpFormControl>
              <MpFormControl :id="`col-key-${i}`" flex="1">
                <MpFormLabel v-if="i === 0">Key</MpFormLabel>
                <MpInput :model-value="col.key" is-disabled placeholder="employee_type" />
              </MpFormControl>
              <MpFlex direction="column" gap="1">
                <MpText v-if="i === 0" size="label" :class="css({ visibility: 'hidden' })">Action</MpText>
                <MpButton variant="ghost" left-icon="delete" aria-label="Remove column" @click="removeColumn(i)" />
              </MpFlex>
            </MpFlex>
            <MpButton
              size="sm"
              variant="ghost"
              left-icon="add"
              is-full-width
              :class="css({ borderWidth: '1px', borderStyle: 'dashed', borderColor: 'border.default', justifyContent: 'center' })"
              @click="addColumn"
            >
              Add Column
            </MpButton>
          </MpFlex>

          <MpDivider />

          <MpFlex direction="column" gap="3">
            <MpText size="h3" weight="semiBold">Metrics</MpText>
            <MpFlex
              v-for="(metric, i) in form.metrics"
              :key="i"
              gap="3"
              alignItems="flex-end"
              paddingBottom="3"
            >
              <MpFormControl :id="`metric-name-${i}`" flex="2" minWidth="0">
                <MpFormLabel v-if="i === 0">Metric name</MpFormLabel>
                <MpInput v-model="metric.name" placeholder="e.g. Number of Injury" @update:model-value="syncMetricKey(metric)" />
              </MpFormControl>
              <MpFormControl :id="`metric-type-${i}`" flex="1" minWidth="0">
                <MpFormLabel v-if="i === 0">Input type</MpFormLabel>
                <MpPopover :id="`metric-type-popover-${i}`" placement="bottom-start" use-portal>
                  <MpPopoverTrigger>
                    <MpButton
                      variant="secondary"
                      is-full-width
                      :left-icon="inputTypeIcon(metric.input_type)"
                      right-icon="chevrons-down"
                      :class="css({ justifyContent: 'space-between' })"
                      :style="{ width: '100%' }"
                    >
                      {{ inputTypeLabel(metric.input_type) }}
                    </MpButton>
                  </MpPopoverTrigger>
                  <MpPopoverContent>
                    <MpPopoverList>
                      <MpPopoverListItem
                        v-for="opt in inputTypeOptions"
                        :key="opt.value"
                        @click="metric.input_type = opt.value"
                      >
                        <MpFlex gap="2" alignItems="center">
                          <MpIcon v-if="opt.icon" :name="opt.icon" size="sm" />
                          <MpText v-else size="label" color="text.secondary">%</MpText>
                          {{ opt.label }}
                        </MpFlex>
                      </MpPopoverListItem>
                    </MpPopoverList>
                  </MpPopoverContent>
                </MpPopover>
              </MpFormControl>
              <MpFormControl :id="`metric-unit-${i}`" flex="1" minWidth="0">
                <MpFormLabel v-if="i === 0">Unit</MpFormLabel>
                <MpSelect v-model="metric.unitId" placeholder="No unit" is-full-width is-clearable>
                  <option value="">No unit</option>
                  <option v-for="u in units" :key="u.id" :value="u.id">{{ u.name }}</option>
                </MpSelect>
              </MpFormControl>
              <MpFlex direction="column" gap="1">
                <MpText v-if="i === 0" size="label" :class="css({ visibility: 'hidden' })">Action</MpText>
                <MpButton variant="ghost" left-icon="delete" aria-label="Remove metric" @click="removeMetric(i)" />
              </MpFlex>
            </MpFlex>
            <MpButton
              size="sm"
              variant="ghost"
              left-icon="add"
              is-full-width
              :class="css({ borderWidth: '1px', borderStyle: 'dashed', borderColor: 'border.default', justifyContent: 'center' })"
              @click="addMetric"
            >
              Add Metric
            </MpButton>
          </MpFlex>

          <MpDivider />

          <MpFlex direction="column" gap="3">
            <MpText size="h3" weight="semiBold">Rows</MpText>
            <MpText v-if="!form.columns.length" size="label" color="text.secondary">Add at least one column first.</MpText>
            <MpFlex
              v-for="(row, i) in form.rows"
              :key="i"
              gap="3"
              alignItems="flex-end"
              paddingBottom="3"
            >
              <MpFormControl v-for="col in form.columns" :key="col.key" :id="`row-${i}-${col.key}`" flex="1">
                <MpFormLabel v-if="i === 0">{{ col.name || col.key }}</MpFormLabel>
                <MpInput v-model="row.labels[col.key]" :placeholder="col.name" />
              </MpFormControl>
              <MpFlex direction="column" gap="1">
                <MpText v-if="i === 0" size="label" :class="css({ visibility: 'hidden' })">Action</MpText>
                <MpButton variant="ghost" left-icon="delete" aria-label="Remove row" @click="removeRow(i)" />
              </MpFlex>
            </MpFlex>
            <MpButton
              size="sm"
              variant="ghost"
              left-icon="add"
              is-full-width
              :is-disabled="!form.columns.length"
              :class="css({ borderWidth: '1px', borderStyle: 'dashed', borderColor: 'border.default', justifyContent: 'center' })"
              @click="addRow"
            >
              Add Row
            </MpButton>
          </MpFlex>

          <MpDivider />

          <MpFlex>
            <MpButton :is-disabled="!canSave" @click="save">{{ isEdit ? 'Update' : 'Create' }}</MpButton>
          </MpFlex>
        </MpFlex>

        <MpFlex
          direction="column"
          gap="3"
          flex="1"
          minWidth="0"
          backgroundColor="background.surface"
          borderWidth="1px"
          borderColor="border.default"
          rounded="md"
          padding="16px"
          height="fit-content"
        >
          <MpText size="h3" weight="semiBold">Live Preview</MpText>
          <MpTableContainer>
            <MpTable>
              <MpTableHead>
                <MpTableRow>
                  <MpTableCell v-for="col in form.columns" :key="col.key" scope="col">{{ col.name || col.key }}</MpTableCell>
                  <MpTableCell v-for="metric in form.metrics" :key="metric.key" scope="col">
                    {{ metric.name || metric.key }}
                  </MpTableCell>
                </MpTableRow>
              </MpTableHead>
              <MpTableBody>
                <MpTableRow v-for="(row, i) in form.rows" :key="i">
                  <MpTableCell v-for="col in form.columns" :key="col.key" as="td" scope="row">
                    {{ row.labels[col.key] || '—' }}
                  </MpTableCell>
                  <MpTableCell v-for="metric in form.metrics" :key="metric.key" as="td" scope="row">
                    <MpIcon v-if="inputTypeIcon(metric.input_type)" :name="inputTypeIcon(metric.input_type)!" size="sm" />
                    <MpText v-else size="label" color="text.secondary">%</MpText>
                  </MpTableCell>
                </MpTableRow>
                <MpTableRow v-if="!form.rows.length">
                  <MpTableCell as="td" :colspan="form.columns.length + form.metrics.length || 1">
                    <MpText size="label" color="text.secondary">No rows yet</MpText>
                  </MpTableCell>
                </MpTableRow>
              </MpTableBody>
            </MpTable>
          </MpTableContainer>
        </MpFlex>
      </template>
    </MpFlex>

    <ConfirmDeleteModal
      :is-open="isConfirmingDelete"
      title="Delete this indicator?"
      message="This permanently removes the indicator schema. This action cannot be undone."
      @close="isConfirmingDelete = false"
      @confirm="confirmDelete"
    />
  </MpFlex>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  MpFlex,
  MpText,
  MpButton,
  MpBadge,
  MpInput,
  MpSelect,
  MpFormControl,
  MpFormLabel,
  MpDivider,
  MpIcon,
  MpPopover,
  MpPopoverTrigger,
  MpPopoverContent,
  MpPopoverList,
  MpPopoverListItem,
  MpSkeleton,
  MpTable,
  MpTableHead,
  MpTableBody,
  MpTableRow,
  MpTableCell,
  MpTableContainer,
  css,
  toast,
  type IconName,
} from '@mekari/pixel3'
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal.vue'
import {
  useMkiGriQuantitativeDetail,
  useCreateMkiGriQuantitative,
  useUpdateMkiGriQuantitative,
  useDeleteMkiGriQuantitative,
} from '@/services/master-key-indicator-quantitative'
import { useGetMasterCategory } from '@/services/master-category'
import { useGetMasterGri } from '@/services/master-gri'
import { useGetMasterUnit } from '@/services/master-unit'

// pixel3 icon set has no percent glyph — PERCENTAGE renders a "%" label instead of an icon
const inputTypeOptions: { value: MkiQuantInputType; icon?: IconName; label: string }[] = [
  { value: 'NUMBER', icon: 'number', label: 'Number' },
  { value: 'TEXT', icon: 'textarea', label: 'Text' },
  { value: 'PERCENTAGE', label: 'Percentage' },
  { value: 'DATE', icon: 'calendar', label: 'Date' },
  { value: 'YES_NO', icon: 'check', label: 'Yes / No' },
]

function inputTypeIcon(type: MkiQuantInputType) {
  return inputTypeOptions.find((opt) => opt.value === type)?.icon
}

function inputTypeLabel(type: MkiQuantInputType) {
  return inputTypeOptions.find((opt) => opt.value === type)?.label ?? type
}

const route = useRoute()
const router = useRouter()

const id = route.query.id as string | undefined
const isEdit = computed(() => Boolean(id))
const isConfirmingDelete = ref(false)

const { data: categoryData } = useGetMasterCategory()
const categories = computed(() => categoryData.value ?? [])

const { data: griData } = useGetMasterGri()
const griCodes = computed(() => (griData.value ?? []).filter((g) => g.status === 'Active'))

const { data: unitData } = useGetMasterUnit()
const units = computed(() => unitData.value ?? [])

const { data: detail, isLoading: isFetching } = useMkiGriQuantitativeDetail(id)
const isLoading = computed(() => isEdit.value && isFetching.value)
// no status field on the endpoint yet — see the ponytail note on MkiGriQuantitative.status
const status = computed(() => detail.value?.status ?? 'Active')

const form = reactive({
  categoryId: '',
  code: '',
  description: '',
  columns: [] as { key: string; name: string }[],
  metrics: [] as { key: string; name: string; input_type: MkiQuantInputType; unitId: string }[],
  rows: [] as { labels: Record<string, string> }[],
})

const canSave = computed(() =>
  Boolean(form.categoryId && form.code && form.description && form.columns.length),
)

// ponytail: naive slugify, no collision handling — fine for a schema builder
function slugify(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function syncColumnKey(col: { key: string; name: string }) {
  col.key = slugify(col.name)
}

function syncMetricKey(metric: { key: string; name: string }) {
  metric.key = slugify(metric.name)
}

function addColumn() {
  form.columns.push({ key: '', name: '' })
}

function removeColumn(i: number) {
  const [removed] = form.columns.splice(i, 1)
  if (removed) form.rows.forEach((row) => delete row.labels[removed.key])
}

function addMetric() {
  form.metrics.push({ key: '', name: '', input_type: 'NUMBER', unitId: '' })
}

function removeMetric(i: number) {
  form.metrics.splice(i, 1)
}

function addRow() {
  const labels: Record<string, string> = {}
  form.columns.forEach((c) => (labels[c.key] = ''))
  form.rows.push({ labels })
}

function removeRow(i: number) {
  form.rows.splice(i, 1)
}

watch(
  detail,
  (next) => {
    if (!next) return
    form.categoryId = next.category_id?.id ?? ''
    form.code = next.code
    form.description = next.description
    form.columns = next.columns.map((c) => ({ key: c.key, name: c.name }))
    form.metrics = next.metrics.map((m) => ({
      key: m.key,
      name: m.name,
      input_type: m.input_type,
      unitId: m.unit?.id ?? '',
    }))
    form.rows = next.rows.map((r) => ({ labels: { ...r.labels } }))
  },
  { immediate: true },
)

const createMutation = useCreateMkiGriQuantitative()
const updateMutation = useUpdateMkiGriQuantitative()
const deleteMutation = useDeleteMkiGriQuantitative()

function buildPayload(): MkiGriQuantitativePayload {
  const category = categories.value.find((c) => c.id === form.categoryId)
  return {
    category_id: { id: form.categoryId, name: category?.name ?? '' },
    code: form.code,
    description: form.description,
    columns: form.columns.map((c, i) => ({ key: c.key, name: c.name, sequence: i + 1 })),
    metrics: form.metrics.map((m, i) => {
      const unit = units.value.find((u) => u.id === m.unitId)
      return {
        key: m.key,
        name: m.name,
        input_type: m.input_type,
        unit: unit ? { id: unit.id, name: unit.name } : null,
        sequence: i + 1,
      }
    }),
    rows: form.rows.map((r, i) => ({ sequence: i + 1, labels: { ...r.labels } })),
  }
}

async function save() {
  if (!canSave.value) return
  if (isEdit.value && id) {
    await updateMutation.mutateAsync({ ...buildPayload(), id })
    toast.notify({ id: 'mki-update', variant: 'success', title: 'Indicator updated.' })
  } else {
    await createMutation.mutateAsync(buildPayload())
    toast.notify({ id: 'mki-create', variant: 'success', title: 'Indicator created.' })
  }
  router.push('/master-key-indicator-quantitative')
}

async function confirmDelete() {
  if (!id) return
  await deleteMutation.mutateAsync(id)
  isConfirmingDelete.value = false
  router.push('/master-key-indicator-quantitative')
}
</script>

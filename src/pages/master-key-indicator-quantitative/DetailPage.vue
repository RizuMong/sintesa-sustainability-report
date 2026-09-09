<template>
  <MpFlex direction="column" backgroundColor="background.surface" minHeight="100vh">
    <MpFlex justifyContent="space-between" alignItems="center" paddingX="24px" paddingY="24px">
      <MpFlex direction="row" gap="3">
        <MpButton variant="ghost" left-icon="arrows-left" aria-label="Back" @click="leaveTo('back')" />
        <MpFlex direction="column" alignItems="flex-start" gap="1">
          <MpText
            size="label-small"
            color="text.secondary"
            role="link"
            tabindex="0"
            :class="css({ cursor: 'pointer' })"
            @click="leaveTo('list')"
            @keydown.enter="leaveTo('list')"
          >
            Master Key Indicator — Quantitative
          </MpText>
          <MpFlex alignItems="center" gap="3">
            <MpText as="h1" size="h1">{{ isEdit ? form.description || 'Edit' : 'Create' }}</MpText>
            <MpBadge v-if="isEdit" for="tableStatus" :type="status === 'Active' ? 'completed' : 'announcement'">
              {{ status }}
            </MpBadge>
            <MpText v-if="isEdit && lastUpdatedLabel" size="label-small" color="text.secondary">
              {{ lastUpdatedLabel }}
            </MpText>
          </MpFlex>
        </MpFlex>
      </MpFlex>
      <MpButton v-if="isEdit" variant="ghost" left-icon="delete" @click="isConfirmingDelete = true">Delete</MpButton>
    </MpFlex>

    <MpFlex
      direction="column"
      flex="1"
      gap="5"
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

      <MpBanner v-else-if="isLoadError" variant="danger">
        <MpBannerDescription>
          Couldn't load this indicator. Refresh the page to try again.
        </MpBannerDescription>
      </MpBanner>

      <template v-else>
        <!-- Form-level banner only after a submit attempt — the field errors say which ones. -->
        <MpBanner v-if="hasErrors" variant="danger">
          <MpBannerDescription>
            We couldn't save this indicator. Please review the highlighted fields.
          </MpBannerDescription>
        </MpBanner>

        <!-- identity -->
        <MpFlex v-bind="panel" direction="column" gap="5">
          <MpFlex gap="4" flexWrap="wrap" maxWidth="560px">
            <MpFormControl id="mki-category" is-required flex="1" minWidth="220px" :is-invalid="Boolean(errors.categoryId)">
              <MpFormLabel>Category</MpFormLabel>
              <MpSelect v-model="form.categoryId" size="md" placeholder="Select category" is-full-width>
                <option value="" disabled>Select category</option>
                <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
              </MpSelect>
              <MpFormErrorMessage v-if="errors.categoryId">{{ errors.categoryId }}</MpFormErrorMessage>
            </MpFormControl>
            <MpFormControl id="mki-code" is-required flex="1" minWidth="220px" :is-invalid="Boolean(errors.code)">
              <MpFormLabel>Code</MpFormLabel>
              <MpSelect v-model="form.code" size="md" placeholder="Select code" is-full-width>
                <option value="" disabled>Select code</option>
                <option v-for="g in griCodes" :key="g.id" :value="g.gri_code">
                  {{ g.gri_code }} — {{ g.disclosure_title }}
                </option>
              </MpSelect>
              <MpFormErrorMessage v-if="errors.code">{{ errors.code }}</MpFormErrorMessage>
            </MpFormControl>
          </MpFlex>
          <!-- MpFormControl drops layout props, so the 6-column cap has to live on a wrapper. -->
          <MpFlex maxWidth="560px">
            <MpFormControl id="mki-description" is-required flex="1" :is-invalid="Boolean(errors.description)">
              <MpFormLabel>Description</MpFormLabel>
              <MpInput
                v-model="form.description"
                size="md"
                placeholder="e.g. report the total number of employees, and a breakdown of this total by gender and by region"
              />
              <MpFormErrorMessage v-if="errors.description">{{ errors.description }}</MpFormErrorMessage>
            </MpFormControl>
          </MpFlex>
        </MpFlex>

        <MpFlex direction="row" gap="5" alignItems="flex-start" flexWrap="wrap">
          <MpFlex direction="column" gap="5" flex="1.15" minWidth="420px">
            <!-- step 1 — table structure -->
            <MpFlex v-bind="panel" direction="column" gap="4">
              <MpFlex gap="3" alignItems="flex-start">
                <MpFlex v-bind="stepBadge">1</MpFlex>
                <MpFlex direction="column">
                  <MpText size="h3" weight="semiBold">Table Structure</MpText>
                  <MpText size="label" color="text.secondary">
                    Define the label columns that identify each row and the value columns the
                    subsidiary fills in. The period is not configured here.
                  </MpText>
                </MpFlex>
              </MpFlex>

              <MpFlex gap="4" alignItems="flex-start" flexWrap="wrap">
                <!-- label columns -->
                <MpFlex v-bind="subpanel" direction="column" gap="3" flex="1" minWidth="240px">
                  <MpFlex direction="column">
                    <MpText size="label" weight="semiBold">Label Columns (row identity)</MpText>
                    <MpText size="label" color="text.secondary">
                      Categories that identify each row (e.g. Type, Area).
                    </MpText>
                  </MpFlex>

                  <MpText v-if="!form.columns.length" size="label" color="text.placeholder">
                    No label columns yet. Add at least one.
                  </MpText>
                  <MpText v-if="errors.columns" size="label-small" color="text.danger">
                    {{ errors.columns }}
                  </MpText>
                  <MpFlex
                    v-for="(col, i) in form.columns"
                    :key="`col-${i}`"
                    v-bind="dragRow"
                    draggable="true"
                    @dragstart="onDragStart('columns', i)"
                    @dragover.prevent
                    @drop.prevent="onDrop('columns', i)"
                    @dragend="dragging = null"
                  >
                    <MpIcon name="drag" size="sm" :class="css({ cursor: 'grab', color: 'text.placeholder' })" />
                    <MpFormControl :id="`col-name-${i}`" flex="1" minWidth="0">
                      <MpInput
                        v-model="col.name"
                        size="md"
                        placeholder="Category name…"
                        @update:model-value="syncColumnKey(col)"
                      />
                    </MpFormControl>
                    <MpButton variant="ghost" left-icon="delete" aria-label="Remove column" @click="removeColumn(i)" />
                  </MpFlex>

                  <MpButton size="sm" variant="secondary" left-icon="add" is-full-width @click="addColumn">
                    Add Label Column
                  </MpButton>
                </MpFlex>

                <!-- metric columns -->
                <MpFlex v-bind="subpanel" direction="column" gap="3" flex="1" minWidth="240px">
                  <MpFlex direction="column">
                    <MpText size="label" weight="semiBold">Value / Metric Columns (filled by user)</MpText>
                    <MpText size="label" color="text.secondary">
                      One column = a single value. Two or more = category sub-columns.
                    </MpText>
                  </MpFlex>

                  <MpText size="label" color="text.secondary">{{ metricHint }}</MpText>

                  <MpText v-if="!form.metrics.length" size="label" color="text.placeholder">
                    No value columns yet. Add at least one.
                  </MpText>
                  <MpFlex
                    v-for="(metric, i) in form.metrics"
                    :key="`metric-${i}`"
                    v-bind="dragRow"
                    direction="column"
                    alignItems="stretch"
                    gap="2"
                    draggable="true"
                    @dragstart="onDragStart('metrics', i)"
                    @dragover.prevent
                    @drop.prevent="onDrop('metrics', i)"
                    @dragend="dragging = null"
                  >
                    <MpFlex gap="2" alignItems="flex-end">
                      <MpIcon name="drag" size="sm" :class="css({ cursor: 'grab', color: 'text.placeholder', marginBottom: '10px' })" />
                      <MpFormControl :id="`metric-name-${i}`" flex="1" minWidth="0">
                        <MpFormLabel>Header</MpFormLabel>
                        <MpInput
                          v-model="metric.name"
                          size="md"
                          placeholder="e.g. Number of Injury"
                          @update:model-value="syncMetricKey(metric)"
                        />
                      </MpFormControl>
                      <MpButton variant="ghost" left-icon="delete" aria-label="Remove metric" @click="removeMetric(i)" />
                    </MpFlex>
                    <MpFlex gap="2" paddingLeft="6">
                      <MpFormControl :id="`metric-type-${i}`" flex="1" minWidth="0">
                        <MpFormLabel>Input Type</MpFormLabel>
                        <MpSelect v-model="metric.input_type" size="md" is-full-width>
                          <option v-for="opt in inputTypeOptions" :key="opt.value" :value="opt.value">
                            {{ opt.label }}
                          </option>
                        </MpSelect>
                      </MpFormControl>
                      <MpFormControl :id="`metric-unit-${i}`" flex="1" minWidth="0">
                        <MpFormLabel>Unit</MpFormLabel>
                        <MpSelect v-model="metric.unitId" size="md" placeholder="No unit" is-full-width>
                          <option value="">No unit</option>
                          <option v-for="u in units" :key="u.id" :value="u.id">{{ u.name }}</option>
                        </MpSelect>
                      </MpFormControl>
                    </MpFlex>
                  </MpFlex>

                  <MpButton size="sm" variant="secondary" left-icon="add" is-full-width @click="addMetric">
                    Add Value Column
                  </MpButton>
                </MpFlex>
              </MpFlex>
            </MpFlex>

            <!-- step 2 — rows -->
            <MpFlex v-bind="panel" direction="column" gap="4">
              <MpFlex gap="3" alignItems="flex-start">
                <MpFlex v-bind="stepBadge">2</MpFlex>
                <MpFlex direction="column" flex="1">
                  <MpText size="h3" weight="semiBold">Rows</MpText>
                  <MpText size="label" color="text.secondary">Arrange the data rows of the table.</MpText>
                </MpFlex>
                <MpButton
                  size="sm"
                  variant="secondary"
                  left-icon="add"
                  :is-disabled="!form.columns.length"
                  @click="addRow"
                >
                  Add Row
                </MpButton>
              </MpFlex>

              <MpTableContainer>
                <MpTable>
                  <MpTableHead>
                    <MpTableRow>
                      <MpTableCell scope="col" />
                      <MpTableCell v-for="(col, ci) in form.columns" :key="`h-${ci}`" scope="col">
                        {{ col.name || '(Label)' }}
                      </MpTableCell>
                      <MpTableCell scope="col" />
                    </MpTableRow>
                  </MpTableHead>
                  <MpTableBody>
                    <MpTableRow
                      v-for="(row, i) in form.rows"
                      :key="`row-${i}`"
                      draggable="true"
                      @dragstart="onDragStart('rows', i)"
                      @dragover.prevent
                      @drop.prevent="onDrop('rows', i)"
                      @dragend="dragging = null"
                    >
                      <MpTableCell as="td">
                        <MpIcon name="drag" size="sm" :class="css({ cursor: 'grab', color: 'text.placeholder' })" />
                      </MpTableCell>
                      <MpTableCell v-for="(col, ci) in form.columns" :key="`cell-${ci}`" as="td">
                        <MpInput v-model="row.labels[col.key]" size="md" placeholder="—" />
                      </MpTableCell>
                      <MpTableCell as="td">
                        <MpButton variant="ghost" left-icon="delete" aria-label="Remove row" @click="removeRow(i)" />
                      </MpTableCell>
                    </MpTableRow>
                    <MpTableRow v-if="!form.rows.length">
                      <MpTableCell as="td" :colspan="form.columns.length + 2">
                        <MpText size="label" color="text.placeholder">
                          {{ form.columns.length ? 'No rows yet — click "Add Row".' : 'Add at least one label column first.' }}
                        </MpText>
                      </MpTableCell>
                    </MpTableRow>
                  </MpTableBody>
                </MpTable>
              </MpTableContainer>
            </MpFlex>

            <MpFlex justifyContent="flex-end" gap="4">
              <MpButton variant="ghost" @click="leaveTo('list')">Cancel</MpButton>
              <MpButton variant="primary" :is-disabled="isSubmitting" @click="save">
                {{ isEdit ? 'Save changes' : 'Create indicator' }}
              </MpButton>
            </MpFlex>
          </MpFlex>

          <!-- live preview -->
          <MpFlex v-bind="panel" direction="column" gap="4" flex="1" minWidth="380px">
            <MpFlex gap="3" alignItems="flex-start">
              <MpFlex v-bind="stepBadge" backgroundColor="background.stage" color="text.secondary">
                <MpIcon name="show" size="sm" />
              </MpFlex>
              <MpFlex direction="column" flex="1">
                <MpText size="h3" weight="semiBold">Live Preview</MpText>
                <MpText size="label" color="text.secondary">How the form looks when a subsidiary fills it in.</MpText>
              </MpFlex>
              <MpFlex gap="2" alignItems="center">
                <MpBadge for="tableStatus" type="information">Period {{ previewPeriod }}</MpBadge>
                <MpButton size="sm" :variant="isClientView ? 'secondary' : 'ghost'" @click="isClientView = !isClientView">
                  Client View
                </MpButton>
              </MpFlex>
            </MpFlex>

            <MpTableContainer>
              <MpTable>
                <MpTableHead>
                  <MpTableRow>
                    <MpTableCell
                      v-for="(col, ci) in form.columns"
                      :key="`p-l-${ci}`"
                      scope="col"
                      :rowspan="hasSubColumns ? 2 : 1"
                    >
                      {{ col.name || '(Label)' }}
                    </MpTableCell>
                    <template v-if="hasSubColumns">
                      <MpTableCell scope="col" :colspan="form.metrics.length">{{ previewPeriod }}</MpTableCell>
                    </template>
                    <template v-else>
                      <MpTableCell v-for="(metric, mi) in form.metrics" :key="`p-m-${mi}`" scope="col">
                        {{ metricHeader(metric) }}
                        <MpText v-if="!isClientView" size="label" color="text.secondary">
                          {{ inputTypeLabel(metric.input_type) }}
                        </MpText>
                      </MpTableCell>
                    </template>
                  </MpTableRow>
                  <MpTableRow v-if="hasSubColumns">
                    <MpTableCell v-for="(metric, mi) in form.metrics" :key="`p-s-${mi}`" scope="col">
                      {{ metricHeader(metric) }}
                      <MpText v-if="!isClientView" size="label" color="text.secondary">
                        {{ inputTypeLabel(metric.input_type) }}
                      </MpText>
                    </MpTableCell>
                  </MpTableRow>
                </MpTableHead>
                <MpTableBody>
                  <MpTableRow v-for="(row, i) in form.rows" :key="`p-row-${i}`">
                    <MpTableCell v-for="(col, ci) in form.columns" :key="`p-c-${ci}`" as="td">
                      {{ row.labels[col.key] || '—' }}
                    </MpTableCell>
                    <MpTableCell v-for="(metric, mi) in form.metrics" :key="`p-v-${mi}`" as="td">
                      <DynamicFieldInput
                        :input_type="metric.input_type"
                        :unit="unitName(metric.unitId)"
                        :model-value="previewValues[`${i}:${mi}`] ?? null"
                        @update:model-value="previewValues[`${i}:${mi}`] = $event"
                      />
                    </MpTableCell>
                  </MpTableRow>
                  <MpTableRow v-if="!form.rows.length">
                    <MpTableCell as="td" :colspan="form.columns.length + form.metrics.length || 1">
                      <MpText size="label" color="text.placeholder">No data yet.</MpText>
                    </MpTableCell>
                  </MpTableRow>
                </MpTableBody>
              </MpTable>
            </MpTableContainer>
          </MpFlex>
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

    <MpModal :is-open="Boolean(pendingLeave)" size="md" @close="pendingLeave = null">
      <MpModalContent>
        <MpModalHeader>
          Discard unsaved changes?
          <MpModalCloseButton />
        </MpModalHeader>
        <MpModalBody>
          <MpText size="label">
            You have edits that haven't been saved. Leaving this page discards them.
          </MpText>
        </MpModalBody>
        <MpModalFooter>
          <MpButtonGroup>
            <MpButton variant="ghost" @click="pendingLeave = null">Keep editing</MpButton>
            <MpButton variant="danger" @click="confirmLeave">Discard changes</MpButton>
          </MpButtonGroup>
        </MpModalFooter>
      </MpModalContent>
      <MpModalOverlay />
    </MpModal>
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
  MpIcon,
  MpSkeleton,
  MpTable,
  MpTableHead,
  MpTableBody,
  MpTableRow,
  MpTableCell,
  MpTableContainer,
  MpBanner,
  MpBannerDescription,
  MpFormErrorMessage,
  MpButtonGroup,
  MpModal,
  MpModalContent,
  MpModalHeader,
  MpModalBody,
  MpModalFooter,
  MpModalOverlay,
  MpModalCloseButton,
  css,
  toast,
} from '@mekari/pixel3'
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal.vue'
import DynamicFieldInput from '@/components/DynamicFieldInput.vue'
import {
  useMkiGriQuantitativeDetail,
  useCreateMkiGriQuantitative,
  useUpdateMkiGriQuantitative,
  useDeleteMkiGriQuantitative,
} from '@/services/master-key-indicator-quantitative'
import { useGetMasterCategory } from '@/services/master-category'
import { useGetMasterGri } from '@/services/master-gri'
import { useGetMasterUnit } from '@/services/master-unit'

// Shared chrome for the three step panels — repeated v-bind beats three near-identical wrappers.
const panel = {
  backgroundColor: 'background.surface',
  borderWidth: '1px',
  borderColor: 'border.default',
  rounded: 'md',
  padding: '20px',
  height: 'fit-content',
} as const

// The two column editors inside step 1 — quieter than `panel` so they read as nested.
const subpanel = {
  backgroundColor: 'background.stage',
  borderWidth: '1px',
  borderColor: 'border.subtle',
  rounded: 'md',
  padding: '16px',
} as const

const stepBadge = {
  alignItems: 'center',
  justifyContent: 'center',
  width: '24px',
  height: '24px',
  rounded: 'full',
  backgroundColor: 'background.brand',
  color: 'text.inverted',
  flexShrink: '0',
} as const

const dragRow = {
  gap: '2',
  alignItems: 'center',
  padding: '2',
  rounded: 'sm',
  borderWidth: '1px',
  borderColor: 'border.subtle',
  backgroundColor: 'background.surface',
} as const

const inputTypeOptions: { value: MkiQuantInputType; label: string }[] = [
  { value: 'NUMBER', label: 'Number' },
  { value: 'PERCENTAGE', label: 'Percentage' },
  { value: 'TEXT', label: 'Text' },
  { value: 'DATE', label: 'Date' },
  { value: 'YES_NO', label: 'Yes / No' },
]

function inputTypeLabel(type: MkiQuantInputType) {
  return inputTypeOptions.find((opt) => opt.value === type)?.label ?? type
}

// ponytail: the period belongs to the submission, not to the schema — the builder never sends it.
// It is shown in the preview only so the header hierarchy reads the way the filled form will.
const previewPeriod = String(new Date().getFullYear())

const route = useRoute()
const router = useRouter()

const id = route.query.id as string | undefined
const isEdit = computed(() => Boolean(id))
const isConfirmingDelete = ref(false)
const isClientView = ref(false)

const { data: categoryData } = useGetMasterCategory()
const categories = computed(() => categoryData.value ?? [])

const { data: griData } = useGetMasterGri()
const griCodes = computed(() => (griData.value ?? []).filter((g) => g.status === 'Active'))

const { data: unitData } = useGetMasterUnit()
const units = computed(() => unitData.value ?? [])

const { data: detail, isLoading: isFetching, isError: isFetchError } = useMkiGriQuantitativeDetail(id)
const isLoading = computed(() => isEdit.value && isFetching.value)
const isLoadError = computed(() => isEdit.value && isFetchError.value)
// no status field on the endpoint yet — see the ponytail note on MkiGriQuantitative.status
const status = computed(() => detail.value?.status ?? 'Active')

// Accountability line next to the status badge. The Index contract carries updated_by as a bare
// numeric id with no name/email anywhere in the payload, so there is nothing to resolve it to —
// only the "when" is shown. Add the "who" once BE ships an updated_by_user object.
const lastUpdatedLabel = computed(() => {
  const at = detail.value?.updated_at ?? detail.value?.created_at
  if (!at) return ''
  const stamp = new Date(at).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  return `Last updated ${stamp}`
})

type FormColumn = { key: string; name: string }
type FormMetric = { key: string; name: string; input_type: MkiQuantInputType; unitId: string }
type FormRow = { labels: Record<string, string> }

const form = reactive({
  categoryId: '',
  code: '',
  description: '',
  columns: [] as FormColumn[],
  metrics: [] as FormMetric[],
  rows: [] as FormRow[],
})

// ponytail: preview-only scratch values keyed `rowIndex:metricIndex`, never part of the payload —
// the schema builder configures the table, the subsidiary submission fills it.
const previewValues = reactive<Record<string, string | number | boolean | null>>({})

// Validation runs on submit only, never per keystroke. `hasSubmitted` is the gate: before the first
// Save the form shows no red at all, after it the errors recompute live so fixing a field clears it.
const hasSubmitted = ref(false)

const validationErrors = computed(() => {
  const found: Record<string, string> = {}
  if (!form.categoryId) found.categoryId = 'Select a category.'
  if (!form.code) found.code = 'Select a GRI code.'
  if (!form.description.trim()) found.description = 'Enter a description.'
  if (!form.columns.length) found.columns = 'Add at least one label column.'
  return found
})

const errors = computed(() => (hasSubmitted.value ? validationErrors.value : {}))
const hasErrors = computed(() => Object.keys(errors.value).length > 0)
const isSubmitting = ref(false)

// Unsaved-changes guard, edit form only — a create form starts empty, so "discard" has no meaning
// there. Comparing a serialized snapshot against the last-loaded one is enough: the form is small
// plain data, and it correctly reports "clean" when the user undoes their own edit.
function snapshot() {
  return JSON.stringify(form)
}

const pristine = ref(snapshot())
const isDirty = computed(() => isEdit.value && snapshot() !== pristine.value)

type LeaveTarget = 'back' | 'list'
const pendingLeave = ref<LeaveTarget | null>(null)

function navigate(target: LeaveTarget) {
  if (target === 'back') router.back()
  else router.push('/master-key-indicator-quantitative')
}

// Every way off this page (back button, breadcrumb, Cancel) routes through here so the guard
// cannot be walked around by picking a different exit.
function leaveTo(target: LeaveTarget) {
  if (isDirty.value) {
    pendingLeave.value = target
    return
  }
  navigate(target)
}

function confirmLeave() {
  const target = pendingLeave.value
  pendingLeave.value = null
  if (target) navigate(target)
}

const hasSubColumns = computed(() => form.metrics.length >= 2)

const metricHint = computed(() =>
  hasSubColumns.value
    ? `${form.metrics.length} value columns → rendered as sub-columns under the ${previewPeriod} period header.`
    : 'One value column. Add another to create category sub-columns (e.g. Male / Female).',
)

function metricHeader(metric: FormMetric) {
  return metric.name || '(Metric)'
}

function unitName(unitId: string) {
  return units.value.find((u) => u.id === unitId)?.name ?? null
}

// ponytail: naive slugify, no collision handling — fine for a schema builder
function slugify(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

// Row labels are keyed by column key, and the key is derived from the (editable) column name — so a
// rename has to carry the already-typed row values across, or every keystroke silently drops them.
function syncColumnKey(col: FormColumn) {
  const previous = col.key
  const next = slugify(col.name)
  if (next === previous) return
  col.key = next
  form.rows.forEach((row) => {
    if (previous && previous in row.labels) {
      row.labels[next] = row.labels[previous]
      delete row.labels[previous]
    } else if (!(next in row.labels)) {
      row.labels[next] = ''
    }
  })
}

function syncMetricKey(metric: FormMetric) {
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

// Drag-to-reorder for all three lists. Order is positional — `sequence` is stamped from the array
// index in buildPayload(), so a drop is all it takes to renumber.
type DragList = 'columns' | 'metrics' | 'rows'
const dragging = ref<{ list: DragList; index: number } | null>(null)

function onDragStart(list: DragList, index: number) {
  dragging.value = { list, index }
}

function onDrop(list: DragList, index: number) {
  const from = dragging.value
  dragging.value = null
  if (!from || from.list !== list || from.index === index) return
  const arr = form[list] as unknown[]
  const [moved] = arr.splice(from.index, 1)
  arr.splice(index, 0, moved)
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
    pristine.value = snapshot()
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
  hasSubmitted.value = true
  if (Object.keys(validationErrors.value).length) return

  // A rejected mutation used to escape as an unhandled promise: the toast and the redirect were
  // skipped and the user saw literally nothing happen after clicking Save.
  isSubmitting.value = true
  try {
    if (isEdit.value && id) {
      await updateMutation.mutateAsync({ ...buildPayload(), id })
      toast.notify({ id: 'mki-update', variant: 'success', title: 'Indicator updated.' })
    } else {
      await createMutation.mutateAsync(buildPayload())
      toast.notify({ id: 'mki-create', variant: 'success', title: 'Indicator created.' })
    }
  } catch {
    toast.notify({ id: 'mki-save-error', variant: 'error', title: "Couldn't save the indicator. Please try again." })
    return
  } finally {
    isSubmitting.value = false
  }

  // Clear the dirty flag before routing, otherwise a successful save trips the unsaved-changes guard.
  pristine.value = snapshot()
  router.push('/master-key-indicator-quantitative')
}

async function confirmDelete() {
  if (!id) return
  try {
    await deleteMutation.mutateAsync(id)
  } catch {
    isConfirmingDelete.value = false
    toast.notify({ id: 'mki-delete-error', variant: 'error', title: "Couldn't delete the indicator. Please try again." })
    return
  }
  isConfirmingDelete.value = false
  pristine.value = snapshot()
  router.push('/master-key-indicator-quantitative')
}
</script>

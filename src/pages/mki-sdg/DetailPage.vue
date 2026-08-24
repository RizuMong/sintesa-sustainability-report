<template>
  <MpFlex direction="column" backgroundColor="background.surface" minHeight="100vh">
    <MpFlex justifyContent="space-between" alignItems="center" paddingX="24px" paddingY="24px">
      <MpFlex direction="row" gap="3">
        <MpButton variant="ghost" left-icon="arrows-left" aria-label="Back" @click="router.back()" />
        <MpFlex direction="column" alignItems="flex-start">
          <MpButton variant="textLink" as="a" href="#/mki-sdg">SDG — Indicator</MpButton>
          <MpText as="h1" size="h1">{{ isEdit ? form.indicatorName || 'Edit' : 'Create' }}</MpText>
        </MpFlex>
      </MpFlex>
      <MpButton
        v-if="isEdit && !isReadOnly && !form.locked"
        variant="ghost"
        left-icon="delete"
        @click="isConfirmingDelete = true"
      >
        Delete
      </MpButton>
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

      <MpFlex v-else direction="column" gap="6" flex="1" maxWidth="640px">
        <MpBanner v-if="isReadOnly" variant="info">
          <MpBannerDescription>
            Created by Subsidiary ({{ form.originEntityName || 'unknown entity' }}). Platform Administrator has
            Read-Only visibility over Subsidiary-created SDG indicators — see FSD 1.8.
          </MpBannerDescription>
        </MpBanner>
        <MpBanner v-else-if="form.locked" variant="warning">
          <MpBannerDescription>
            This indicator is used in a Published template — Input Type can't be changed and it can't be deleted.
          </MpBannerDescription>
        </MpBanner>

        <MpFormControl id="mki-sdg-name" is-required :is-disabled="isReadOnly">
          <MpFormLabel>Indicator Name</MpFormLabel>
          <MpInput v-model="form.indicatorName" placeholder="e.g. Energy Consumption Reduction" :is-disabled="isReadOnly" />
        </MpFormControl>

        <MpFormControl id="mki-sdg-code" is-required :is-invalid="Boolean(codeError)" :is-disabled="isReadOnly">
          <MpFormLabel>Variable Code</MpFormLabel>
          <MpInput
            v-model="form.variableCode"
            placeholder="e.g. ENERGY_CONSUMPTION_REDUCTION"
            :is-disabled="isReadOnly"
            @update:model-value="(v: string) => (form.variableCode = v.toUpperCase())"
          />
          <MpFormErrorMessage v-if="codeError">{{ codeError }}</MpFormErrorMessage>
        </MpFormControl>

        <MpFlex gap="6">
          <MpFormControl id="mki-sdg-input-type" is-required flex="1" :is-disabled="isReadOnly || form.locked">
            <MpFormLabel>Input Type</MpFormLabel>
            <MpSelect v-model="form.inputType" is-full-width :is-disabled="isReadOnly || form.locked">
              <option v-for="opt in inputTypeOptions" :key="opt" :value="opt">{{ opt }}</option>
            </MpSelect>
          </MpFormControl>
          <MpFormControl id="mki-sdg-evidence" is-required flex="1" :is-disabled="isReadOnly">
            <MpFormLabel>Evidence Attachment</MpFormLabel>
            <MpSelect v-model="form.evidenceAttachment" is-full-width :is-disabled="isReadOnly">
              <option value="Optional">Optional</option>
              <option value="Required">Required</option>
            </MpSelect>
          </MpFormControl>
        </MpFlex>

        <MpFormControl id="mki-sdg-unit" is-required :is-disabled="isReadOnly">
          <MpFormLabel>Unit</MpFormLabel>
          <MpSelect v-model="form.unitId" placeholder="Select unit" is-full-width :is-disabled="isReadOnly">
            <option value="" disabled>Select unit</option>
            <option v-for="u in units" :key="u.id" :value="u.id">{{ u.name }}</option>
          </MpSelect>
        </MpFormControl>

        <MpFlex v-if="!isReadOnly">
          <MpButton :is-disabled="!canSave" @click="save">{{ isEdit ? 'Update' : 'Create' }}</MpButton>
        </MpFlex>
      </MpFlex>
    </MpFlex>

    <ConfirmDeleteModal
      :is-open="isConfirmingDelete"
      title="Delete this?"
      message="This will set the status to Inactive. It can still be viewed and re-activated."
      @close="isConfirmingDelete = false"
      @confirm="confirmDelete"
    />
  </MpFlex>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  MpFlex,
  MpText,
  MpButton,
  MpInput,
  MpSelect,
  MpFormControl,
  MpFormLabel,
  MpFormErrorMessage,
  MpBanner,
  MpBannerDescription,
  MpSkeleton,
  toast,
} from '@mekari/pixel3'
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal.vue'
import { useCreateMkiSdg, useGetMkiSdgList, useRemoveMkiSdg, useUpdateMkiSdg } from '@/services/mki-sdg'
import { isSnakeCaseCode } from '@/services/mki-sdg/rules'
import { masterUnitApi } from '@/services/master-unit'

const inputTypeOptions: MkiInputType[] = ['Number', 'Text', 'Percentage', 'Boolean']

const route = useRoute()
const router = useRouter()

const id = route.query.id as string | undefined
const isEdit = computed(() => Boolean(id))
const isConfirmingDelete = ref(false)

const units = ref<MasterUnit[]>([])
const { data: list, isPending: isListLoading } = useGetMkiSdgList()
const createMutation = useCreateMkiSdg()
const updateMutation = useUpdateMkiSdg()
const removeMutation = useRemoveMkiSdg()

const isLoading = computed(() => isListLoading.value || unitsLoading.value)
const unitsLoading = ref(true)

const form = reactive({
  indicatorName: '',
  variableCode: '',
  inputType: 'Number' as MkiInputType,
  evidenceAttachment: 'Optional' as MkiEvidenceAttachment,
  unitId: '',
  createdByLevel: 'Holding' as MkiCreatedByLevel,
  originEntityName: '',
  locked: false,
})

// Platform Administrator gets full CRUD over Holding-created indicators, Read-Only over
// Subsidiary-created ones (FSD 1.8, AC-29) — that create flow belongs to a different portal.
const isReadOnly = computed(() => isEdit.value && form.createdByLevel === 'Subsidiary')

const codeError = computed(() => {
  const code = form.variableCode.trim()
  if (!code) return null
  if (!isSnakeCaseCode(code)) return 'Must be UPPER_SNAKE_CASE, e.g. ENERGY_CONSUMPTION_REDUCTION.'
  const duplicate = (list.value ?? []).some((item) => item.variable_code === code && item.id !== id)
  if (duplicate) return 'This Variable Code is already used by another indicator.'
  return null
})

const canSave = computed(
  () =>
    Boolean(form.indicatorName && form.variableCode && form.unitId && !codeError.value) && !isReadOnly.value,
)

function populateForm(item: MkiSdg) {
  form.indicatorName = item.indicator_name
  form.variableCode = item.variable_code
  form.inputType = item.input_type
  form.evidenceAttachment = item.evidence_attachment
  form.unitId = item.unit?.id ?? ''
  form.createdByLevel = item.created_by_level
  form.originEntityName = item.origin_entity?.name ?? ''
  form.locked = item.locked
}

onMounted(async () => {
  units.value = await masterUnitApi.getMasterUnit()
  unitsLoading.value = false

  if (id) {
    const found = (list.value ?? []).find((item) => item.id === id)
    if (found) populateForm(found)
  }
})

async function save() {
  if (!canSave.value) return
  const payload = {
    indicator_name: form.indicatorName,
    variable_code: form.variableCode,
    unit: form.unitId ? { id: form.unitId } : null,
    input_type: form.inputType,
    evidence_attachment: form.evidenceAttachment,
  }

  if (isEdit.value && id) {
    await updateMutation.mutateAsync({ ...payload, id })
    toast.notify({ id: 'mki-sdg-update', variant: 'success', title: 'Indicator updated.' })
  } else {
    await createMutation.mutateAsync(payload)
    toast.notify({ id: 'mki-sdg-create', variant: 'success', title: 'Indicator created.' })
  }
  router.push('/mki-sdg')
}

async function confirmDelete() {
  if (!id) return
  await removeMutation.mutateAsync({ id })
  isConfirmingDelete.value = false
  router.push('/mki-sdg')
}
</script>

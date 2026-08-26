<template>
  <MpFlex direction="column" backgroundColor="background.surface" minHeight="100vh">
    <MpFlex justifyContent="space-between" alignItems="center" paddingX="24px" paddingY="24px">
      <MpFlex direction="row" gap="3">
        <MpButton variant="ghost" left-icon="arrows-left" aria-label="Back" @click="router.back()" />
        <MpFlex direction="column" alignItems="flex-start">
          <MpButton variant="textLink" as="a" href="#/report-plan-realization">Report Plan Realization</MpButton>
          <MpText as="h1" size="h1">{{ item?.action_indicator.name || 'Realization' }}</MpText>
        </MpFlex>
      </MpFlex>
    </MpFlex>

    <MpFlex
      direction="column"
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
        <MpSkeleton v-for="i in 3" :key="i" height="56px" rounded="md" />
      </MpFlex>

      <MpFlex v-else-if="item" direction="column" gap="6" maxWidth="640px">
        <MpBanner v-if="item.flow_status === 'rejected'" variant="warning">
          <MpBannerDescription>Rejected — {{ item.reviewer_notes || 'No reviewer notes.' }}</MpBannerDescription>
        </MpBanner>
        <MpBanner v-else-if="!isReadOnly && !isWindowOpen" variant="warning">
          <MpBannerDescription>
            Realization Window for {{ item.period_id.name }} is closed — submission is disabled until Master Period
            reopens it.
          </MpBannerDescription>
        </MpBanner>

        <MpFormControl id="realization-period">
          <MpFormLabel>Period</MpFormLabel>
          <MpText size="label">{{ item.period_id.name }}</MpText>
        </MpFormControl>

        <MpFormControl id="realization-indicator">
          <MpFormLabel>Action Indicator</MpFormLabel>
          <MpText size="label">{{ item.action_indicator.name }}</MpText>
        </MpFormControl>

        <MpFormControl id="realization-value" is-required :is-disabled="isReadOnly">
          <MpFormLabel>Value</MpFormLabel>
          <DynamicFieldInput
            v-model="form.value"
            :input_type="item.action_indicator.input_type"
            :disabled="isReadOnly"
          />
        </MpFormControl>

        <MpFormControl
          v-if="item.action_indicator.evidence === 'Required'"
          id="realization-evidence"
          is-required
          :is-disabled="isReadOnly"
        >
          <MpFormLabel>Evidence Attachment</MpFormLabel>
          <!-- ponytail: no Mp file-upload component in this codebase yet — native input as a
               pragmatic fallback, accept/size validated via isAllowedEvidenceFile. Upload/storage
               of the file itself is unconfirmed backend contract; we only track the filename. -->
          <input type="file" accept=".pdf,.jpg,.jpeg,.png,.docx,.csv" :disabled="isReadOnly" @change="onFileChange" />
          <MpText v-if="form.evidenceFileName" size="label-small" color="text.secondary">
            {{ form.evidenceFileName }}
          </MpText>
          <MpFormErrorMessage v-if="evidenceError">{{ evidenceError }}</MpFormErrorMessage>
        </MpFormControl>

        <MpFlex v-if="!isReadOnly">
          <MpButton :is-disabled="!canSave" @click="save">Submit</MpButton>
        </MpFlex>
      </MpFlex>
    </MpFlex>
  </MpFlex>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  MpFlex,
  MpText,
  MpButton,
  MpFormControl,
  MpFormLabel,
  MpFormErrorMessage,
  MpBanner,
  MpBannerDescription,
  MpSkeleton,
  toast,
} from '@mekari/pixel3'
import DynamicFieldInput from '@/components/DynamicFieldInput.vue'
import {
  useReportPlanRealizationDetail,
  useUpdateReportPlanRealization,
  useSubmitReportPlanRealization,
  isRealizationWindowOpen,
  isEditableRealization,
  canSubmitRealization,
} from '@/services/report-plan-realization'
import { isAllowedEvidenceFile } from '@/lib/dynamic-validation'
import { useGetMasterPeriod } from '@/services/master-period'

const route = useRoute()
const router = useRouter()
const id = computed(() => route.query.id as string | undefined)

const { data: item, isLoading: isItemLoading } = useReportPlanRealizationDetail(id)
const { data: periods, isLoading: isPeriodsLoading } = useGetMasterPeriod()
const isLoading = computed(() => isItemLoading.value || isPeriodsLoading.value)

const activePeriod = computed(() => (periods.value ?? []).find((p) => p.id === item.value?.period_id.id))
const isWindowOpen = computed(() => isRealizationWindowOpen(activePeriod.value))
const isReadOnly = computed(() => (item.value ? !isEditableRealization(item.value.flow_status) : true))

const form = reactive({ value: '', evidenceFileName: '' })
const evidenceFile = ref<File | null>(null)
const evidenceError = ref('')

function populateForm(realization: RealizationReport) {
  form.value = realization.value
  form.evidenceFileName = realization.evidence_url ? realization.evidence_url.split('/').pop() ?? '' : ''
}

watch(item, (realization) => {
  if (realization) populateForm(realization)
}, { immediate: true })

function onFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0] ?? null
  evidenceError.value = ''
  if (!file) return
  if (!isAllowedEvidenceFile(file.name, file.size)) {
    evidenceError.value = 'File must be pdf, jpg, png, docx or csv and at most 4MB.'
    evidenceFile.value = null
    form.evidenceFileName = ''
    return
  }
  evidenceFile.value = file
  form.evidenceFileName = file.name
}

const canSave = computed(() => {
  if (!item.value) return false
  return canSubmitRealization({
    windowOpen: isWindowOpen.value,
    editable: !isReadOnly.value,
    inputType: item.value.action_indicator.input_type,
    value: form.value,
    evidenceRequired: item.value.action_indicator.evidence === 'Required',
    hasEvidence: Boolean(form.evidenceFileName),
  })
})

const updateMutation = useUpdateReportPlanRealization()
const submitMutation = useSubmitReportPlanRealization()

async function save() {
  if (!canSave.value || !item.value) return
  // ponytail: evidence file upload storage is an unconfirmed backend contract — sending the
  // filename as a stand-in for evidence_url until a real upload endpoint exists.
  await updateMutation.mutateAsync({
    id: item.value.id,
    value: form.value,
    evidence_url: evidenceFile.value ? evidenceFile.value.name : item.value.evidence_url,
  })
  await submitMutation.mutateAsync({ id: item.value.id })
  toast.notify({ id: 'report-plan-realization-submit', variant: 'success', title: 'Realization submitted.' })
  router.push('/report-plan-realization')
}
</script>

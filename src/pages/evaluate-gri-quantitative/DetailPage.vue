<template>
  <MpFlex direction="column" backgroundColor="background.surface" minHeight="100vh">
    <MpFlex justifyContent="space-between" alignItems="center" paddingX="24px" paddingY="24px">
      <MpFlex direction="row" gap="3">
        <MpButton variant="ghost" left-icon="arrows-left" aria-label="Back" @click="router.back()" />
        <MpFlex direction="column" alignItems="flex-start">
          <MpButton variant="textLink" as="a" href="#/evaluate-gri-quantitative/requestor">
            Evaluate GRI Quantitative
          </MpButton>
          <MpFlex alignItems="center" gap="3">
            <MpText as="h1" size="h1">{{ detail?.template_id.name ?? 'Loading...' }}</MpText>
            <MpBadge v-if="detail" for="tableStatus" :type="statusBadgeType[detail.flow_status] ?? 'information'">
              {{ detail.flow_status }}
            </MpBadge>
          </MpFlex>
        </MpFlex>
      </MpFlex>
      <MpFlex v-if="detail && !readOnly" gap="3">
        <MpButton v-if="detail.flow_status === 'draft'" variant="ghost" left-icon="delete" @click="isConfirmingDelete = true">
          Delete
        </MpButton>
        <MpButton variant="ghost" :is-disabled="isSaving" @click="save">Save draft</MpButton>
        <MpButton :is-disabled="!canSubmitForm || isSaving || isSubmitting" @click="submit">Submit</MpButton>
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

      <MpFlex v-else-if="detail" direction="column" gap="6">
        <MpFlex
          v-if="detail.flow_status === 'rejected' && rejectionNote"
          direction="column"
          gap="1"
          padding="16px"
          backgroundColor="background.surface"
          borderWidth="1px"
          borderColor="border.default"
          rounded="md"
        >
          <MpFlex alignItems="center" gap="2">
            <MpBadge for="tableStatus" type="critical">rejected</MpBadge>
            <MpText size="label" weight="semiBold">Reviewer note</MpText>
          </MpFlex>
          <MpText size="label">{{ rejectionNote }}</MpText>
        </MpFlex>

        <MpFlex gap="6">
          <MpFormControl id="detail-entity" is-disabled flex="1">
            <MpFormLabel>Entity</MpFormLabel>
            <MpInput :model-value="detail.entity_id.name" is-disabled />
          </MpFormControl>
          <MpFormControl id="detail-period" is-disabled flex="1">
            <MpFormLabel>Period</MpFormLabel>
            <MpInput :model-value="String(detail.period_id.name)" is-disabled />
          </MpFormControl>
        </MpFlex>

        <MpFlex v-for="item in matrix" :key="item.id" direction="column" gap="3">
          <MpText size="h3" weight="semiBold">{{ item.name }}</MpText>

          <MpTableContainer>
            <MpTable>
              <MpTableHead>
                <MpTableRow>
                  <MpTableCell v-for="col in item.columns" :key="col.key" scope="col">{{ col.name }}</MpTableCell>
                  <MpTableCell scope="col">Value</MpTableCell>
                </MpTableRow>
              </MpTableHead>
              <MpTableBody>
                <MpTableRow v-for="row in item.rows" :key="row.sequence">
                  <MpTableCell v-for="col in item.columns" :key="col.key" as="td" scope="row">
                    {{ row.labels[col.key] }}
                  </MpTableCell>
                  <MpTableCell as="td" scope="row">
                    <DynamicFieldInput
                      :input_type="item.input_type ?? 'Number'"
                      :unit="item.unit"
                      v-model="row.value"
                      :disabled="readOnly"
                    />
                  </MpTableCell>
                </MpTableRow>
              </MpTableBody>
            </MpTable>
          </MpTableContainer>

          <MpFormControl v-if="item.evidence_attachment === 'Required'" :id="`evidence-${item.id}`" is-required>
            <MpFormLabel>Evidence (pdf, jpg, png, docx, csv — max 4MB)</MpFormLabel>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.docx,.csv"
              :disabled="readOnly"
              @change="(e) => onEvidenceChange(item.id, e)"
            />
            <MpFormErrorMessage v-if="evidenceErrors[item.id]">{{ evidenceErrors[item.id] }}</MpFormErrorMessage>
            <MpText v-else-if="evidenceFiles[item.id]" size="label-small" color="text.secondary">
              {{ evidenceFiles[item.id]?.name }}
            </MpText>
          </MpFormControl>
        </MpFlex>
      </MpFlex>
    </MpFlex>

    <ConfirmDeleteModal
      :is-open="isConfirmingDelete"
      title="Delete this submission?"
      message="This will permanently remove the draft submission. This action cannot be undone."
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
  MpFormControl,
  MpFormLabel,
  MpFormErrorMessage,
  MpSkeleton,
  MpTable,
  MpTableHead,
  MpTableBody,
  MpTableRow,
  MpTableCell,
  MpTableContainer,
  toast,
} from '@mekari/pixel3'
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal.vue'
import DynamicFieldInput from '@/components/DynamicFieldInput.vue'
import { isAllowedEvidenceFile, canSubmit as canSubmitEvidence } from '@/lib/dynamic-validation'
import {
  useGetEvaluateGriQuantitativeDetail,
  useUpdateEvaluateGriQuantitative,
  useSubmitEvaluateGriQuantitative,
  useDeleteEvaluateGriQuantitative,
  isReadOnly,
  latestRejectionNote,
} from '@/services/evaluate-gri-quantitative'

const statusBadgeType: Record<SubmissionFlowStatus, 'announcement' | 'information' | 'completed' | 'critical'> = {
  draft: 'announcement',
  submitted: 'information',
  approved: 'completed',
  rejected: 'critical',
  cancelled: 'announcement',
}

const route = useRoute()
const router = useRouter()
const id = computed(() => route.query.id as string | undefined)

const { data: detail, isLoading } = useGetEvaluateGriQuantitativeDetail(id)

const readOnly = computed(() => !detail.value || isReadOnly(detail.value.flow_status))
const rejectionNote = computed(() => (detail.value ? latestRejectionNote(detail.value.approval_logs) : null))

// local editable copy of the matrix — cloned from the fetched detail so the form doesn't mutate query cache directly
const matrix = reactive<EvaluateGriQuantitativeItem[]>([])
watch(
  detail,
  (next) => {
    const cloned = next ? structuredClone(next.items) : []
    for (const item of cloned) {
      for (const row of item.rows) row.value ??= null
    }
    matrix.splice(0, matrix.length, ...cloned)
  },
  { immediate: true },
)

// evidence_attachment === 'Required' — file uploader per item, Submit disabled until attached (§4)
// ponytail: no confirmed evidence-upload endpoint in api/Evaluate GRI - Quantitative/*.yml (create/
// update only take template_id/period_id/entity_id/items, no file field) — the file is validated and
// gates Submit client-side but isn't sent anywhere yet. Wire it once an upload endpoint exists.
const evidenceFiles = reactive<Record<string, File | undefined>>({})
const evidenceErrors = reactive<Record<string, string | undefined>>({})

function onEvidenceChange(itemId: string, event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (!isAllowedEvidenceFile(file.name, file.size)) {
    evidenceErrors[itemId] = 'File must be pdf, jpg, png, docx or csv, max 4MB.'
    evidenceFiles[itemId] = undefined
    return
  }
  evidenceErrors[itemId] = undefined
  evidenceFiles[itemId] = file
}

const canSubmitForm = computed(() =>
  matrix.every((item) => canSubmitEvidence(item.evidence_attachment ?? 'Optional', Boolean(evidenceFiles[item.id]))),
)

const updateMutation = useUpdateEvaluateGriQuantitative()
const submitMutation = useSubmitEvaluateGriQuantitative()
const deleteMutation = useDeleteEvaluateGriQuantitative()
const isSaving = computed(() => updateMutation.isPending.value)
const isSubmitting = computed(() => submitMutation.isPending.value)
const isConfirmingDelete = ref(false)

async function save() {
  if (!detail.value) return
  await updateMutation.mutateAsync({
    id: detail.value.id,
    template_id: detail.value.template_id,
    period_id: detail.value.period_id,
    entity_id: detail.value.entity_id,
    items: matrix,
  })
  toast.notify({ id: 'evaluate-save', variant: 'success', title: 'Draft saved.' })
}

async function submit() {
  if (!detail.value || !canSubmitForm.value) return
  await save()
  await submitMutation.mutateAsync(detail.value.id)
  toast.notify({ id: 'evaluate-submit', variant: 'success', title: 'Submission sent for approval.' })
}

async function confirmDelete() {
  if (!detail.value) return
  await deleteMutation.mutateAsync(detail.value.id)
  isConfirmingDelete.value = false
  router.push('/evaluate-gri-quantitative/requestor')
}
</script>

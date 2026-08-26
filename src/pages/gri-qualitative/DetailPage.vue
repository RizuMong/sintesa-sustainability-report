<template>
  <MpFlex direction="column" backgroundColor="background.surface" minHeight="100vh">
    <MpFlex justifyContent="space-between" alignItems="center" paddingX="24px" paddingY="24px">
      <MpFlex direction="row" gap="3">
        <MpButton variant="ghost" left-icon="arrows-left" aria-label="Back" @click="router.back()" />
        <MpFlex direction="column" alignItems="flex-start">
          <MpButton variant="textLink" as="a" href="#/gri-qualitative">GRI Submission — Qualitative</MpButton>
          <MpFlex alignItems="center" gap="3">
            <MpText as="h1" size="h1">{{ submission?.template_id.name ?? 'Loading...' }}</MpText>
            <MpBadge v-if="submission" for="tableStatus" :type="statusBadgeType[submission.flow_status]">
              {{ submission.flow_status }}
            </MpBadge>
          </MpFlex>
        </MpFlex>
      </MpFlex>
      <MpFlex v-if="submission && !isLocked" gap="3">
        <MpButton variant="ghost" :is-disabled="isSaving" @click="saveDraft">Save draft</MpButton>
        <MpButton :is-disabled="!canSubmit || isSaving" @click="submit">Submit</MpButton>
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
        <MpSkeleton v-for="i in 4" :key="i" height="56px" rounded="md" />
      </MpFlex>

      <MpFlex v-else-if="submission" direction="column" gap="6" maxWidth="720px">
        <MpBanner v-if="isLocked" variant="information">
          <MpBannerDescription>This submission has been submitted and is read-only.</MpBannerDescription>
        </MpBanner>

        <MpFlex gap="6">
          <MpFormControl id="qual-entity" is-disabled flex="1">
            <MpFormLabel>Entity</MpFormLabel>
            <MpInput :model-value="submission.entity_id.name" is-disabled />
          </MpFormControl>
          <MpFormControl id="qual-period" is-disabled flex="1">
            <MpFormLabel>Period</MpFormLabel>
            <MpInput :model-value="submission.period_id.name" is-disabled />
          </MpFormControl>
        </MpFlex>

        <MpDivider />

        <MpFlex v-for="disclosure in submission.disclosures" :key="disclosure.id" direction="column" gap="4">
          <MpText size="h3" weight="semiBold">{{ disclosure.gri_code }} — {{ disclosure.disclosure_title }}</MpText>

          <MpFlex
            v-for="question in disclosure.questions"
            :key="question.id"
            direction="column"
            gap="3"
            padding="16px"
            borderWidth="1px"
            borderColor="border.default"
            rounded="md"
            backgroundColor="background.surface"
          >
            <MpText size="label" weight="semiBold">{{ question.title }}</MpText>

            <MpFormControl :id="`answer-${question.id}`" is-required>
              <MpFormLabel>Answer</MpFormLabel>
              <MpFlex alignItems="center" gap="2">
                <MpToggle
                  :is-checked="question.answer === true"
                  :is-disabled="isLocked"
                  @update:is-checked="(v: boolean) => (question.answer = v)"
                />
                <MpText size="label">{{ question.answer === null ? 'Not yet answered' : question.answer ? 'Ya' : 'Tidak' }}</MpText>
              </MpFlex>
            </MpFormControl>

            <MpFormControl v-if="textareaLabelFor(question)" :id="`note-${question.id}`">
              <MpFormLabel>{{ textareaLabelFor(question) }}</MpFormLabel>
              <MpTextarea v-model="question.note" :is-disabled="isLocked" placeholder="Optional" />
            </MpFormControl>
          </MpFlex>
        </MpFlex>
      </MpFlex>
    </MpFlex>
  </MpFlex>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  MpFlex,
  MpText,
  MpButton,
  MpBadge,
  MpInput,
  MpTextarea,
  MpToggle,
  MpFormControl,
  MpFormLabel,
  MpDivider,
  MpBanner,
  MpBannerDescription,
  MpSkeleton,
  toast,
} from '@mekari/pixel3'
import {
  useGetGriQualSubmission,
  useUpdateGriQualSubmission,
  useSubmitGriQualSubmission,
  canSubmitGriQualSubmission,
  isGriQualSubmissionLocked,
  textareaLabelFor,
} from '@/services/evaluate-gri-qualitative'

const statusBadgeType: Record<SubmissionFlowStatus, 'announcement' | 'information' | 'completed' | 'critical'> = {
  draft: 'announcement',
  submitted: 'information',
  approved: 'completed',
  rejected: 'critical',
  cancelled: 'critical',
}

const route = useRoute()
const router = useRouter()

const id = computed(() => route.query.id as string | undefined)
const { data: submission, isLoading } = useGetGriQualSubmission(id)

const isLocked = computed(() => Boolean(submission.value && isGriQualSubmissionLocked(submission.value.flow_status)))
const canSubmit = computed(() => Boolean(submission.value && canSubmitGriQualSubmission(submission.value.disclosures)))

const updateMutation = useUpdateGriQualSubmission()
const submitMutation = useSubmitGriQualSubmission()
const isSaving = computed(() => updateMutation.isPending.value || submitMutation.isPending.value)

async function saveDraft() {
  if (!submission.value) return
  await updateMutation.mutateAsync({ id: submission.value.id, disclosures: submission.value.disclosures })
  toast.notify({ id: 'gri-qualitative-save-draft', variant: 'success', title: 'Draft saved.' })
}

async function submit() {
  if (!submission.value || !canSubmit.value) return
  await updateMutation.mutateAsync({ id: submission.value.id, disclosures: submission.value.disclosures })
  await submitMutation.mutateAsync(submission.value.id)
  toast.notify({ id: 'gri-qualitative-submit', variant: 'success', title: 'Submission submitted.' })
  router.push('/gri-qualitative')
}
</script>

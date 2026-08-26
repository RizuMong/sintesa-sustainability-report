<template>
  <MpFlex direction="column" backgroundColor="background.surface" minHeight="100vh">
    <MpFlex justifyContent="space-between" alignItems="center" paddingX="24px" paddingY="24px">
      <MpFlex direction="row" gap="3">
        <MpButton variant="ghost" left-icon="arrows-left" aria-label="Back" @click="router.back()" />
        <MpFlex direction="column" alignItems="flex-start">
          <MpButton variant="textLink" as="a" href="#/action-plan-submission">Submit Action Plan</MpButton>
          <MpText as="h1" size="h1">{{ item?.no_code || 'Action Plan Item' }}</MpText>
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
        <MpBanner v-if="item.status === 'Skipped'" variant="warning">
          <MpBannerDescription>Skipped — {{ item.skip_reason }}</MpBannerDescription>
        </MpBanner>
        <MpBanner v-else-if="item.status === 'Taken'" variant="info">
          <MpBannerDescription>
            Taken. A Realization record has been created for this item.
            <!-- ponytail: realization instance created backend-side on approval; UI only links to the realization list -->
            <MpButton variant="textLink" as="a" href="#/report-plan-realization">View in Report Plan Realization</MpButton>
          </MpBannerDescription>
        </MpBanner>

        <MpFormControl id="ap-sdg">
          <MpFormLabel>SDG</MpFormLabel>
          <MpText size="label">{{ item.sdg.name }}</MpText>
        </MpFormControl>

        <MpFormControl id="ap-key-business-action">
          <MpFormLabel>Key Business Action</MpFormLabel>
          <MpText size="label">{{ item.key_business_action }}</MpText>
        </MpFormControl>

        <MpFormControl id="ap-action-indicator">
          <MpFormLabel>Action Indicator</MpFormLabel>
          <MpText size="label">{{ item.action_indicator?.name ?? '—' }}</MpText>
        </MpFormControl>

        <MpFlex v-if="item.status === 'Pending Response'" gap="3">
          <MpButton :is-disabled="isSubmitting" @click="take">Take</MpButton>
          <MpButton variant="secondary" :is-disabled="isSubmitting" @click="isSkipModalOpen = true">Skip</MpButton>
        </MpFlex>

        <MpFlex v-if="item.status !== 'Pending Response'" gap="3">
          <!-- ponytail: export generated backend-side; buttons call the (unconfirmed)
               /v1/action-plan-submission/export?format=pdf|xlsx endpoint -->
          <MpButton variant="secondary" @click="download('pdf')">Download PDF</MpButton>
          <MpButton variant="secondary" @click="download('xlsx')">Download Excel</MpButton>
        </MpFlex>
      </MpFlex>
    </MpFlex>

    <MpModal :is-open="isSkipModalOpen" size="md" @close="closeSkipModal">
      <MpModalContent>
        <MpModalHeader>
          Skip this action plan item
          <MpModalCloseButton />
        </MpModalHeader>
        <MpModalBody>
          <MpFormControl id="skip-reason" is-required :is-invalid="wasSkipValidated && !isSkipReasonValid">
            <MpFormLabel>Justification</MpFormLabel>
            <MpTextarea v-model="skipReason" placeholder="Explain why this item is being skipped" />
            <MpFormErrorMessage v-if="wasSkipValidated && !isSkipReasonValid">Justification is required.</MpFormErrorMessage>
          </MpFormControl>
        </MpModalBody>
        <MpModalFooter>
          <MpButtonGroup>
            <MpButton variant="ghost" @click="closeSkipModal">Cancel</MpButton>
            <MpButton variant="danger" :is-disabled="isSubmitting" @click="confirmSkip">Skip</MpButton>
          </MpButtonGroup>
        </MpModalFooter>
      </MpModalContent>
      <MpModalOverlay />
    </MpModal>
  </MpFlex>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  MpFlex,
  MpText,
  MpButton,
  MpButtonGroup,
  MpFormControl,
  MpFormLabel,
  MpFormErrorMessage,
  MpTextarea,
  MpBanner,
  MpBannerDescription,
  MpSkeleton,
  MpModal,
  MpModalContent,
  MpModalHeader,
  MpModalBody,
  MpModalFooter,
  MpModalOverlay,
  MpModalCloseButton,
  toast,
} from '@mekari/pixel3'
import {
  useActionPlanSubmissionDetail,
  useSubmitActionPlanDecision,
  skipRequiresJustification,
} from '@/services/action-plan-submission'

const route = useRoute()
const router = useRouter()
const id = computed(() => route.query.id as string | undefined)

const { data: item, isLoading } = useActionPlanSubmissionDetail(id)
const submitMutation = useSubmitActionPlanDecision()
const isSubmitting = computed(() => submitMutation.isPending.value)

const isSkipModalOpen = ref(false)
const skipReason = ref('')
const wasSkipValidated = ref(false)
const isSkipReasonValid = computed(() => skipRequiresJustification('Skip', skipReason.value))

function closeSkipModal() {
  isSkipModalOpen.value = false
  skipReason.value = ''
  wasSkipValidated.value = false
}

async function take() {
  if (!id.value) return
  await submitMutation.mutateAsync({ id: id.value, decision: 'Take', skip_reason: '' })
  toast.notify({ id: 'action-plan-take', variant: 'success', title: 'Action plan item taken.' })
}

async function confirmSkip() {
  wasSkipValidated.value = true
  if (!id.value || !isSkipReasonValid.value) return
  await submitMutation.mutateAsync({ id: id.value, decision: 'Skip', skip_reason: skipReason.value.trim() })
  toast.notify({ id: 'action-plan-skip', variant: 'success', title: 'Action plan item skipped.' })
  closeSkipModal()
}

// ponytail: export generated backend-side; unconfirmed /v1/action-plan-submission/export endpoint —
// this button just opens it, no client-side PDF/Excel generation.
function download(format: 'pdf' | 'xlsx') {
  if (!id.value) return
  window.open(`/v1/action-plan-submission/export?format=${format}&id=${id.value}`, '_blank')
}
</script>

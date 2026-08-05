<template>
  <MpFlex direction="column" backgroundColor="background.surface" minHeight="100vh">
    <MpFlex justifyContent="space-between" alignItems="center" paddingX="24px" paddingY="24px">
      <MpFlex direction="row" gap="3">
        <MpButton variant="ghost" left-icon="arrows-left" aria-label="Back" @click="router.back()" />
        <MpFlex direction="column" alignItems="flex-start">
          <MpButton variant="textLink" as="a" href="#/gri-quantitative">GRI Quantitative</MpButton>
          <MpFlex direction="row" alignItems="center" gap="2">
            <MpText as="h1" size="h1">{{ record?.templateName ?? 'Loading...' }}</MpText>
            <MpBadge v-if="record" for="tableStatus" :type="statusBadgeType[record.status]">
              {{ record.status }}
            </MpBadge>
          </MpFlex>
        </MpFlex>
      </MpFlex>
      <MpButton v-if="record" variant="ghost" left-icon="delete" @click="isConfirmingDelete = true">
        Delete
      </MpButton>
    </MpFlex>

    <MpFlex
      direction="column"
      flex="1"
      backgroundColor="background.stage"
      borderTopWidth="1px"
      borderLeftWidth="1px"
      borderColor="border.default"
      roundedTopLeft="md"
      padding="24px"
    >
      <MpFlex v-if="record" direction="column" gap="6" maxWidth="640px">
        <MpFormControl id="template-name" is-required>
          <MpFormLabel>Template name</MpFormLabel>
          <MpInput v-model="form.templateName" />
        </MpFormControl>

        <MpFormControl id="template-period" is-required>
          <MpFormLabel>Period</MpFormLabel>
          <MpInput v-model="form.period" />
        </MpFormControl>

        <MpFlex>
          <MpButton @click="saveEdit">Update</MpButton>
        </MpFlex>
      </MpFlex>
    </MpFlex>

    <MpModal :is-open="isConfirmingDelete" size="md" @close="isConfirmingDelete = false">
      <MpModalContent>
        <MpModalHeader>
          Delete this template?
          <MpModalCloseButton />
        </MpModalHeader>
        <MpModalBody>
          <MpText size="label">This will permanently remove the template. This action cannot be undone.</MpText>
        </MpModalBody>
        <MpModalFooter>
          <MpButtonGroup>
            <MpButton variant="ghost" @click="isConfirmingDelete = false">Cancel</MpButton>
            <MpButton variant="danger" @click="confirmDelete">Delete</MpButton>
          </MpButtonGroup>
        </MpModalFooter>
      </MpModalContent>
      <MpModalOverlay />
    </MpModal>
  </MpFlex>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  MpFlex,
  MpText,
  MpButton,
  MpButtonGroup,
  MpBadge,
  MpInput,
  MpFormControl,
  MpFormLabel,
  MpModal,
  MpModalContent,
  MpModalHeader,
  MpModalBody,
  MpModalFooter,
  MpModalOverlay,
  MpModalCloseButton,
} from '@mekari/pixel3'
import { griQuantitativeApi } from '@/services/gri-quantitative.api'
import { useHistoryRecord } from '@/composables/useHistoryRecord'
import type { GriQuantitativeTemplate, EvaluationStatus } from '@/types'

const statusBadgeType: Record<EvaluationStatus, 'announcement' | 'information' | 'completed' | 'critical'> = {
  draft: 'announcement',
  submitted: 'information',
  approved: 'completed',
  rejected: 'critical',
}

const router = useRouter()

const record = useHistoryRecord<GriQuantitativeTemplate>('/gri-quantitative')
const isConfirmingDelete = ref(false)
const form = reactive({ templateName: '', period: '' })

watch(
  record,
  (value) => {
    if (!value) return
    form.templateName = value.templateName
    form.period = value.period
  },
  { immediate: true }
)

async function saveEdit() {
  if (!record.value) return
  record.value = await griQuantitativeApi.update(record.value.id, { ...form })
}

async function confirmDelete() {
  if (!record.value) return
  await griQuantitativeApi.remove(record.value.id)
  isConfirmingDelete.value = false
  router.push('/gri-quantitative')
}
</script>

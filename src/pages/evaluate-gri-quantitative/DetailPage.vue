<template>
  <MpFlex direction="column" backgroundColor="background.surface" minHeight="100vh">
    <MpFlex justifyContent="space-between" alignItems="center" paddingX="24px" paddingY="24px">
      <MpFlex direction="row" gap="3">
        <MpButton variant="ghost" left-icon="arrows-left" aria-label="Back" @click="router.back()" />
        <MpFlex direction="column">
          <MpButton variant="textLink" as="a" href="#/evaluate-gri-quantitative/requestor">
            Evaluate GRI Quantitative
          </MpButton>
          <MpFlex alignItems="center" gap="3">
            <MpText as="h1" size="h1">{{ record?.indicator ?? 'Loading...' }}</MpText>
            <MpBadge v-if="record" for="tableStatus" :type="statusBadgeType[record.status]">
              {{ record.status }}
            </MpBadge>
          </MpFlex>
        </MpFlex>
      </MpFlex>
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
        <MpFlex gap="6">
          <MpFormControl id="eval-indicator" is-disabled flex="1">
            <MpFormLabel>Indikator</MpFormLabel>
            <MpInput :model-value="record.indicator" is-disabled />
          </MpFormControl>
          <MpFormControl id="eval-period" is-disabled flex="1">
            <MpFormLabel>Periode</MpFormLabel>
            <MpInput :model-value="record.period" is-disabled />
          </MpFormControl>
        </MpFlex>

        <MpFlex gap="6">
          <MpFormControl id="eval-value" is-disabled flex="1">
            <MpFormLabel>Nilai</MpFormLabel>
            <MpInput :model-value="record.value" is-disabled />
          </MpFormControl>
          <MpFormControl id="eval-requestor" is-disabled flex="1">
            <MpFormLabel>Requestor</MpFormLabel>
            <MpInput :model-value="record.requestor" is-disabled />
          </MpFormControl>
        </MpFlex>

        <MpFormControl id="eval-note" is-disabled>
          <MpFormLabel>Catatan</MpFormLabel>
          <MpInput :model-value="record.note || '—'" is-disabled />
        </MpFormControl>

        <MpFormControl id="eval-status">
          <MpFormLabel>Status</MpFormLabel>
          <MpFlex alignItems="center" gap="2" paddingY="2">
            <MpFlex width="8px" height="8px" borderRadius="full" backgroundColor="background.brand.bold" />
            <MpText size="label">{{ statusLabel[record.status] }} by {{ record.actor }}</MpText>
          </MpFlex>
          <MpText size="label-small" color="text.secondary">{{ formattedTimestamp }}</MpText>
        </MpFormControl>

        <MpFlex v-if="record.status === 'submitted'" gap="3">
          <MpButton @click="decide('approved')">Approve</MpButton>
          <MpButton variant="danger" @click="decide('rejected')">Reject</MpButton>
        </MpFlex>
      </MpFlex>
    </MpFlex>
  </MpFlex>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { MpFlex, MpText, MpButton, MpBadge, MpInput, MpFormControl, MpFormLabel, toast } from '@mekari/pixel3'
import { evaluateGriQuantitativeApi } from '@/services/evaluate-gri-quantitative.api'
import { useHistoryRecord } from '@/composables/useHistoryRecord'
import type { EvaluationGriQuantitative, EvaluationStatus } from '@/types'

const statusBadgeType: Record<EvaluationStatus, 'announcement' | 'information' | 'completed' | 'critical'> = {
  draft: 'announcement',
  submitted: 'information',
  approved: 'completed',
  rejected: 'critical',
}

const statusLabel: Record<EvaluationStatus, string> = {
  draft: 'Saved as draft',
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
}

const router = useRouter()

const record = useHistoryRecord<EvaluationGriQuantitative>('/evaluate-gri-quantitative/requestor')

const formattedTimestamp = computed(() =>
  record.value
    ? new Date(record.value.updatedAt).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) + ' (GMT+7)'
    : ''
)

async function decide(status: 'approved' | 'rejected') {
  if (!record.value) return
  const id = record.value.id
  record.value = await evaluateGriQuantitativeApi.update(id, {
    status,
    actor: 'You',
    updatedAt: new Date().toISOString(),
  })
  toast.notify({
    id: `evaluate-detail-decide-${id}`,
    variant: 'success',
    title: status === 'approved' ? 'Evaluation approved.' : 'Evaluation rejected.',
  })
}
</script>

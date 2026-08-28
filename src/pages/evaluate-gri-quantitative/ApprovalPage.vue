<template>
  <MpFlex direction="column" backgroundColor="background.stage" minHeight="100vh">
    <MpFlex
      justifyContent="space-between"
      alignItems="center"
      paddingX="24px"
      paddingY="24px"
      backgroundColor="background.surface"
    >
      <MpFlex direction="column">
        <MpText size="label-small" color="text.secondary">Evaluate GRI Quantitative</MpText>
        <MpText as="h1" size="h1">Review &amp; Approval</MpText>
      </MpFlex>
    </MpFlex>

    <MpFlex direction="column" padding="24px" gap="4">
      <MpFlex gap="4">
        <SummaryBox label="Awaiting Approval" :amount="summary.awaitingApproval" />
        <SummaryBox label="Approved by Me" :amount="summary.approvedByMe" />
        <SummaryBox label="Approved" :amount="summary.approved" />
        <SummaryBox label="Rejected" :amount="summary.rejected" />
      </MpFlex>

      <!--
        ponytail: entity scoping + stage gating enforced server-side (AC-59); the UI only reflects
        approval_logs / current_stage_order returned by the list endpoint, it never filters rows
        client-side as a security control.
      -->
      <ApprovalReviewTable
        :items="items"
        :is-loading="isLoading"
        :columns="columns"
        :approve-mutation="approveMutation"
        :reject-mutation="rejectMutation"
        empty-title="No GRI Quantitative submissions waiting for approval"
      />
    </MpFlex>
  </MpFlex>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { MpFlex, MpText } from '@mekari/pixel3'
import ApprovalReviewTable from '@/components/ApprovalReviewTable.vue'
import SummaryBox from '@/components/SummaryBox.vue'
import { useCurrentUserEmail } from '@/composables/useCurrentUser'
import {
  useGetApprovalList,
  useApproveEvaluateGriQuantitative,
  useRejectEvaluateGriQuantitative,
  approvalSummary,
} from '@/services/evaluate-gri-quantitative'

// Scoped to GRI Quantitative only — the Qualitative and Action Plan Realization queues have their
// own portals; this one mirrors the Officeless GRI Quantitative approval screen.
const { data, isLoading } = useGetApprovalList()
const items = computed(() => data.value ?? [])

const { data: myEmail } = useCurrentUserEmail()
const summary = computed(() => approvalSummary(items.value, myEmail.value))

const approveMutation = useApproveEvaluateGriQuantitative()
const rejectMutation = useRejectEvaluateGriQuantitative()

const columns = [
  { key: 'entity', label: 'Entity', value: (row: EvaluateGriQuantitativeSummary) => row.entity_id.name },
  { key: 'period', label: 'Period', value: (row: EvaluateGriQuantitativeSummary) => row.period_id.name },
  { key: 'template', label: 'Template', value: (row: EvaluateGriQuantitativeSummary) => row.template_id.name },
]
</script>

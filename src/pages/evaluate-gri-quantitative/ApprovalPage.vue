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
        <MpText size="label-small" color="text.secondary">Sustainability Reporting</MpText>
        <MpText as="h1" size="h1">Review &amp; Approval</MpText>
      </MpFlex>
    </MpFlex>

    <MpFlex direction="column" padding="24px" gap="4">
      <!--
        ponytail: entity scoping + stage gating enforced server-side (AC-59); the UI only reflects
        approval_logs / current_stage_order returned by each list endpoint, it never filters rows
        client-side as a security control.
      -->
      <MpTabs>
        <MpTabList>
          <MpTab>GRI Quantitative</MpTab>
          <MpTab>GRI Qualitative</MpTab>
          <MpTab>Action Plan Realization</MpTab>
        </MpTabList>
        <MpTabPanels>
          <MpTabPanel>
            <ApprovalReviewTable
              :items="quantItems"
              :is-loading="quantLoading"
              :columns="quantColumns"
              :approve-mutation="approveQuant"
              :reject-mutation="rejectQuant"
              empty-title="No GRI Quantitative submissions waiting for approval"
            />
          </MpTabPanel>
          <MpTabPanel>
            <ApprovalReviewTable
              :items="qualItems"
              :is-loading="qualLoading"
              :columns="qualColumns"
              :approve-mutation="approveQual"
              :reject-mutation="rejectQual"
              empty-title="No GRI Qualitative submissions waiting for approval"
            />
          </MpTabPanel>
          <MpTabPanel>
            <ApprovalReviewTable
              :items="realizationItems"
              :is-loading="realizationLoading"
              :columns="realizationColumns"
              :approve-mutation="approveRealization"
              :reject-mutation="rejectRealization"
              empty-title="No Action Plan Realization reports waiting for approval"
            />
          </MpTabPanel>
        </MpTabPanels>
      </MpTabs>
    </MpFlex>
  </MpFlex>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { MpFlex, MpText, MpTabs, MpTabList, MpTab, MpTabPanels, MpTabPanel } from '@mekari/pixel3'
import ApprovalReviewTable from '@/components/ApprovalReviewTable.vue'
import {
  useGetApprovalList as useGetQuantApprovalList,
  useApproveEvaluateGriQuantitative,
  useRejectEvaluateGriQuantitative,
} from '@/services/evaluate-gri-quantitative'
import {
  useGetGriQualApprovalQueue as useGetQualApprovalList,
  useApproveGriQualSubmission,
  useRejectGriQualSubmission,
} from '@/services/evaluate-gri-qualitative'
import {
  useGetApprovalList as useGetRealizationApprovalList,
  useApproveReportPlanRealization,
  useRejectReportPlanRealization,
} from '@/services/report-plan-realization'

// Tab 1 — GRI Quantitative (Stream C)
const { data: quantData, isLoading: quantLoading } = useGetQuantApprovalList()
const quantItems = computed(() => quantData.value ?? [])
const approveQuant = useApproveEvaluateGriQuantitative()
const rejectQuant = useRejectEvaluateGriQuantitative()
const quantColumns = [
  { key: 'entity', label: 'Entity', value: (row: EvaluateGriQuantitativeSummary) => row.entity_id.name },
  { key: 'period', label: 'Period', value: (row: EvaluateGriQuantitativeSummary) => row.period_id.name },
  { key: 'template', label: 'Template', value: (row: EvaluateGriQuantitativeSummary) => row.template_id.name },
]

// Tab 2 — GRI Qualitative (Stream D)
const { data: qualData, isLoading: qualLoading } = useGetQualApprovalList()
const qualItems = computed(() => qualData.value ?? [])
const approveQual = useApproveGriQualSubmission()
const rejectQual = useRejectGriQualSubmission()
const qualColumns = [
  { key: 'entity', label: 'Entity', value: (row: GriQualSubmission) => row.entity_id.name },
  { key: 'period', label: 'Period', value: (row: GriQualSubmission) => row.period_id.name },
  { key: 'template', label: 'Template', value: (row: GriQualSubmission) => row.template_id.name },
]

// Tab 3 — Action Plan Realization (Stream F)
const { data: realizationData, isLoading: realizationLoading } = useGetRealizationApprovalList()
const realizationItems = computed(() => realizationData.value ?? [])
const approveRealization = useApproveReportPlanRealization()
const rejectRealization = useRejectReportPlanRealization()
const realizationColumns = [
  { key: 'period', label: 'Period', value: (row: RealizationReport) => row.period_id.name },
  { key: 'indicator', label: 'Action Indicator', value: (row: RealizationReport) => row.action_indicator.name },
  { key: 'value', label: 'Value', value: (row: RealizationReport) => String(row.value ?? '—') },
]
</script>

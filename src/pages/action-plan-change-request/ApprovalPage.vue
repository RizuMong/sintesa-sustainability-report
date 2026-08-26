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
        <MpText as="h1" size="h1">Action Plan Change Request — Approval</MpText>
      </MpFlex>
    </MpFlex>

    <MpFlex direction="column" padding="24px" gap="2">
      <MpFlex v-if="isLoading" direction="column" gap="2">
        <MpSkeleton v-for="i in 4" :key="i" height="56px" rounded="md" />
      </MpFlex>

      <template v-else-if="pendingItems.length">
        <MpTableContainer>
          <MpTable>
            <MpTableHead>
              <MpTableRow>
                <MpTableCell scope="col">Action Plan</MpTableCell>
                <MpTableCell scope="col">Requested By</MpTableCell>
                <MpTableCell scope="col">Requested On</MpTableCell>
                <MpTableCell scope="col">Status</MpTableCell>
                <MpTableCell scope="col">Actions</MpTableCell>
              </MpTableRow>
            </MpTableHead>
            <MpTableBody>
              <template v-for="row in pendingItems" :key="row.id">
                <MpTableRow>
                  <MpTableCell as="td" scope="row" @click="toggleExpand(row.id)" :class="css({ cursor: 'pointer' })">
                    {{ row.action_plan_id }}
                  </MpTableCell>
                  <MpTableCell as="td" scope="row">{{ row.request_by }}</MpTableCell>
                  <MpTableCell as="td" scope="row">{{ row.request_date }}</MpTableCell>
                  <MpTableCell as="td" scope="row">
                    <MpBadge for="tableStatus" type="information">{{ row.status }}</MpBadge>
                  </MpTableCell>
                  <MpTableCell as="td" scope="row">
                    <MpButton variant="textLink" size="sm" @click="toggleExpand(row.id)">
                      {{ expandedId === row.id ? 'Hide details' : 'Review' }}
                    </MpButton>
                  </MpTableCell>
                </MpTableRow>

                <MpTableRow v-if="expandedId === row.id">
                  <MpTableCell as="td" :col-span="5">
                    <MpFlex direction="column" gap="4" padding="16px">
                      <MpFlex gap="6">
                        <MpFlex direction="column" gap="2" flex="1">
                          <MpText size="label" weight="semiBold">Existing</MpText>
                          <MpFlex direction="column" gap="1">
                            <MpText v-for="(value, key) in row.existing" :key="key" size="label-small">
                              {{ key }}: {{ value }}
                            </MpText>
                          </MpFlex>
                        </MpFlex>
                        <MpFlex direction="column" gap="2" flex="1">
                          <MpText size="label" weight="semiBold">Proposed</MpText>
                          <MpFlex direction="column" gap="1">
                            <MpText v-for="(value, key) in row.proposed" :key="key" size="label-small">
                              {{ key }}: {{ value }}
                            </MpText>
                          </MpFlex>
                        </MpFlex>
                      </MpFlex>

                      <MpFormControl :id="`change-request-notes-${row.id}`">
                        <MpFormLabel>Notes / Reason</MpFormLabel>
                        <MpText size="label" color="text.secondary">{{ row.notes }}</MpText>
                      </MpFormControl>

                      <MpFormControl :id="`change-request-reviewer-notes-${row.id}`" is-required>
                        <MpFormLabel>Reviewer Notes</MpFormLabel>
                        <MpTextarea v-model="reviewerNotes[row.id]" placeholder="Required to reject" />
                      </MpFormControl>

                      <MpButtonGroup>
                        <MpButton
                          :is-disabled="isBusy(row.id)"
                          :is-loading="approveMutation.isPending.value && actingOnId === row.id"
                          @click="approve(row.id)"
                        >
                          Approve
                        </MpButton>
                        <MpButton
                          variant="danger"
                          :is-disabled="!canReject(reviewerNotes[row.id] ?? '') || isBusy(row.id)"
                          :is-loading="rejectMutation.isPending.value && actingOnId === row.id"
                          @click="reject(row.id)"
                        >
                          Reject
                        </MpButton>
                      </MpButtonGroup>

                      <!-- AC-108 — history of all requests for this action plan -->
                      <MpFlex v-if="historyFor(row).length > 1" direction="column" gap="1">
                        <MpText size="label" weight="semiBold">History</MpText>
                        <MpText v-for="h in historyFor(row)" :key="h.id" size="label-small" color="text.secondary">
                          {{ h.request_date }} — {{ h.request_by }} — {{ h.status }}
                          <template v-if="h.reviewer_notes"> ("{{ h.reviewer_notes }}")</template>
                        </MpText>
                      </MpFlex>
                    </MpFlex>
                  </MpTableCell>
                </MpTableRow>
              </template>
            </MpTableBody>
          </MpTable>
        </MpTableContainer>
      </template>

      <MpFlex v-else direction="column" alignItems="center" gap="4" paddingY="20">
        <MpImage
          src="https://cdn.mekari.design/illustration/blank-slate/NoData_PB_L_01.png"
          alt="empty state illustration"
          layout="fixed"
          :width="200"
          :height="160"
          object-fit="contain"
          :is-show-loading="false"
        />
        <MpText size="h3" weight="semiBold">No change requests waiting for review</MpText>
      </MpFlex>
    </MpFlex>
  </MpFlex>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import {
  MpFlex,
  MpText,
  MpButton,
  MpButtonGroup,
  MpBadge,
  MpImage,
  MpSkeleton,
  MpTable,
  MpTableHead,
  MpTableBody,
  MpTableRow,
  MpTableCell,
  MpTableContainer,
  MpFormControl,
  MpFormLabel,
  MpTextarea,
  css,
  toast,
} from '@mekari/pixel3'
import { canReject } from '@/lib/review-approval-validation'
import {
  useGetActionPlanChangeRequests,
  useApproveActionPlanChangeRequest,
  useRejectActionPlanChangeRequest,
} from '@/services/action-plan-change-request'

const { data, isLoading } = useGetActionPlanChangeRequests({ status: 'Pending Review' })
const items = computed(() => data.value ?? [])
const pendingItems = computed(() => items.value.filter((r) => r.status === 'Pending Review'))

const expandedId = ref<string | null>(null)
const reviewerNotes = reactive<Record<string, string>>({})
const actingOnId = ref<string | null>(null)

const approveMutation = useApproveActionPlanChangeRequest()
const rejectMutation = useRejectActionPlanChangeRequest()

function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

function isBusy(id: string) {
  return actingOnId.value === id && (approveMutation.isPending.value || rejectMutation.isPending.value)
}

// AC-108 — every request tied to the same action_plan_id, most recent first
function historyFor(row: ActionPlanChangeRequest) {
  return items.value
    .filter((r) => r.action_plan_id === row.action_plan_id)
    .sort((a, b) => (a.request_date < b.request_date ? 1 : -1))
}

async function approve(id: string) {
  actingOnId.value = id
  try {
    await approveMutation.mutateAsync({ id, reviewer_notes: reviewerNotes[id] })
    toast.notify({ id: `cr-approve-${id}`, variant: 'success', title: 'Change request approved.' })
    expandedId.value = null
  } finally {
    actingOnId.value = null
  }
}

async function reject(id: string) {
  if (!canReject(reviewerNotes[id] ?? '')) return
  actingOnId.value = id
  try {
    await rejectMutation.mutateAsync({ id, reviewer_notes: reviewerNotes[id]!.trim() })
    toast.notify({ id: `cr-reject-${id}`, variant: 'success', title: 'Change request rejected.' })
    expandedId.value = null
  } finally {
    actingOnId.value = null
  }
}
</script>

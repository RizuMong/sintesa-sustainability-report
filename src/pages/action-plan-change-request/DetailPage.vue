<template>
  <MpFlex direction="column" backgroundColor="background.surface" minHeight="100vh">
    <MpFlex justifyContent="space-between" alignItems="center" paddingX="24px" paddingY="24px">
      <MpFlex direction="row" gap="3">
        <MpButton variant="ghost" left-icon="arrows-left" aria-label="Back" @click="router.back()" />
        <MpFlex direction="column" alignItems="flex-start">
          <MpButton variant="textLink" as="a" href="#/action-plan-change-request">Action Plan Change Request</MpButton>
          <MpText as="h1" size="h1">Create</MpText>
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
      <MpFlex v-if="isLoading" direction="column" gap="2">
        <MpSkeleton v-for="i in 4" :key="i" height="56px" rounded="md" />
      </MpFlex>

      <MpFlex v-else direction="column" gap="6" maxWidth="880px">
        <MpFormControl id="cr-plan" is-required>
          <MpFormLabel>Action Plan</MpFormLabel>
          <MpSelect v-model="selectedRowId" placeholder="Select a Taken/Active action plan row" is-full-width>
            <option value="" disabled>Select a Taken/Active action plan row</option>
            <option v-for="opt in eligibleRows" :key="opt.row.id" :value="opt.row.id">
              {{ opt.row.no_code }} — {{ opt.row.key_business_action }} ({{ opt.plan.status }})
            </option>
          </MpSelect>
        </MpFormControl>

        <template v-if="selectedRow">
          <MpBanner variant="info">
            <MpBannerDescription>
              The original plan stays unchanged until a Holding reviewer approves this request (AC-105/107).
            </MpBannerDescription>
          </MpBanner>

          <MpFlex gap="6">
            <MpFlex direction="column" gap="4" flex="1">
              <MpText size="h3" weight="semiBold">Existing</MpText>
              <MpFormControl id="cr-existing-action" is-disabled>
                <MpFormLabel>Key Business Action</MpFormLabel>
                <MpTextarea :model-value="selectedRow.key_business_action" is-disabled />
              </MpFormControl>
              <MpFormControl id="cr-existing-solution" is-disabled>
                <MpFormLabel>Detail Action Solution</MpFormLabel>
                <MpTextarea :model-value="selectedRow.detail_action_solution" is-disabled />
              </MpFormControl>
              <MpFormControl id="cr-existing-alignment" is-disabled>
                <MpFormLabel>Alignment</MpFormLabel>
                <MpInput :model-value="selectedRow.alignment" is-disabled />
              </MpFormControl>
            </MpFlex>

            <MpFlex direction="column" gap="4" flex="1">
              <MpText size="h3" weight="semiBold">Proposed</MpText>
              <MpFormControl id="cr-proposed-action" is-required>
                <MpFormLabel>Key Business Action</MpFormLabel>
                <MpTextarea v-model="proposed.key_business_action" />
              </MpFormControl>
              <MpFormControl id="cr-proposed-solution">
                <MpFormLabel>Detail Action Solution</MpFormLabel>
                <MpTextarea v-model="proposed.detail_action_solution" />
              </MpFormControl>
              <MpFormControl id="cr-proposed-alignment">
                <MpFormLabel>Alignment</MpFormLabel>
                <MpInput v-model="proposed.alignment" />
              </MpFormControl>
            </MpFlex>
          </MpFlex>

          <MpFormControl id="cr-notes" is-required :is-invalid="!isNotesValid && notesTouched">
            <MpFormLabel>Notes / Reason</MpFormLabel>
            <MpTextarea v-model="notes" placeholder="Why this change is needed" @blur="notesTouched = true" />
            <MpFormErrorMessage v-if="!isNotesValid && notesTouched">Notes/Reason is required.</MpFormErrorMessage>
          </MpFormControl>

          <MpFlex justifyContent="flex-end" gap="3">
            <MpButton variant="ghost" @click="router.push('/action-plan-change-request')">Close</MpButton>
            <MpButton :is-disabled="!canSubmit || isSaving" @click="submit">Submit</MpButton>
          </MpFlex>

          <MpDivider />

          <!-- AC-108 — history of every request filed against this action plan row -->
          <MpFlex direction="column" gap="3">
            <MpText size="h3" weight="semiBold">History</MpText>
            <MpText v-if="!history.length" size="label" color="text.secondary">No previous requests.</MpText>
            <MpTableContainer v-else>
              <MpTable>
                <MpTableHead>
                  <MpTableRow>
                    <MpTableCell scope="col">Requested</MpTableCell>
                    <MpTableCell scope="col">Notes</MpTableCell>
                    <MpTableCell scope="col">Status</MpTableCell>
                    <MpTableCell scope="col">Decided</MpTableCell>
                    <MpTableCell scope="col">Reviewer Notes</MpTableCell>
                  </MpTableRow>
                </MpTableHead>
                <MpTableBody>
                  <MpTableRow v-for="item in history" :key="item.id">
                    <MpTableCell as="td" scope="row">{{ item.request_date }} — {{ item.request_by }}</MpTableCell>
                    <MpTableCell as="td" scope="row">{{ item.notes }}</MpTableCell>
                    <MpTableCell as="td" scope="row">
                      <MpBadge for="tableStatus" :type="statusBadgeType[item.status]">{{ item.status }}</MpBadge>
                    </MpTableCell>
                    <MpTableCell as="td" scope="row">
                      {{ item.approved_date ? `${item.approved_date} — ${item.approved_by}` : '—' }}
                    </MpTableCell>
                    <MpTableCell as="td" scope="row">{{ item.reviewer_notes ?? '—' }}</MpTableCell>
                  </MpTableRow>
                </MpTableBody>
              </MpTable>
            </MpTableContainer>
          </MpFlex>
        </template>
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
  MpInput,
  MpSelect,
  MpTextarea,
  MpFormControl,
  MpFormLabel,
  MpFormErrorMessage,
  MpBanner,
  MpBannerDescription,
  MpBadge,
  MpDivider,
  MpSkeleton,
  MpTable,
  MpTableHead,
  MpTableBody,
  MpTableRow,
  MpTableCell,
  MpTableContainer,
  toast,
} from '@mekari/pixel3'
import { useCreateChangeRequest, useGetChangeRequestHistory } from '@/services/action-plan-change-request'
import { hasProposedChanges, isChangeRequestNotesValid } from '@/services/action-plan-change-request/validation'
import { useGetInitiatedPlans } from '@/services/initiate-new-plan'

const route = useRoute()
const router = useRouter()

const { data: plans, isLoading } = useGetInitiatedPlans()

// only Active/Taken plan rows can be picked as the change target — a Pending Review plan has no
// approved baseline yet to propose a change against.
const eligibleRows = computed(() =>
  (plans.value ?? [])
    .filter((plan) => plan.status === 'Active' || plan.status === 'Taken')
    .flatMap((plan) => plan.rows.map((row) => ({ plan, row }))),
)

const selectedRowId = ref((route.query.action_plan_id as string | undefined) ?? '')
const selectedRow = computed<ActionPlanMatrixRow | undefined>(
  () => eligibleRows.value.find((opt) => opt.row.id === selectedRowId.value)?.row,
)

const proposed = reactive({ key_business_action: '', detail_action_solution: '', alignment: '' })
watch(
  selectedRow,
  (row) => {
    if (!row) return
    proposed.key_business_action = row.key_business_action
    proposed.detail_action_solution = row.detail_action_solution
    proposed.alignment = row.alignment
  },
  { immediate: true },
)

const notes = ref('')
const notesTouched = ref(false)
const isNotesValid = computed(() => isChangeRequestNotesValid(notes.value))

const existingPartial = computed<Partial<ActionPlanMatrixRow>>(() =>
  selectedRow.value
    ? {
        no_code: selectedRow.value.no_code,
        key_business_action: selectedRow.value.key_business_action,
        detail_action_solution: selectedRow.value.detail_action_solution,
        alignment: selectedRow.value.alignment,
      }
    : {},
)
// no_code identifies the row and is never itself proposed — mirrored from existing so the diff
// guard only ever fires on the fields the form actually lets the user edit.
const proposedPartial = computed<Partial<ActionPlanMatrixRow>>(() => ({
  no_code: selectedRow.value?.no_code,
  ...proposed,
}))

const canSubmit = computed(
  () => Boolean(selectedRow.value) && isNotesValid.value && hasProposedChanges(existingPartial.value, proposedPartial.value),
)

const { data: history } = useGetChangeRequestHistory(() =>
  eligibleRows.value.find((opt) => opt.row.id === selectedRowId.value) ? selectedRowId.value : undefined,
)

const statusBadgeType: Record<ActionPlanChangeRequest['status'], 'announcement' | 'information' | 'completed' | 'critical'> = {
  'Pending Review': 'information',
  Approved: 'completed',
  Rejected: 'critical',
}

const createMutation = useCreateChangeRequest()
const isSaving = computed(() => createMutation.isPending.value)

async function submit() {
  notesTouched.value = true
  if (!canSubmit.value || !selectedRow.value) return
  await createMutation.mutateAsync({
    action_plan_id: selectedRow.value.id,
    existing: existingPartial.value,
    proposed: proposedPartial.value,
    notes: notes.value,
  })
  toast.notify({ id: 'action-plan-change-request-create', variant: 'success', title: 'Change request submitted.' })
  router.push('/action-plan-change-request')
}
</script>

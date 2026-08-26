<template>
  <MpFlex direction="column" gap="3">
    <MpFlex justifyContent="space-between" alignItems="center">
      <MpText size="label" color="text.secondary">
        {{ selected.size }} selected
      </MpText>
      <MpButton :is-disabled="!selected.size || isBulkApproving" :is-loading="isBulkApproving" @click="bulkApprove">
        Bulk Approve
      </MpButton>
    </MpFlex>

    <MpFlex v-if="isLoading" direction="column" gap="2">
      <MpSkeleton v-for="i in 4" :key="i" height="56px" rounded="md" />
    </MpFlex>

    <template v-else-if="items.length">
      <MpTableContainer>
        <MpTable>
          <MpTableHead>
            <MpTableRow>
              <MpTableCell scope="col">
                <MpCheckbox
                  id="select-all"
                  :is-checked="allSelectableSelected"
                  :is-disabled="!selectableIds.length"
                  @update:is-checked="toggleSelectAll"
                />
              </MpTableCell>
              <MpTableCell v-for="col in columns" :key="col.key" scope="col">{{ col.label }}</MpTableCell>
              <MpTableCell scope="col">Approval Stage</MpTableCell>
              <MpTableCell scope="col">Status</MpTableCell>
              <MpTableCell scope="col">Actions</MpTableCell>
            </MpTableRow>
          </MpTableHead>
          <MpTableBody>
            <template v-for="row in items" :key="row.id">
              <MpTableRow>
                <MpTableCell as="td" scope="row">
                  <MpCheckbox
                    :id="`select-${row.id}`"
                    :is-checked="selected.has(row.id)"
                    :is-disabled="!isActionable(row)"
                    @update:is-checked="(checked: boolean) => toggleRow(row.id, checked)"
                  />
                </MpTableCell>
                <MpTableCell v-for="col in columns" :key="col.key" as="td" scope="row">
                  {{ col.value(row) }}
                </MpTableCell>
                <MpTableCell as="td" scope="row">
                  <MpButton variant="textLink" size="sm" @click="toggleExpand(row.id)">
                    Stage {{ row.current_stage_order }} — {{ currentStage(row)?.approval_type ?? '—' }}
                  </MpButton>
                </MpTableCell>
                <MpTableCell as="td" scope="row">
                  <MpBadge for="tableStatus" :type="statusBadgeType(row.flow_status)">{{ row.flow_status }}</MpBadge>
                </MpTableCell>
                <MpTableCell as="td" scope="row">
                  <MpButtonGroup>
                    <MpButton
                      size="sm"
                      :is-disabled="!isActionable(row) || isRowBusy(row.id)"
                      :is-loading="approveMutation.isPending.value && actingOnId === row.id"
                      @click="approveOne(row.id)"
                    >
                      Approve
                    </MpButton>
                    <MpButton
                      variant="danger"
                      size="sm"
                      :is-disabled="!isActionable(row) || isRowBusy(row.id)"
                      @click="openReject(row.id)"
                    >
                      Reject
                    </MpButton>
                  </MpButtonGroup>
                </MpTableCell>
              </MpTableRow>

              <MpTableRow v-if="expandedId === row.id">
                <MpTableCell as="td" :col-span="columns.length + 4">
                  <MpFlex direction="column" gap="2" padding="12px">
                    <MpText size="label" weight="semiBold">Approval line</MpText>
                    <MpFlex
                      v-for="log in [...(row.approval_logs ?? [])].sort((a, b) => a.stage_order - b.stage_order)"
                      :key="log.stage_order"
                      direction="column"
                      gap="1"
                    >
                      <MpText size="label">
                        Stage {{ log.stage_order }} · {{ log.approval_type }} —
                        <MpBadge for="tableStatus" :type="statusBadgeType(log.status)">{{ log.status }}</MpBadge>
                      </MpText>
                      <MpText v-for="a in log.approvers" :key="a.user.id" size="label-small" color="text.secondary">
                        {{ a.user.name }} ({{ a.position.name }}): {{ a.action }}
                        <template v-if="a.notes"> — "{{ a.notes }}"</template>
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
      <MpText size="h3" weight="semiBold">{{ emptyTitle }}</MpText>
    </MpFlex>

    <MpModal :is-open="rejectTargetId !== null" size="md" @close="closeReject">
      <MpModalContent>
        <MpModalHeader>
          Reject submission
          <MpModalCloseButton />
        </MpModalHeader>
        <MpModalBody>
          <MpFormControl id="reject-notes" is-required>
            <MpFormLabel>Reviewer Notes</MpFormLabel>
            <MpTextarea v-model="rejectNotes" placeholder="Explain why this is being rejected" />
          </MpFormControl>
        </MpModalBody>
        <MpModalFooter>
          <MpButtonGroup>
            <MpButton variant="ghost" @click="closeReject">Cancel</MpButton>
            <MpButton
              variant="danger"
              :is-disabled="!canReject(rejectNotes) || rejectMutation.isPending.value"
              :is-loading="rejectMutation.isPending.value"
              @click="confirmReject"
            >
              Reject
            </MpButton>
          </MpButtonGroup>
        </MpModalFooter>
      </MpModalContent>
      <MpModalOverlay />
    </MpModal>
  </MpFlex>
</template>

<script setup lang="ts" generic="TRow extends { id: string; flow_status: string; current_stage_order?: number; approval_logs?: ApprovalLog[] }">
import { computed, ref } from 'vue'
import {
  MpFlex,
  MpText,
  MpButton,
  MpButtonGroup,
  MpBadge,
  MpImage,
  MpSkeleton,
  MpCheckbox,
  MpTable,
  MpTableHead,
  MpTableBody,
  MpTableRow,
  MpTableCell,
  MpTableContainer,
  MpModal,
  MpModalContent,
  MpModalHeader,
  MpModalBody,
  MpModalFooter,
  MpModalOverlay,
  MpModalCloseButton,
  MpFormControl,
  MpFormLabel,
  MpTextarea,
  toast,
} from '@mekari/pixel3'
import { canReject, selectableApprovalIds } from '@/lib/review-approval-validation'

// shared table for the 3 Review & Approval tabs (FSD 2.4, AC-55...AC-62) — the only thing that
// differs per tab is which columns to show and which module's mutations back approve/reject.
interface ApprovableRow {
  id: string
  flow_status: string
  current_stage_order?: number
  approval_logs?: ApprovalLog[]
}

const props = defineProps<{
  items: TRow[]
  isLoading: boolean
  columns: { key: string; label: string; value: (row: TRow) => string | number }[]
  approveMutation: { mutateAsync: (payload: { id: string; remarks?: string }) => Promise<unknown>; isPending: { value: boolean } }
  rejectMutation: { mutateAsync: (payload: { id: string; remarks: string }) => Promise<unknown>; isPending: { value: boolean } }
  emptyTitle?: string
}>()

const emptyTitle = props.emptyTitle ?? 'No submissions waiting for approval'

const selected = ref<Set<string>>(new Set())
const expandedId = ref<string | null>(null)
const rejectTargetId = ref<string | null>(null)
const rejectNotes = ref('')
const actingOnId = ref<string | null>(null)
const isBulkApproving = ref(false)

const selectableIds = computed(() => selectableApprovalIds(props.items))
const allSelectableSelected = computed(
  () => selectableIds.value.length > 0 && selectableIds.value.every((id) => selected.value.has(id)),
)

function isActionable(row: ApprovableRow) {
  return selectableIds.value.includes(row.id)
}

function isRowBusy(id: string) {
  return actingOnId.value === id && (props.approveMutation.isPending.value || props.rejectMutation.isPending.value)
}

function currentStage(row: ApprovableRow) {
  return (row.approval_logs ?? []).find((log) => log.stage_order === row.current_stage_order)
}

// inline per component, per CLAUDE.md's "don't build a shared badge util" convention
function statusBadgeType(status: string) {
  if (status === 'approved' || status === 'APPROVED') return 'completed'
  if (status === 'rejected' || status === 'REJECTED') return 'announcement'
  if (status === 'draft') return 'warning'
  return 'information'
}

function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

function toggleRow(id: string, checked: boolean) {
  const next = new Set(selected.value)
  if (checked) next.add(id)
  else next.delete(id)
  selected.value = next
}

function toggleSelectAll(checked: boolean) {
  selected.value = checked ? new Set(selectableIds.value) : new Set()
}

async function approveOne(id: string) {
  actingOnId.value = id
  try {
    await props.approveMutation.mutateAsync({ id })
    toast.notify({ id: `approve-${id}`, variant: 'success', title: 'Approved.' })
    selected.value.delete(id)
  } finally {
    actingOnId.value = null
  }
}

// AC-62 — bulk approve is one mutation call per selected row; each mutation's own onSuccess already
// invalidates the list query on settle (see the module's composables.ts).
async function bulkApprove() {
  const ids = Array.from(selected.value)
  if (!ids.length) return
  isBulkApproving.value = true
  try {
    for (const id of ids) {
      await props.approveMutation.mutateAsync({ id })
    }
    toast.notify({ id: 'bulk-approve', variant: 'success', title: `Approved ${ids.length} submission(s).` })
    selected.value = new Set()
  } finally {
    isBulkApproving.value = false
  }
}

function openReject(id: string) {
  rejectTargetId.value = id
  rejectNotes.value = ''
}

function closeReject() {
  rejectTargetId.value = null
  rejectNotes.value = ''
}

async function confirmReject() {
  const id = rejectTargetId.value
  if (!id || !canReject(rejectNotes.value)) return
  actingOnId.value = id
  try {
    await props.rejectMutation.mutateAsync({ id, remarks: rejectNotes.value.trim() })
    toast.notify({ id: `reject-${id}`, variant: 'success', title: 'Rejected.' })
    selected.value.delete(id)
    closeReject()
  } finally {
    actingOnId.value = null
  }
}
</script>

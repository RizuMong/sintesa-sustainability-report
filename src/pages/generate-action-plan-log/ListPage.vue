<template>
  <MpFlex direction="column" backgroundColor="background.stage" minHeight="100vh">
    <MpFlex direction="column" paddingX="24px" paddingTop="24px" paddingBottom="8px" backgroundColor="background.surface">
      <MpText as="h1" size="h1">Generate Action Plan — Log Generate</MpText>
    </MpFlex>

    <MpFlex direction="column" paddingX="24px" paddingTop="8px" paddingBottom="24px" gap="2">
      <MpFlex justifyContent="flex-start">
        <TableFilter :columns="filterColumns" @apply="applyFilter" @reset="resetFilter" />
      </MpFlex>

      <MpFlex v-if="isLoading" direction="column" gap="2">
        <MpSkeleton v-for="i in 4" :key="i" height="56px" rounded="md" />
      </MpFlex>

      <template v-else-if="filteredItems.length">
        <MpTableContainer>
          <MpTable>
            <MpTableHead>
              <MpTableRow>
                <MpTableCell scope="col">Timestamp</MpTableCell>
                <MpTableCell scope="col">Trigger Type</MpTableCell>
                <MpTableCell scope="col">Submission Type</MpTableCell>
                <MpTableCell scope="col">Recipients</MpTableCell>
                <MpTableCell scope="col">Status</MpTableCell>
                <MpTableCell scope="col">Action</MpTableCell>
              </MpTableRow>
            </MpTableHead>
            <MpTableBody>
              <MpTableRow v-for="row in filteredItems" :key="row.id">
                <MpTableCell as="td" scope="row">{{ formatDateTime(row.timestamp) }}</MpTableCell>
                <MpTableCell as="td" scope="row">{{ row.trigger_type }}</MpTableCell>
                <MpTableCell as="td" scope="row">{{ row.submission_type }}</MpTableCell>
                <MpTableCell as="td" scope="row">{{ row.recipient_count }}</MpTableCell>
                <MpTableCell as="td" scope="row">
                  <MpBadge for="tableStatus" :type="row.status === 'Success' ? 'completed' : 'critical'">
                    {{ row.status }}
                  </MpBadge>
                </MpTableCell>
                <MpTableCell as="td" scope="row">
                  <MpButton
                    v-if="row.status === 'Failed'"
                    size="sm"
                    variant="secondary"
                    :is-loading="retriggeringId === row.id"
                    @click="onRetrigger(row.id)"
                  >
                    Re-trigger
                  </MpButton>
                </MpTableCell>
              </MpTableRow>
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
        <MpText size="h3" weight="semiBold">No available yet</MpText>
      </MpFlex>
    </MpFlex>
  </MpFlex>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { MpFlex, MpText, MpButton, MpImage, MpSkeleton, MpTable, MpTableHead, MpTableBody, MpTableRow, MpTableCell, MpTableContainer, MpBadge, toast } from '@mekari/pixel3'
import { useTableFilter } from '@/composables/useTableFilter'
import TableFilter from '@/components/TableFilter.vue'
import { useGetGenerateActionPlanLog, useRetriggerGenerateActionPlanLog } from '@/services/generate-action-plan-log'

const { data, isLoading } = useGetGenerateActionPlanLog()
const items = computed(() => data.value ?? [])

const filterColumns = computed(() => [
  {
    value: 'trigger_type',
    label: 'Trigger Type',
    options: [
      { value: 'Manual', label: 'Manual' },
      { value: 'Scheduled', label: 'Scheduled' },
    ],
  },
  { value: 'submission_type', label: 'Submission Type' },
  {
    value: 'status',
    label: 'Status',
    options: [
      { value: 'Success', label: 'Success' },
      { value: 'Failed', label: 'Failed' },
    ],
  },
])
const { filteredItems, applyFilter, resetFilter } = useTableFilter(items)

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('sv-SE')
}

const retriggerMutation = useRetriggerGenerateActionPlanLog()
const retriggeringId = ref<string | null>(null)

async function onRetrigger(id: string) {
  retriggeringId.value = id
  try {
    await retriggerMutation.mutateAsync(id)
    toast.notify({ id: 'generate-action-plan-log-retrigger', variant: 'success', title: 'Re-trigger queued.' })
  } finally {
    retriggeringId.value = null
  }
}
</script>

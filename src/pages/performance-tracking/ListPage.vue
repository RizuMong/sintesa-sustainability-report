<template>
  <MpFlex direction="column" backgroundColor="background.stage" minHeight="100vh">
    <MpFlex direction="column" paddingX="24px" paddingTop="24px" paddingBottom="8px" backgroundColor="background.surface">
      <MpFlex justifyContent="space-between" alignItems="center">
        <MpText as="h1" size="h1">Performance Tracking</MpText>
      </MpFlex>
    </MpFlex>

    <MpFlex direction="column" paddingX="24px" paddingTop="8px" paddingBottom="24px" gap="4">
      <MpFlex gap="3" alignItems="flex-end" wrap="wrap">
        <MpFlex maxWidth="220px" flex="1">
          <MpFormControl id="performance-tracking-period">
            <MpFormLabel>Period</MpFormLabel>
            <MpSelect v-model="periodId" placeholder="All periods" is-full-width>
              <option value="">All periods</option>
              <option v-for="p in periods" :key="p.id" :value="p.id">{{ p.year }}</option>
            </MpSelect>
          </MpFormControl>
        </MpFlex>
        <MpFlex maxWidth="220px" flex="1">
          <MpFormControl id="performance-tracking-entity">
            <MpFormLabel>Entity</MpFormLabel>
            <MpSelect v-model="entityId" placeholder="All entities" is-full-width>
              <option value="">All entities</option>
              <option v-for="e in entities" :key="e.id" :value="e.id">{{ e.name }}</option>
            </MpSelect>
          </MpFormControl>
        </MpFlex>
      </MpFlex>

      <MpFlex v-if="isLoading" direction="column" gap="2">
        <MpSkeleton v-for="i in 4" :key="i" height="56px" rounded="md" />
      </MpFlex>

      <template v-else-if="rows.length">
        <MpTableContainer>
          <MpTable>
            <MpTableHead>
              <MpTableRow>
                <MpTableCell scope="col">Entity</MpTableCell>
                <MpTableCell scope="col">Period</MpTableCell>
                <MpTableCell scope="col">Submission Type</MpTableCell>
                <MpTableCell scope="col">Completion</MpTableCell>
                <MpTableCell scope="col">Status</MpTableCell>
                <MpTableCell scope="col">Action</MpTableCell>
              </MpTableRow>
            </MpTableHead>
            <MpTableBody>
              <MpTableRow v-for="(row, i) in rows" :key="`${row.entity.id}-${row.period.id}-${row.submission_type}-${i}`">
                <MpTableCell as="td" scope="row">
                  <MpFlex direction="column" gap="1">
                    {{ row.entity.name }}
                    <MpBadge v-if="row.unverified" type="announcement">Unverified / Non-Official SDG</MpBadge>
                  </MpFlex>
                </MpTableCell>
                <MpTableCell as="td" scope="row">{{ row.period.name }}</MpTableCell>
                <MpTableCell as="td" scope="row">{{ row.submission_type }}</MpTableCell>
                <MpTableCell as="td" scope="row">{{ clampCompletion(row.completion_percent) }}%</MpTableCell>
                <MpTableCell as="td" scope="row">
                  <MpFlex direction="column" gap="1" alignItems="flex-start">
                    <MpBadge for="tableStatus" :type="statusBadgeType(row.status)">{{ row.status }}</MpBadge>
                    <MpBadge v-if="row.is_overdue" type="critical">Overdue</MpBadge>
                  </MpFlex>
                </MpTableCell>
                <MpTableCell as="td" scope="row">
                  <MpButton
                    v-if="canNudge(row)"
                    size="sm"
                    variant="secondary"
                    :is-loading="nudgeMutation.isPending.value && nudgingKey === rowKey(row)"
                    @click="nudge(row)"
                  >
                    Nudge
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
import { MpFlex, MpText, MpButton, MpImage, MpSkeleton, MpFormControl, MpFormLabel, MpSelect, MpTable, MpTableHead, MpTableBody, MpTableRow, MpTableCell, MpTableContainer, MpBadge, toast } from '@mekari/pixel3'
import { useGetMasterPeriod } from '@/services/master-period'
import { useGetMasterEntity } from '@/services/master-entity'
import { useGetTrackingRows, useNudge, canNudge, clampCompletion } from '@/services/performance-tracking'

const periodId = ref('')
const entityId = ref('')

const { data: periodData } = useGetMasterPeriod()
const periods = computed(() => periodData.value ?? [])
const { data: entityData } = useGetMasterEntity()
const entities = computed(() => entityData.value ?? [])

// AC-67: "real-time" — refetchInterval is set inside useGetTrackingRows.
const { data, isLoading } = useGetTrackingRows(periodId, entityId)
const rows = computed(() => data.value ?? [])

function statusBadgeType(status: TrackingStatus) {
  if (status === 'Approved') return 'completed'
  if (status === 'Rejected') return 'critical'
  if (status === 'Submitted') return 'information'
  return 'announcement'
}

const nudgeMutation = useNudge()
const nudgingKey = ref('')
function rowKey(row: TrackingRow) {
  return `${row.entity.id}-${row.period.id}-${row.submission_type}`
}

async function nudge(row: TrackingRow) {
  nudgingKey.value = rowKey(row)
  await nudgeMutation.mutateAsync(row)
  toast.notify({ id: 'performance-tracking-nudge', variant: 'success', title: `Nudge sent to ${row.entity.name}.` })
}
</script>

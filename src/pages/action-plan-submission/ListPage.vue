<template>
  <MpFlex direction="column" backgroundColor="background.stage" minHeight="100vh">
    <MpFlex direction="column" paddingX="24px" paddingTop="24px" paddingBottom="8px" backgroundColor="background.surface">
      <MpFlex justifyContent="space-between" alignItems="center">
        <MpText as="h1" size="h1">Submit Action Plan</MpText>
      </MpFlex>
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
                <MpTableCell scope="col">No. Code</MpTableCell>
                <MpTableCell scope="col">SDG</MpTableCell>
                <MpTableCell scope="col">Key Business Action</MpTableCell>
                <MpTableCell scope="col">Action Indicator</MpTableCell>
                <MpTableCell scope="col">Status</MpTableCell>
              </MpTableRow>
            </MpTableHead>
            <MpTableBody>
              <MpTableRow v-for="row in filteredItems" :key="row.id">
                <MpTableCell as="td" scope="row" @click="goToDetail(row)" :class="css({ cursor: 'pointer' })">
                  {{ row.no_code }}
                </MpTableCell>
                <MpTableCell as="td" scope="row" @click="goToDetail(row)" :class="css({ cursor: 'pointer' })">
                  {{ row.sdg.name }}
                </MpTableCell>
                <MpTableCell as="td" scope="row" @click="goToDetail(row)" :class="css({ cursor: 'pointer' })">
                  {{ row.key_business_action }}
                </MpTableCell>
                <MpTableCell as="td" scope="row" @click="goToDetail(row)" :class="css({ cursor: 'pointer' })">
                  {{ row.action_indicator?.name ?? '—' }}
                </MpTableCell>
                <MpTableCell as="td" scope="row" @click="goToDetail(row)" :class="css({ cursor: 'pointer' })">
                  <MpBadge for="tableStatus" :type="statusBadgeType(row.status)">{{ row.status }}</MpBadge>
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
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  MpFlex,
  MpText,
  MpImage,
  MpSkeleton,
  MpTable,
  MpTableHead,
  MpTableBody,
  MpTableRow,
  MpTableCell,
  MpTableContainer,
  MpBadge,
  css,
} from '@mekari/pixel3'
import { useTableFilter } from '@/composables/useTableFilter'
import TableFilter from '@/components/TableFilter.vue'
import { useGetActionPlanSubmission } from '@/services/action-plan-submission'

const router = useRouter()

// ponytail: entity scoping enforced server-side (mirrors Stream E's approach to Review &
// Approval) — this list shows whatever the index endpoint returns for the caller's token,
// no client-side entity filter is applied as a security control.
const { data, isLoading } = useGetActionPlanSubmission()
const items = computed(() => data.value ?? [])

const filterColumns = computed(() => [
  { value: 'no_code', label: 'No. Code' },
  { value: 'sdg.name', label: 'SDG' },
  { value: 'key_business_action', label: 'Key Business Action' },
  {
    value: 'status',
    label: 'Status',
    options: (['Pending Response', 'Taken', 'Skipped'] satisfies ActionPlanItemStatus[]).map((s) => ({
      value: s,
      label: s,
    })),
  },
])
const { filteredItems, applyFilter, resetFilter } = useTableFilter(items)

function statusBadgeType(status: ActionPlanItemStatus) {
  if (status === 'Taken') return 'completed'
  if (status === 'Skipped') return 'information'
  return 'announcement'
}

function goToDetail(row: ActionPlanSubmissionItem) {
  router.push({ path: '/action-plan-submission/detail', query: { id: row.id } })
}
</script>

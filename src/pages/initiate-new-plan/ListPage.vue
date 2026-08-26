<template>
  <MpFlex direction="column" backgroundColor="background.stage" minHeight="100vh">
    <MpFlex direction="column" paddingX="24px" paddingTop="24px" paddingBottom="8px" backgroundColor="background.surface">
      <MpFlex justifyContent="space-between" alignItems="center">
        <MpText as="h1" size="h1">Initiate New Plan</MpText>
        <MpButton left-icon="add" @click="goToCreate">Create</MpButton>
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
                <MpTableCell scope="col">SDG</MpTableCell>
                <MpTableCell scope="col">Rows</MpTableCell>
                <MpTableCell scope="col">Status</MpTableCell>
                <MpTableCell scope="col">Origin</MpTableCell>
              </MpTableRow>
            </MpTableHead>
            <MpTableBody>
              <MpTableRow v-for="row in filteredItems" :key="row.id">
                <MpTableCell as="td" scope="row" @click="goToDetail(row)" :class="css({ cursor: 'pointer' })">
                  {{ sdgName(row.sdg_id) }}
                  <MpBadge v-if="row.unverified" for="tableStatus" type="announcement" marginLeft="2">
                    Unverified / Non-Official SDG
                  </MpBadge>
                </MpTableCell>
                <MpTableCell as="td" scope="row" @click="goToDetail(row)" :class="css({ cursor: 'pointer' })">
                  {{ row.rows.length }}
                </MpTableCell>
                <MpTableCell as="td" scope="row" @click="goToDetail(row)" :class="css({ cursor: 'pointer' })">
                  <MpBadge for="tableStatus" :type="statusBadgeType[row.status]">{{ row.status }}</MpBadge>
                </MpTableCell>
                <MpTableCell as="td" scope="row" @click="goToDetail(row)" :class="css({ cursor: 'pointer' })">
                  {{ entityName(row.origin_entity_id) }}
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
  MpButton,
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
import { useGetInitiatedPlans } from '@/services/initiate-new-plan'
import { useGetMasterEntity } from '@/services/master-entity'
import { useGetSdgAdoption } from '@/services/sdg-adoption'

const router = useRouter()

const { data, isLoading: isPlansLoading } = useGetInitiatedPlans()
const { data: entities, isLoading: isEntitiesLoading } = useGetMasterEntity()
const { data: sdgGoalsData, isLoading: isSdgLoading } = useGetSdgAdoption()
const sdgGoals = computed(() => sdgGoalsData.value ?? [])
const items = computed(() => data.value ?? [])

const isLoading = computed(() => isPlansLoading.value || isEntitiesLoading.value || isSdgLoading.value)

function sdgName(sdgId: string): string {
  const goal = sdgGoals.value.find((g) => g.id === sdgId)
  return goal ? `SDG ${goal.number} — ${goal.name}` : sdgId
}

function entityName(entityId: string): string {
  return (entities.value ?? []).find((e) => e.id === entityId)?.name ?? entityId
}

const statusBadgeType: Record<InitiatedPlan['status'], 'announcement' | 'information' | 'completed' | 'critical'> = {
  Active: 'completed',
  Taken: 'completed',
  'Pending Review': 'information',
}

const filterColumns = computed(() => [
  {
    value: 'status',
    label: 'Status',
    options: [
      { value: 'Active', label: 'Active' },
      { value: 'Pending Review', label: 'Pending Review' },
      { value: 'Taken', label: 'Taken' },
    ],
  },
])
const { filteredItems, applyFilter, resetFilter } = useTableFilter(items)

function goToCreate() {
  router.push('/initiate-new-plan/detail')
}

function goToDetail(row: InitiatedPlan) {
  router.push({ path: '/initiate-new-plan/detail', query: { id: row.id } })
}
</script>

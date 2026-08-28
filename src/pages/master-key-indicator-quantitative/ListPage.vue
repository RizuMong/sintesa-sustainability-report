<template>
  <MpFlex direction="column" backgroundColor="background.stage" minHeight="100vh">
    <MpFlex direction="column" paddingX="24px" paddingTop="24px" paddingBottom="8px" backgroundColor="background.surface">
      <MpFlex justifyContent="flex-end">
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
                <MpTableCell scope="col">Code</MpTableCell>
                <MpTableCell scope="col">Description</MpTableCell>
                <MpTableCell scope="col">Category</MpTableCell>
                <MpTableCell scope="col">Status</MpTableCell>
                <MpTableCell scope="col">Updated At</MpTableCell>
              </MpTableRow>
            </MpTableHead>
            <MpTableBody>
              <MpTableRow v-for="row in filteredItems" :key="row.id">
                <MpTableCell as="td" scope="row" @click="goToDetail(row)" :class="css({ cursor: 'pointer' })">
                  {{ row.code }}
                </MpTableCell>
                <MpTableCell as="td" scope="row" @click="goToDetail(row)" :class="css({ cursor: 'pointer' })">
                  {{ row.description }}
                </MpTableCell>
                <MpTableCell as="td" scope="row" @click="goToDetail(row)" :class="css({ cursor: 'pointer' })">
                  {{ row.category_id?.name }}
                </MpTableCell>
                <MpTableCell as="td" scope="row" @click="goToDetail(row)" :class="css({ cursor: 'pointer' })">
                  <MpBadge for="tableStatus" :type="(row.status ?? 'Active') === 'Active' ? 'completed' : 'announcement'">
                    {{ row.status ?? 'Active' }}
                  </MpBadge>
                </MpTableCell>
                <MpTableCell as="td" scope="row" @click="goToDetail(row)" :class="css({ cursor: 'pointer' })">
                  {{ formatDateTime(row.updated_at) }}
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
import { useGetMkiGriQuantitativeList } from '@/services/master-key-indicator-quantitative'
import { useGetMasterCategory } from '@/services/master-category'

const router = useRouter()

const { data, isLoading } = useGetMkiGriQuantitativeList()
const items = computed(() => data.value ?? [])

const { data: categoryData } = useGetMasterCategory()

const filterColumns = computed(() => [
  { value: 'code', label: 'Code' },
  { value: 'description', label: 'Description' },
  {
    value: 'category_id.name',
    label: 'Category',
    options: (categoryData.value ?? []).map((c) => ({ value: c.name, label: c.name })),
  },
  {
    value: 'status',
    label: 'Status',
    options: [
      { value: 'Active', label: 'Active' },
      { value: 'Inactive', label: 'Inactive' },
    ],
  },
])
const { filteredItems, applyFilter, resetFilter } = useTableFilter(items)

// the API answers epoch milliseconds, not an ISO string
function formatDateTime(value: number) {
  return value ? new Date(value).toLocaleString('sv-SE') : '—'
}

function goToCreate() {
  router.push('/master-key-indicator-quantitative/detail')
}

function goToDetail(row: MkiGriQuantitative) {
  router.push({ path: '/master-key-indicator-quantitative/detail', query: { id: row.id } })
}
</script>

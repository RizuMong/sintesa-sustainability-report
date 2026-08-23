<template>
  <MpFlex direction="column" backgroundColor="background.stage" minHeight="100vh">
    <MpFlex direction="column" paddingX="24px" paddingY="24px" backgroundColor="background.surface">
      <MpFlex justifyContent="flex-end">
        <MpButton left-icon="add" @click="goToCreate">Create</MpButton>
      </MpFlex>
    </MpFlex>

    <MpFlex direction="column" padding="24px" gap="2">
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
                <MpTableCell scope="col">Name</MpTableCell>
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
                  {{ row.name }}
                </MpTableCell>
                <MpTableCell as="td" scope="row" @click="goToDetail(row)" :class="css({ cursor: 'pointer' })">
                  {{ row.category.name }}
                </MpTableCell>
                <MpTableCell as="td" scope="row" @click="goToDetail(row)" :class="css({ cursor: 'pointer' })">
                  <MpBadge for="tableStatus" :type="row.status === 'Active' ? 'completed' : 'announcement'">
                    {{ row.status }}
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
import { computed, onMounted, ref } from 'vue'
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
import { masterKeyIndicatorQuantitativeApi } from '@/services/master-key-indicator-quantitative.api'
import { masterCategoryApi } from '@/services/master-category.api'
import type { MasterCategory, MkiGriQuantitativeSummary } from '@/types'

const router = useRouter()

const items = ref<MkiGriQuantitativeSummary[]>([])
const categories = ref<MasterCategory[]>([])
const isLoading = ref(false)

const filterColumns = computed(() => [
  { value: 'code', label: 'Code' },
  { value: 'name', label: 'Name' },
  {
    value: 'category.name',
    label: 'Category',
    options: categories.value.map((c) => ({ value: c.name, label: c.name })),
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

function formatDateTime(value: string) {
  const d = new Date(value)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

async function fetchAll() {
  isLoading.value = true
  const result = await masterKeyIndicatorQuantitativeApi.index()
  items.value = (result as { data: MkiGriQuantitativeSummary[] }).data
  isLoading.value = false
}

onMounted(async () => {
  categories.value = (await masterCategoryApi.index()).data
  await fetchAll()
})

function goToCreate() {
  router.push('/master-key-indicator-quantitative/detail')
}

function goToDetail(row: MkiGriQuantitativeSummary) {
  router.push({ path: '/master-key-indicator-quantitative/detail', query: { id: row.id } })
}
</script>

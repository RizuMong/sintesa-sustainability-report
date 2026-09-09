<template>
  <MpFlex direction="column" backgroundColor="background.stage" minHeight="100vh">
    <MpFlex direction="column" paddingX="24px" paddingTop="24px" paddingBottom="8px" backgroundColor="background.surface">
      <MpFlex justifyContent="space-between" alignItems="center">
        <MpText as="h1" size="h1">Master Key Indicator — Quantitative</MpText>
        <MpButton left-icon="add" @click="goToCreate">Create</MpButton>
      </MpFlex>
    </MpFlex>

    <MpFlex
      direction="column"
      flex="1"
      paddingX="24px"
      paddingTop="8px"
      paddingBottom="24px"
      gap="2"
      borderTopWidth="1px"
      borderLeftWidth="1px"
      borderColor="border.default"
      roundedTopLeft="md"
    >
      <MpFlex justifyContent="flex-start">
        <TableFilter :columns="filterColumns" @apply="applyFilter" @reset="resetFilter" />
      </MpFlex>

      <MpFlex v-if="isLoading" direction="column" gap="2">
        <MpSkeleton v-for="i in 4" :key="i" height="56px" rounded="md" />
      </MpFlex>

      <!-- A failed fetch is not an empty list: say so and offer the retry instead of implying there is no data. -->
      <MpFlex v-else-if="isError" direction="column" alignItems="center" gap="4" paddingY="20">
        <MpText size="h3" weight="semiBold">Couldn't load key indicators</MpText>
        <MpText size="label" color="text.secondary">{{ errorMessage }}</MpText>
        <MpButton variant="secondary" @click="refetch()">Retry</MpButton>
      </MpFlex>

      <!-- The table keeps its header while a filter matches nothing, so the user can see what they filtered. -->
      <MpFlex
        v-else-if="showTable"
        direction="column"
        backgroundColor="background.surface"
        borderWidth="1px"
        borderColor="border.default"
        rounded="md"
        overflow="hidden"
      >
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
              <MpTableRow
                v-for="row in pagedItems"
                :key="row.id"
                @click="goToDetail(row)"
                :class="css({ cursor: 'pointer' })"
              >
                <MpTableCell as="td" scope="row">{{ orDash(row.code) }}</MpTableCell>
                <MpTableCell as="td" scope="row">{{ orDash(row.description) }}</MpTableCell>
                <MpTableCell as="td" scope="row">{{ orDash(row.category_id?.name) }}</MpTableCell>
                <MpTableCell as="td" scope="row">
                  <MpBadge for="tableStatus" :type="(row.status ?? 'Active') === 'Active' ? 'completed' : 'announcement'">
                    {{ row.status ?? 'Active' }}
                  </MpBadge>
                </MpTableCell>
                <MpTableCell as="td" scope="row">{{ formatDate(row.updated_at) }}</MpTableCell>
              </MpTableRow>
            </MpTableBody>
          </MpTable>
        </MpTableContainer>

        <MpFlex v-if="emptyStateKind === 'filter-not-found'" direction="column" alignItems="center" flex="1" paddingTop="6" paddingBottom="10" gap="4">
          <MpImage
            :src="NOT_FOUND_ILLUSTRATION"
            alt="no matching key indicator illustration"
            layout="fixed"
            :width="200"
            :height="160"
            object-fit="contain"
            :is-show-loading="false"
          />
          <MpFlex direction="column" alignItems="center" gap="2" maxWidth="400px">
            <MpText size="h3" weight="semiBold">Key indicator not found</MpText>
            <MpText size="label" color="text.secondary">
              Recheck the filter you have applied and try filtering again.
            </MpText>
          </MpFlex>
        </MpFlex>

        <!-- Hidden below one page of rows: a pager that can only ever say "1 of 1" is noise. -->
        <MpFlex
          v-else-if="totalItems > PAGE_SIZE"
          justifyContent="space-between"
          alignItems="center"
          paddingX="16px"
          paddingY="12px"
        >
          <MpText size="label-small" color="text.secondary">
            Showing {{ rangeStart }}–{{ rangeEnd }} of {{ totalItems }}
          </MpText>
          <MpFlex alignItems="center" gap="3">
            <MpButton variant="secondary" :is-disabled="page === 1" @click="page -= 1">Previous</MpButton>
            <MpText size="label-small" color="text.secondary">Page {{ page }} of {{ totalPages }}</MpText>
            <MpButton variant="secondary" :is-disabled="page === totalPages" @click="page += 1">Next</MpButton>
          </MpFlex>
        </MpFlex>
      </MpFlex>

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
        <MpFlex direction="column" alignItems="center" gap="2" maxWidth="400px">
          <MpText size="h3" weight="semiBold">Key indicators will appear here</MpText>
          <MpText size="label" color="text.secondary">
            Add your first key indicator from the <MpText as="span" weight="semiBold">Create</MpText> button.
          </MpText>
        </MpFlex>
        <MpButton left-icon="add" @click="goToCreate">Create</MpButton>
      </MpFlex>
    </MpFlex>
  </MpFlex>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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

// ponytail: the spec's shared /not-found.png asset does not exist in this repo and Pixel MCP is not
// reachable to look up the proper not-found illustration name, so the not-found state borrows the
// blank-slate CDN image. Swap for the real asset once either is available.
const NOT_FOUND_ILLUSTRATION = 'https://cdn.mekari.design/illustration/blank-slate/NoData_PB_L_01.png'

const PAGE_SIZE = 10

const router = useRouter()

const { data, isLoading, isError, error, refetch } = useGetMkiGriQuantitativeList()
const items = computed(() => data.value ?? [])

const errorMessage = computed(
  () => error.value?.message ?? 'Something went wrong while fetching the list.',
)

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
const { filteredItems, activeFilter, applyFilter, resetFilter } = useTableFilter(items)

// TableFilter is a single column+value popover with no free-text search, so "search not found" and
// "filter not found" collapse into one variant here.
const emptyStateKind = computed<'blank-slate' | 'filter-not-found' | null>(() => {
  if (filteredItems.value.length) return null
  return activeFilter.value ? 'filter-not-found' : 'blank-slate'
})

// Blank slate replaces the table entirely; every other state keeps the header row on screen.
const showTable = computed(() => emptyStateKind.value !== 'blank-slate')

// The endpoint answers the whole list in one response, so paging happens here rather than per-request.
const page = ref(1)
const totalItems = computed(() => filteredItems.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / PAGE_SIZE)))
const rangeStart = computed(() => (page.value - 1) * PAGE_SIZE + 1)
const rangeEnd = computed(() => Math.min(page.value * PAGE_SIZE, totalItems.value))
const pagedItems = computed(() => filteredItems.value.slice(rangeStart.value - 1, rangeEnd.value))

// A shorter list (new filter, or a delete elsewhere) can leave the cursor past the end.
watch(totalPages, (pages) => {
  if (page.value > pages) page.value = pages
})
watch(activeFilter, () => {
  page.value = 1
})

// the API answers epoch milliseconds, not an ISO string
function formatDate(value: number) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function orDash(value: string | undefined | null) {
  return value?.trim() ? value : '—'
}

function goToCreate() {
  router.push('/master-key-indicator-quantitative/detail')
}

function goToDetail(row: MkiGriQuantitative) {
  router.push({ path: '/master-key-indicator-quantitative/detail', query: { id: row.id } })
}
</script>

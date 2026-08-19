<template>
  <MpFlex direction="column" backgroundColor="background.stage" minHeight="100vh">
    <MpFlex direction="column" gap="4" paddingX="24px" paddingY="24px" backgroundColor="background.surface">
      <MpFlex justifyContent="flex-end">
        <MpButton left-icon="add" @click="goToCreate">Create</MpButton>
      </MpFlex>

      <MpFlex gap="3" alignItems="center">
        <MpFlex width="280px">
          <MpInputGroup>
            <MpInputLeftAddon>
              <MpIcon name="search" size="sm" />
            </MpInputLeftAddon>
            <MpInput v-model="search" placeholder="Search by name" is-full-width />
          </MpInputGroup>
        </MpFlex>
        <MpFlex width="200px">
          <MpSelect v-model="categoryId" placeholder="All categories" is-full-width>
            <option value="">All categories</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </MpSelect>
        </MpFlex>
        <MpFlex width="160px">
          <MpSelect v-model="status" placeholder="All statuses" is-full-width>
            <option value="">All statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </MpSelect>
        </MpFlex>
        <MpButton v-if="hasActiveFilters" variant="ghost" size="sm" @click="clearFilters">Clear filters</MpButton>
      </MpFlex>
    </MpFlex>

    <MpFlex direction="column" padding="24px" gap="4">
      <MpFlex v-if="isLoading" direction="column" gap="2">
        <MpSkeleton v-for="i in 4" :key="i" height="56px" rounded="md" />
      </MpFlex>

      <template v-else-if="items.length">
        <MpTableContainer>
          <MpTable>
            <MpTableHead>
              <MpTableRow>
                <MpTableCell scope="col">Code</MpTableCell>
                <MpTableCell scope="col">Name</MpTableCell>
                <MpTableCell scope="col">Category</MpTableCell>
                <MpTableCell scope="col">Status</MpTableCell>
                <MpTableCell scope="col">Last Updated</MpTableCell>
                <MpTableCell scope="col" :class="css({ textAlign: 'right' })">Action</MpTableCell>
              </MpTableRow>
            </MpTableHead>
            <MpTableBody>
              <MpTableRow v-for="row in items" :key="row.id">
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
                <MpTableCell as="td" scope="row" :class="css({ textAlign: 'right' })">
                  <MpPopover :id="`mki-action-${row.id}`" placement="bottom-end" use-portal>
                    <MpPopoverTrigger>
                      <MpButton variant="secondary" right-icon="chevrons-down" aria-label="Row actions" />
                    </MpPopoverTrigger>
                    <MpPopoverContent>
                      <MpPopoverList>
                        <MpPopoverListItem @click="goToDetail(row)">Edit</MpPopoverListItem>
                        <MpPopoverListItem @click="askDelete(row.id)">Delete</MpPopoverListItem>
                      </MpPopoverList>
                    </MpPopoverContent>
                  </MpPopover>
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

    <MpModal :is-open="Boolean(pendingDeleteId)" size="md" @close="pendingDeleteId = undefined">
      <MpModalContent>
        <MpModalHeader>
          Delete this?
          <MpModalCloseButton />
        </MpModalHeader>
        <MpModalBody>
          <MpText size="label">This will set the status to Inactive. It can still be viewed and re-activated.</MpText>
        </MpModalBody>
        <MpModalFooter>
          <MpButtonGroup>
            <MpButton variant="ghost" @click="pendingDeleteId = undefined">Cancel</MpButton>
            <MpButton variant="danger" @click="confirmDelete">Delete</MpButton>
          </MpButtonGroup>
        </MpModalFooter>
      </MpModalContent>
      <MpModalOverlay />
    </MpModal>
  </MpFlex>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  MpFlex,
  MpText,
  MpButton,
  MpButtonGroup,
  MpInput,
  MpInputGroup,
  MpInputLeftAddon,
  MpSelect,
  MpIcon,
  MpImage,
  MpSkeleton,
  MpTable,
  MpTableHead,
  MpTableBody,
  MpTableRow,
  MpTableCell,
  MpTableContainer,
  MpBadge,
  MpPopover,
  MpPopoverTrigger,
  MpPopoverContent,
  MpPopoverList,
  MpPopoverListItem,
  MpModal,
  MpModalContent,
  MpModalHeader,
  MpModalBody,
  MpModalFooter,
  MpModalOverlay,
  MpModalCloseButton,
  css,
} from '@mekari/pixel3'
import { masterKeyIndicatorQuantitativeApi } from '@/services/master-key-indicator-quantitative.api'
import { masterCategoryApi } from '@/services/master-category.api'
import type { MasterCategory, MkiGriQuantitativeSummary, MkiStatus } from '@/types'

const router = useRouter()

const items = ref<MkiGriQuantitativeSummary[]>([])
const categories = ref<MasterCategory[]>([])
const isLoading = ref(false)
const search = ref('')
const categoryId = ref('')
const status = ref<MkiStatus | ''>('')

const hasActiveFilters = computed(() => Boolean(search.value || categoryId.value || status.value))

function formatDateTime(value: string) {
  const d = new Date(value)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function clearFilters() {
  search.value = ''
  categoryId.value = ''
  status.value = ''
}

async function fetchAll() {
  isLoading.value = true
  const result = await masterKeyIndicatorQuantitativeApi.index({
    search: search.value || undefined,
    category_id: categoryId.value || undefined,
    status: status.value || undefined,
  })
  items.value = (result as { data: MkiGriQuantitativeSummary[] }).data
  isLoading.value = false
}

onMounted(async () => {
  categories.value = (await masterCategoryApi.index()).data
  await fetchAll()
})

watch([search, categoryId, status], fetchAll)

function goToCreate() {
  router.push('/master-key-indicator-quantitative/detail')
}

function goToDetail(row: MkiGriQuantitativeSummary) {
  router.push({ path: '/master-key-indicator-quantitative/detail', query: { id: row.id } })
}

const pendingDeleteId = ref<string>()

function askDelete(id: string) {
  pendingDeleteId.value = id
}

async function confirmDelete() {
  if (!pendingDeleteId.value) return
  await masterKeyIndicatorQuantitativeApi.remove({ id: pendingDeleteId.value })
  pendingDeleteId.value = undefined
  await fetchAll()
}
</script>

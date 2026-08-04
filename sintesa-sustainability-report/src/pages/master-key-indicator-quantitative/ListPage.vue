<template>
  <MpFlex direction="column" backgroundColor="background.stage" minHeight="100vh">
    <MpFlex
      justifyContent="space-between"
      alignItems="center"
      paddingX="24px"
      paddingY="24px"
      backgroundColor="background.surface"
    >
      <MpText as="h1" size="h1">Master Key Indicator Quantitative</MpText>
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
                <MpTableCell scope="col">Nama indikator</MpTableCell>
                <MpTableCell scope="col">Kode</MpTableCell>
                <MpTableCell scope="col">Kategori</MpTableCell>
                <MpTableCell scope="col">Satuan</MpTableCell>
                <MpTableCell scope="col" :class="css({ textAlign: 'right' })">Aksi</MpTableCell>
              </MpTableRow>
            </MpTableHead>
            <MpTableBody>
              <MpTableRow v-for="row in items" :key="row.id">
                <MpTableCell as="td" scope="row" @click="goToDetail(row.id)" :class="css({ cursor: 'pointer' })">
                  {{ row.name }}
                </MpTableCell>
                <MpTableCell as="td" scope="row" @click="goToDetail(row.id)" :class="css({ cursor: 'pointer' })">
                  {{ row.code }}
                </MpTableCell>
                <MpTableCell as="td" scope="row" @click="goToDetail(row.id)" :class="css({ cursor: 'pointer' })">
                  {{ row.category }}
                </MpTableCell>
                <MpTableCell as="td" scope="row" @click="goToDetail(row.id)" :class="css({ cursor: 'pointer' })">
                  {{ row.unit }}
                </MpTableCell>
                <MpTableCell as="td" scope="row" :class="css({ textAlign: 'right' })">
                  <MpPopover :id="`mki-action-${row.id}`" placement="bottom-end" use-portal>
                    <MpPopoverTrigger>
                      <MpButton variant="secondary" right-icon="chevrons-down" aria-label="Row actions" />
                    </MpPopoverTrigger>
                    <MpPopoverContent>
                      <MpPopoverList>
                        <MpPopoverListItem @click="goToDetail(row.id)">View detail</MpPopoverListItem>
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
        <MpText size="h3" weight="semiBold">No indicator available yet</MpText>
      </MpFlex>
    </MpFlex>

    <MpModal :is-open="Boolean(pendingDeleteId)" size="md" @close="pendingDeleteId = undefined">
      <MpModalContent>
        <MpModalHeader>
          Delete this indicator?
          <MpModalCloseButton />
        </MpModalHeader>
        <MpModalBody>
          <MpText size="label">This will permanently remove the indicator. This action cannot be undone.</MpText>
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
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  MpFlex,
  MpText,
  MpButton,
  MpButtonGroup,
  MpImage,
  MpSkeleton,
  MpTable,
  MpTableHead,
  MpTableBody,
  MpTableRow,
  MpTableCell,
  MpTableContainer,
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
import { useCrud } from '@/composables/useCrud'
import { masterKeyIndicatorQuantitativeApi } from '@/services/master-key-indicator-quantitative.api'
import type { MasterKeyIndicatorQuantitative } from '@/types'

const router = useRouter()
const { items, loading: isLoading, fetchAll, remove } = useCrud<MasterKeyIndicatorQuantitative>(
  masterKeyIndicatorQuantitativeApi
)

const pendingDeleteId = ref<string>()

onMounted(fetchAll)

function goToDetail(id: string) {
  router.push(`/master-key-indicator-quantitative/${id}`)
}

function askDelete(id: string) {
  pendingDeleteId.value = id
}

async function confirmDelete() {
  if (!pendingDeleteId.value) return
  await remove(pendingDeleteId.value)
  pendingDeleteId.value = undefined
}
</script>

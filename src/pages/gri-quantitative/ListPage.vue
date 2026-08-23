<template>
  <MpFlex direction="column" backgroundColor="background.stage" minHeight="100vh">
    <MpFlex
      justifyContent="space-between"
      alignItems="center"
      paddingX="24px"
      paddingY="24px"
      backgroundColor="background.surface"
    >
      <MpText as="h1" size="h1">GRI Quantitative</MpText>
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
                <MpTableCell scope="col">Template name</MpTableCell>
                <MpTableCell scope="col">Period</MpTableCell>
                <MpTableCell scope="col">Status</MpTableCell>
              </MpTableRow>
            </MpTableHead>
            <MpTableBody>
              <MpTableRow v-for="row in filteredItems" :key="row.id">
                <MpTableCell as="td" scope="row" @click="goToDetail(row)" :class="css({ cursor: 'pointer' })">
                  {{ row.templateName }}
                </MpTableCell>
                <MpTableCell as="td" scope="row" @click="goToDetail(row)" :class="css({ cursor: 'pointer' })">
                  {{ row.period }}
                </MpTableCell>
                <MpTableCell as="td" scope="row" @click="goToDetail(row)" :class="css({ cursor: 'pointer' })">
                  <MpBadge for="tableStatus" type="information">{{ row.status }}</MpBadge>
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
  </MpFlex>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
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
import { useCrud } from '@/composables/useCrud'
import { useTableFilter } from '@/composables/useTableFilter'
import TableFilter from '@/components/TableFilter.vue'
import { griQuantitativeApi } from '@/services/gri-quantitative.api'
import { evaluationStatusOptions, type GriQuantitativeTemplate } from '@/types'

const router = useRouter()
const { items, loading: isLoading, fetchAll } = useCrud<GriQuantitativeTemplate>(griQuantitativeApi)

const filterColumns = [
  { value: 'templateName', label: 'Template name' },
  { value: 'period', label: 'Period' },
  { value: 'status', label: 'Status', options: evaluationStatusOptions },
]
const { filteredItems, applyFilter, resetFilter } = useTableFilter(items)

onMounted(fetchAll)

function goToDetail(row: GriQuantitativeTemplate) {
  router.push({ path: '/gri-quantitative/detail', state: { record: { ...row } } })
}
</script>

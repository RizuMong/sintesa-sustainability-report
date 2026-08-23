<template>
  <MpFlex direction="column" backgroundColor="background.stage" minHeight="100vh">
    <MpFlex
      justifyContent="space-between"
      alignItems="center"
      paddingX="24px"
      paddingY="24px"
      backgroundColor="background.surface"
    >
      <MpFlex direction="column">
        <MpText size="label-small" color="text.secondary">Evaluate GRI Quantitative</MpText>
        <MpText as="h1" size="h1">Requestor</MpText>
      </MpFlex>
      <MpButton left-icon="add" @click="openCreate = true">New evaluation</MpButton>
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
                <MpTableCell scope="col">Indikator</MpTableCell>
                <MpTableCell scope="col">Periode</MpTableCell>
                <MpTableCell scope="col">Status</MpTableCell>
              </MpTableRow>
            </MpTableHead>
            <MpTableBody>
              <MpTableRow v-for="row in filteredItems" :key="row.id">
                <MpTableCell as="td" scope="row" @click="goToDetail(row)" :class="css({ cursor: 'pointer' })">
                  {{ row.indicator }}
                </MpTableCell>
                <MpTableCell as="td" scope="row" @click="goToDetail(row)" :class="css({ cursor: 'pointer' })">
                  {{ row.period }}
                </MpTableCell>
                <MpTableCell as="td" scope="row" @click="goToDetail(row)" :class="css({ cursor: 'pointer' })">
                  <MpBadge for="tableStatus" :type="statusBadgeType[row.status]">{{ row.status }}</MpBadge>
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
        <MpFlex direction="column" alignItems="center" gap="1">
          <MpText size="h3" weight="semiBold">No evaluation yet</MpText>
          <MpText size="label" color="text.secondary">Create your first GRI quantitative evaluation.</MpText>
        </MpFlex>
        <MpButton left-icon="add" @click="openCreate = true">New evaluation</MpButton>
      </MpFlex>
    </MpFlex>

    <MpModal :is-open="openCreate" size="md" @close="openCreate = false">
      <MpModalContent>
        <MpModalHeader>
          New evaluation
          <MpModalCloseButton />
        </MpModalHeader>
        <MpModalBody>
          <MpFlex direction="column" gap="4">
            <MpFormControl id="indicator" is-required>
              <MpFormLabel>Indikator</MpFormLabel>
              <MpInput v-model="form.indicator" placeholder="GHG Emission Scope 1" />
            </MpFormControl>
            <MpFormControl id="period" is-required>
              <MpFormLabel>Periode</MpFormLabel>
              <MpInput v-model="form.period" placeholder="FY2026 Q1" />
            </MpFormControl>
            <MpFormControl id="value" is-required>
              <MpFormLabel>Nilai</MpFormLabel>
              <MpInput v-model="form.value" placeholder="1.250 tCO2e" />
            </MpFormControl>
          </MpFlex>
        </MpModalBody>
        <MpModalFooter>
          <MpButtonGroup>
            <MpButton variant="ghost" @click="openCreate = false">Cancel</MpButton>
            <MpButton @click="createDraft">Save as draft</MpButton>
          </MpButtonGroup>
        </MpModalFooter>
      </MpModalContent>
      <MpModalOverlay />
    </MpModal>
  </MpFlex>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  MpFlex,
  MpText,
  MpButton,
  MpButtonGroup,
  MpBadge,
  MpImage,
  MpSkeleton,
  MpTable,
  MpTableHead,
  MpTableBody,
  MpTableRow,
  MpTableCell,
  MpTableContainer,
  MpModal,
  MpModalContent,
  MpModalHeader,
  MpModalBody,
  MpModalFooter,
  MpModalOverlay,
  MpModalCloseButton,
  MpFormControl,
  MpFormLabel,
  MpInput,
  css,
  toast,
} from '@mekari/pixel3'
import { useCrud } from '@/composables/useCrud'
import { useTableFilter } from '@/composables/useTableFilter'
import TableFilter from '@/components/TableFilter.vue'
import { evaluateGriQuantitativeApi } from '@/services/evaluate-gri-quantitative.api'
import type { EvaluationGriQuantitative, EvaluationStatus } from '@/types'

const statusBadgeType: Record<EvaluationStatus, 'announcement' | 'information' | 'completed' | 'critical'> = {
  draft: 'announcement',
  submitted: 'information',
  approved: 'completed',
  rejected: 'critical',
}

const router = useRouter()
const { items, loading: isLoading, fetchAll, create } = useCrud<EvaluationGriQuantitative>(
  evaluateGriQuantitativeApi
)

const filterColumns = [
  { value: 'indicator', label: 'Indikator' },
  { value: 'period', label: 'Periode' },
  {
    value: 'status',
    label: 'Status',
    options: [
      { value: 'draft', label: 'draft' },
      { value: 'submitted', label: 'submitted' },
      { value: 'approved', label: 'approved' },
      { value: 'rejected', label: 'rejected' },
    ],
  },
]
const { filteredItems, applyFilter, resetFilter } = useTableFilter(items)

const openCreate = ref(false)
const form = reactive({ indicator: '', period: '', value: '' })

onMounted(fetchAll)

function goToDetail(row: EvaluationGriQuantitative) {
  router.push({ path: '/evaluate-gri-quantitative/detail', state: { record: { ...row } } })
}

async function createDraft() {
  if (!form.indicator || !form.period || !form.value) return
  await create({
    id: crypto.randomUUID(),
    indicator: form.indicator,
    period: form.period,
    value: form.value,
    requestor: 'You',
    note: '',
    status: 'draft',
    actor: 'You',
    updatedAt: new Date().toISOString(),
  })
  form.indicator = ''
  form.period = ''
  form.value = ''
  openCreate.value = false
  toast.notify({ id: 'evaluate-create-draft', variant: 'success', title: 'Draft created.' })
}
</script>

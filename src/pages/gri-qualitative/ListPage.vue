<template>
  <MpFlex direction="column" backgroundColor="background.stage" minHeight="100vh">
    <MpFlex
      justifyContent="space-between"
      alignItems="center"
      paddingX="24px"
      paddingTop="24px"
      paddingBottom="8px"
      backgroundColor="background.surface"
    >
      <MpFlex direction="column">
        <MpText size="label-small" color="text.secondary">GRI Submission</MpText>
        <MpText as="h1" size="h1">Qualitative</MpText>
      </MpFlex>
      <MpButton left-icon="add" @click="openCreate = true">New submission</MpButton>
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
                <MpTableCell scope="col">Entity</MpTableCell>
                <MpTableCell scope="col">Period</MpTableCell>
                <MpTableCell scope="col">Template</MpTableCell>
                <MpTableCell scope="col">Status</MpTableCell>
              </MpTableRow>
            </MpTableHead>
            <MpTableBody>
              <MpTableRow v-for="row in filteredItems" :key="row.id">
                <MpTableCell as="td" scope="row" @click="goToDetail(row)" :class="css({ cursor: 'pointer' })">
                  {{ row.entity_id.name }}
                </MpTableCell>
                <MpTableCell as="td" scope="row" @click="goToDetail(row)" :class="css({ cursor: 'pointer' })">
                  {{ row.period_id.name }}
                </MpTableCell>
                <MpTableCell as="td" scope="row" @click="goToDetail(row)" :class="css({ cursor: 'pointer' })">
                  {{ row.template_id.name }}
                </MpTableCell>
                <MpTableCell as="td" scope="row" @click="goToDetail(row)" :class="css({ cursor: 'pointer' })">
                  <MpBadge for="tableStatus" :type="statusBadgeType[row.flow_status]">{{ row.flow_status }}</MpBadge>
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
          <MpText size="h3" weight="semiBold">No submission yet</MpText>
          <MpText size="label" color="text.secondary">Create your first GRI qualitative submission.</MpText>
        </MpFlex>
        <MpButton left-icon="add" @click="openCreate = true">New submission</MpButton>
      </MpFlex>
    </MpFlex>

    <MpModal :is-open="openCreate" size="md" @close="openCreate = false">
      <MpModalContent>
        <MpModalHeader>
          New submission
          <MpModalCloseButton />
        </MpModalHeader>
        <MpModalBody>
          <MpFlex direction="column" gap="4">
            <MpFormControl id="create-entity" is-required>
              <MpFormLabel>Entity</MpFormLabel>
              <MpSelect v-model="form.entity_id" is-full-width>
                <option value="" disabled>Select entity</option>
                <option v-for="entity in entities" :key="entity.id" :value="entity.id">{{ entity.name }}</option>
              </MpSelect>
            </MpFormControl>
            <MpFormControl id="create-period" is-required>
              <MpFormLabel>Period</MpFormLabel>
              <MpSelect v-model="form.period_id" is-full-width>
                <option value="" disabled>Select period</option>
                <option v-for="period in periods" :key="period.id" :value="period.id">{{ period.year }}</option>
              </MpSelect>
            </MpFormControl>
            <!-- ponytail: no GRI_QUAL template lookup module exists yet (owned by Stream A's
                 gri-release module, category GRI_QUAL, status Published) — raw id input as a
                 stand-in until it lands, swap to a MpSelect at merge. -->
            <MpFormControl id="create-template" is-required>
              <MpFormLabel>Template ID</MpFormLabel>
              <MpInput v-model="form.template_id" placeholder="Published GRI_QUAL template id" />
            </MpFormControl>
          </MpFlex>
        </MpModalBody>
        <MpModalFooter>
          <MpButtonGroup>
            <MpButton variant="ghost" @click="openCreate = false">Cancel</MpButton>
            <MpButton :is-disabled="!canCreate || createMutation.isPending.value" @click="createDraft">
              Save as draft
            </MpButton>
          </MpButtonGroup>
        </MpModalFooter>
      </MpModalContent>
      <MpModalOverlay />
    </MpModal>
  </MpFlex>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
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
  MpSelect,
  css,
  toast,
} from '@mekari/pixel3'
import { useTableFilter } from '@/composables/useTableFilter'
import TableFilter from '@/components/TableFilter.vue'
import { useGetGriQualSubmissions, useCreateGriQualSubmission } from '@/services/evaluate-gri-qualitative'
import { useGetMasterEntity } from '@/services/master-entity'
import { useGetMasterPeriod } from '@/services/master-period'

// inline status->badge map, per sibling list pages (CLAUDE.md: no shared badge util)
const statusBadgeType: Record<SubmissionFlowStatus, 'announcement' | 'information' | 'completed' | 'critical'> = {
  draft: 'announcement',
  submitted: 'information',
  approved: 'completed',
  rejected: 'critical',
  cancelled: 'critical',
}

const router = useRouter()

const { data, isLoading } = useGetGriQualSubmissions()
const items = computed(() => data.value ?? [])

const { data: entityData } = useGetMasterEntity()
const entities = computed(() => (entityData.value ?? []).filter((e) => e.status === 'Active'))
const { data: periodData } = useGetMasterPeriod()
const periods = computed(() => (periodData.value ?? []).filter((p) => p.status === 'Active'))

const filterColumns = computed(() => [
  { value: 'entity_id.name', label: 'Entity' },
  { value: 'period_id.name', label: 'Period' },
  { value: 'template_id.name', label: 'Template' },
  {
    value: 'flow_status',
    label: 'Status',
    options: (Object.keys(statusBadgeType) as SubmissionFlowStatus[]).map((value) => ({ value, label: value })),
  },
])
const { filteredItems, applyFilter, resetFilter } = useTableFilter(items)

const openCreate = ref(false)
const form = reactive({ entity_id: '', period_id: '', template_id: '' })
const canCreate = computed(() => Boolean(form.entity_id && form.period_id && form.template_id))

const createMutation = useCreateGriQualSubmission()

async function createDraft() {
  if (!canCreate.value) return
  const created = await createMutation.mutateAsync({
    entity_id: form.entity_id,
    period_id: form.period_id,
    template_id: form.template_id,
  })
  form.entity_id = ''
  form.period_id = ''
  form.template_id = ''
  openCreate.value = false
  toast.notify({ id: 'gri-qualitative-create-draft', variant: 'success', title: 'Draft created.' })
  router.push({ path: '/gri-qualitative/detail', query: { id: created.id } })
}

function goToDetail(row: GriQualSubmission) {
  router.push({ path: '/gri-qualitative/detail', query: { id: row.id } })
}
</script>

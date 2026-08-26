<template>
  <MpFlex direction="column" backgroundColor="background.surface" minHeight="100vh">
    <MpFlex justifyContent="space-between" alignItems="center" paddingX="24px" paddingY="24px">
      <MpFlex direction="row" gap="3">
        <MpButton variant="ghost" left-icon="arrows-left" aria-label="Back" @click="router.back()" />
        <MpFlex direction="column" alignItems="flex-start">
          <MpButton variant="textLink" as="a" href="#/initiate-new-plan">Initiate New Plan</MpButton>
          <MpText as="h1" size="h1">{{ isView ? sdgName(current?.sdg_id) : 'Create' }}</MpText>
        </MpFlex>
      </MpFlex>
    </MpFlex>

    <MpFlex
      direction="column"
      flex="1"
      gap="6"
      backgroundColor="background.stage"
      borderTopWidth="1px"
      borderLeftWidth="1px"
      borderColor="border.default"
      roundedTopLeft="md"
      padding="24px"
    >
      <MpFlex v-if="isLoading" direction="column" gap="2">
        <MpSkeleton v-for="i in 4" :key="i" height="56px" rounded="md" />
      </MpFlex>

      <MpFlex v-else-if="isView && !current" direction="column" gap="2">
        <MpText size="label">Plan not found.</MpText>
      </MpFlex>

      <MpFlex v-else direction="column" gap="6" maxWidth="760px">
        <!-- read-only view of an already-initiated plan -->
        <template v-if="isView && current">
          <MpBadge v-if="current.unverified" for="tableStatus" type="announcement">Unverified / Non-Official SDG</MpBadge>
          <MpBanner :variant="current.status === 'Pending Review' ? 'warning' : 'info'">
            <MpBannerDescription>
              <template v-if="current.status === 'Pending Review'">
                This plan was proposed for a not-yet-Adopted SDG and is held for Holding review. It stays marked
                Unverified / Non-Official even after approval (FSD 2.12, AC-104).
              </template>
              <template v-else>
                This plan is Active — its SDG was already Adopted, so it went live with no approval step.
              </template>
            </MpBannerDescription>
          </MpBanner>

          <MpFlex gap="6">
            <MpFormControl id="inp-view-entity" flex="1" is-disabled>
              <MpFormLabel>Origin Entity</MpFormLabel>
              <MpInput :model-value="entityName(current.origin_entity_id)" is-disabled />
            </MpFormControl>
            <MpFormControl id="inp-view-status" flex="1" is-disabled>
              <MpFormLabel>Status</MpFormLabel>
              <MpInput :model-value="current.status" is-disabled />
            </MpFormControl>
          </MpFlex>

          <MpDivider />
          <RowsTable :rows="current.rows" :pillars="pillars" :indicators="indicators" read-only />

          <MpFlex gap="3">
            <MpButton variant="secondary" left-icon="download" @click="downloadPdf">Download PDF</MpButton>
            <MpButton variant="secondary" left-icon="download" @click="downloadExcel">Download Excel</MpButton>
          </MpFlex>
        </template>

        <!-- create form -->
        <template v-else>
          <MpFormControl id="inp-sdg" is-required>
            <MpFormLabel>SDG</MpFormLabel>
            <MpSelect v-model="form.sdg_id" placeholder="Select SDG" is-full-width>
              <option value="" disabled>Select SDG</option>
              <option v-for="g in sdgGoals" :key="g.id" :value="g.id">
                SDG {{ g.number }} — {{ g.name }}{{ g.adopted ? '' : ' (requires Holding approval)' }}
              </option>
            </MpSelect>
          </MpFormControl>

          <MpBanner v-if="form.sdg_id" :variant="governance.needs_approval ? 'warning' : 'info'">
            <MpBannerDescription>
              <template v-if="governance.needs_approval">
                This SDG isn't Adopted yet — saving creates a <strong>Pending Review</strong> plan sent to the Holding
                approval queue, marked <strong>Unverified / Non-Official</strong> permanently (AC-101/102/104).
              </template>
              <template v-else>
                This SDG is already Adopted — saving sets this plan <strong>Active</strong> immediately, no approval
                needed (AC-98/99).
              </template>
            </MpBannerDescription>
          </MpBanner>

          <MpFormControl id="inp-entity" is-required>
            <MpFormLabel>Origin Entity</MpFormLabel>
            <!-- ponytail: no session-derived "current entity" exists yet in useOfficelessAuth; picked
                 manually like every other entity_id field in this app until that lands. -->
            <MpSelect v-model="form.origin_entity_id" placeholder="Select entity" is-full-width>
              <option value="" disabled>Select entity</option>
              <option v-for="e in activeEntities" :key="e.id" :value="e.id">{{ e.name }}</option>
            </MpSelect>
          </MpFormControl>

          <MpDivider />
          <RowsTable v-model:rows="form.rows" :pillars="pillars" :indicators="indicators" />

          <MpFlex justifyContent="flex-end" gap="3">
            <MpButton variant="ghost" @click="router.push('/initiate-new-plan')">Close</MpButton>
            <MpButton :is-disabled="!canSave || isSaving" @click="save">Create</MpButton>
          </MpFlex>
        </template>
      </MpFlex>
    </MpFlex>
  </MpFlex>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  MpFlex,
  MpText,
  MpButton,
  MpInput,
  MpSelect,
  MpFormControl,
  MpFormLabel,
  MpBadge,
  MpBanner,
  MpBannerDescription,
  MpDivider,
  MpSkeleton,
  toast,
} from '@mekari/pixel3'
import { useCreateInitiatedPlan, useGetInitiatedPlan } from '@/services/initiate-new-plan'
import { resolveInitiatedPlanGovernance } from '@/services/initiate-new-plan/validation'
import { useGetMasterEntity } from '@/services/master-entity'
import { useGetMasterPillar } from '@/services/master-pillar'
import { useGetMkiSdgList } from '@/services/mki-sdg'
import { useGetSdgAdoption } from '@/services/sdg-adoption'
import RowsTable, { type EditableRow } from './RowsTable.vue'

const route = useRoute()
const router = useRouter()

const id = route.query.id as string | undefined
const isView = computed(() => Boolean(id))

const { data: current, isLoading: isPlanLoading } = useGetInitiatedPlan(id)
const { data: entities, isLoading: isEntitiesLoading } = useGetMasterEntity()
const { data: pillars, isLoading: isPillarsLoading } = useGetMasterPillar()
const { data: indicators, isLoading: isIndicatorsLoading } = useGetMkiSdgList()

const activeEntities = computed(() => (entities.value ?? []).filter((e) => e.status === 'Active'))

const { data: sdgGoalsData, isLoading: isSdgLoading } = useGetSdgAdoption()
const sdgGoals = computed(() => sdgGoalsData.value ?? [])

const isLoading = computed(
  () =>
    (isView.value && isPlanLoading.value) ||
    isEntitiesLoading.value ||
    isPillarsLoading.value ||
    isIndicatorsLoading.value ||
    isSdgLoading.value,
)

function sdgName(sdgId: string | undefined): string {
  if (!sdgId) return 'Create'
  const goal = sdgGoals.value.find((g) => g.id === sdgId)
  return goal ? `SDG ${goal.number} — ${goal.name}` : sdgId
}

function entityName(entityId: string): string {
  return (entities.value ?? []).find((e) => e.id === entityId)?.name ?? entityId
}

const form = reactive({
  sdg_id: '',
  origin_entity_id: '',
  rows: [] as EditableRow[],
})

const governance = computed(() => {
  const goal = sdgGoals.value.find((g) => g.id === form.sdg_id)
  return resolveInitiatedPlanGovernance(Boolean(goal?.adopted))
})

const canSave = computed(
  () =>
    Boolean(form.sdg_id && form.origin_entity_id && form.rows.length) &&
    form.rows.every((row) => row.no_code.trim() && row.pillar_id && row.key_business_action.trim()),
)

const createMutation = useCreateInitiatedPlan()
const isSaving = computed(() => createMutation.isPending.value)

async function save() {
  if (!canSave.value) return
  const goal = sdgGoals.value.find((g) => g.id === form.sdg_id)
  await createMutation.mutateAsync({
    sdg_id: form.sdg_id,
    sdg_adopted: Boolean(goal?.adopted),
    origin_entity_id: form.origin_entity_id,
    rows: form.rows.map((row, i) => ({
      id: `row-${i}`,
      no_code: row.no_code,
      pillar_id: row.pillar_id,
      key_business_action: row.key_business_action,
      detail_action_solution: row.detail_action_solution,
      action_indicator: row.action_indicator_id
        ? { id: row.action_indicator_id, name: indicators.value?.find((mki) => mki.id === row.action_indicator_id)?.indicator_name ?? '' }
        : null,
      alignment: row.alignment,
      created_by_level: 'Subsidiary',
      taken_by_count: 0,
    })),
  })
  toast.notify({ id: 'initiate-new-plan-create', variant: 'success', title: 'Plan created.' })
  router.push('/initiate-new-plan')
}

// ponytail: PDF/Excel generation is backend-side, same treatment as Stream F (AC-100) — buttons
// call the (unconfirmed) /v1/initiate-new-plan/export?format=pdf|xlsx endpoint.
function downloadPdf() {
  if (current.value) window.open(`/v1/initiate-new-plan/export?format=pdf&id=${current.value.id}`, '_blank')
}
function downloadExcel() {
  if (current.value) window.open(`/v1/initiate-new-plan/export?format=xlsx&id=${current.value.id}`, '_blank')
}
</script>

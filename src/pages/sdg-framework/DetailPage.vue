<template>
  <MpFlex direction="column" backgroundColor="background.surface" minHeight="100vh">
    <MpFlex justifyContent="space-between" alignItems="center" paddingX="24px" paddingY="24px">
      <MpFlex direction="row" gap="3">
        <MpButton variant="ghost" left-icon="arrows-left" aria-label="Back" @click="router.back()" />
        <MpFlex direction="column" alignItems="flex-start">
          <MpButton variant="textLink" as="a" href="#/sdg-framework">SDG Framework</MpButton>
          <MpText as="h1" size="h1">{{ isEdit ? sdgName(form.sdg_id) || 'Edit' : 'Create' }}</MpText>
        </MpFlex>
      </MpFlex>
      <MpButton
        v-if="isEdit && current?.status === 'Draft'"
        variant="ghost"
        left-icon="upload"
        @click="publish"
      >
        Publish
      </MpButton>
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
      <MpFlex v-if="isLoading" direction="column" gap="2" flex="1">
        <MpSkeleton v-for="i in 4" :key="i" height="56px" rounded="md" />
      </MpFlex>

      <MpFlex v-else direction="column" gap="6">
        <MpFlex direction="column" gap="6" maxWidth="480px">
          <MpFormControl id="sdg-framework-parent" is-required>
            <MpFormLabel>SDG Parent</MpFormLabel>
            <MpSelect v-model="form.sdg_id" placeholder="Select an adopted SDG" is-full-width :is-disabled="isPublished">
              <option value="" disabled>Select an adopted SDG</option>
              <option v-for="g in adoptedGoals" :key="g.id" :value="g.id">Goal {{ g.number }} — {{ g.name }}</option>
            </MpSelect>
          </MpFormControl>

          <MpFormControl id="sdg-framework-impact-type" is-required>
            <MpFormLabel>Impact Type</MpFormLabel>
            <MpSelect v-model="form.impact_type" placeholder="Select impact type" is-full-width :is-disabled="isPublished">
              <option value="" disabled>Select impact type</option>
              <option value="Operation Impact">Operation Impact</option>
              <option value="Investment Impact" :disabled="!investmentImpactAllowed">Investment Impact</option>
            </MpSelect>
            <MpText v-if="!investmentImpactAllowed" size="label-small" color="text.secondary">
              Investment Impact requires the entity scope to include a whitelisted entity.
            </MpText>
          </MpFormControl>

          <MpFlex alignItems="center" justifyContent="space-between">
            <MpText size="label" weight="semiBold">Applied to All Entity</MpText>
            <MpToggle v-model:is-checked="form.is_applied_to_all_entity" :is-disabled="isPublished" />
          </MpFlex>

          <MpFormControl
            v-if="!form.is_applied_to_all_entity"
            id="sdg-framework-entities"
            is-required
            :is-invalid="!applicableEntitiesValid"
          >
            <MpFormLabel>Applicable Entities</MpFormLabel>
            <MpFlex direction="column" gap="2">
              <MpText v-if="!activeEntities.length" size="label" color="text.secondary">No active entities available.</MpText>
              <MpCheckbox
                v-for="entity in activeEntities"
                :key="entity.id"
                v-model="form.applicable_entity_ids"
                :value="entity.id"
                :is-disabled="isPublished"
                :id="`sdg-framework-entity-${entity.id}`"
              >
                {{ entity.name }}
              </MpCheckbox>
            </MpFlex>
            <MpFormErrorMessage v-if="!applicableEntitiesValid">Select at least one entity.</MpFormErrorMessage>
          </MpFormControl>
        </MpFlex>

        <MpDivider />

        <MpFlex direction="column" gap="4">
          <MpFlex justifyContent="space-between" alignItems="center">
            <MpText size="h3" weight="semiBold">Action Plan Matrix</MpText>
            <MpButton size="sm" variant="secondary" left-icon="add" :is-disabled="isPublished" @click="addRow">
              Add Row
            </MpButton>
          </MpFlex>

          <MpFlex
            v-for="(row, i) in form.rows"
            :key="row.id"
            direction="column"
            gap="3"
            padding="16px"
            borderWidth="1px"
            borderColor="border.default"
            rounded="md"
          >
            <MpFlex justifyContent="space-between" alignItems="center">
              <MpText size="label" weight="semiBold">Row {{ i + 1 }}</MpText>
              <MpButton
                v-if="!isPublished"
                variant="ghost"
                left-icon="delete"
                aria-label="Remove row"
                :is-disabled="!canDeleteMatrixRow(row)"
                @click="removeRow(i)"
              />
            </MpFlex>
            <MpText v-if="!canDeleteMatrixRow(row)" size="label-small" color="text.secondary">
              Locked — already taken by {{ row.taken_by_count }} subsidiar{{ row.taken_by_count === 1 ? 'y' : 'ies' }}.
            </MpText>

            <MpFormControl :id="`sdg-framework-row-code-${i}`" is-required :is-invalid="isDuplicateCode(row)">
              <MpFormLabel>No. Code</MpFormLabel>
              <MpInput v-model="row.no_code" placeholder="e.g. AP-01" :is-disabled="isPublished" />
              <MpFormErrorMessage v-if="isDuplicateCode(row)">Code already used by another row.</MpFormErrorMessage>
            </MpFormControl>

            <MpFormControl :id="`sdg-framework-row-pillar-${i}`" is-required>
              <MpFormLabel>Pillar</MpFormLabel>
              <MpSelect v-model="row.pillar_id" placeholder="Select pillar" is-full-width :is-disabled="isPublished">
                <option value="" disabled>Select pillar</option>
                <option v-for="p in activePillars" :key="p.id" :value="p.id">{{ p.name }}</option>
              </MpSelect>
            </MpFormControl>

            <MpFormControl :id="`sdg-framework-row-action-${i}`" is-required>
              <MpFormLabel>Key Business Action</MpFormLabel>
              <MpInput v-model="row.key_business_action" :is-disabled="isPublished" />
            </MpFormControl>

            <MpFormControl :id="`sdg-framework-row-detail-${i}`">
              <MpFormLabel>Detail Action Solution</MpFormLabel>
              <MpTextarea v-model="row.detail_action_solution" :is-disabled="isPublished" />
            </MpFormControl>

            <MpFormControl :id="`sdg-framework-row-indicator-${i}`">
              <MpFormLabel>Action Indicator</MpFormLabel>
              <MpSelect
                :model-value="row.action_indicator?.id ?? ''"
                placeholder="Select action indicator"
                is-full-width
                :is-disabled="isPublished"
                @update:model-value="(val: string) => setActionIndicator(row, val)"
              >
                <option value="">None</option>
                <option v-for="mki in activeMkiSdg" :key="mki.id" :value="mki.id">{{ mki.indicator_name }}</option>
              </MpSelect>
            </MpFormControl>

            <MpFormControl :id="`sdg-framework-row-alignment-${i}`">
              <MpFormLabel>Alignment</MpFormLabel>
              <MpInput v-model="row.alignment" :is-disabled="isPublished" />
            </MpFormControl>
          </MpFlex>

          <MpText v-if="!form.rows.length" size="label" color="text.secondary">No Action Plan Matrix rows yet.</MpText>
        </MpFlex>

        <MpDivider />

        <MpFlex justifyContent="flex-end" gap="3">
          <MpButton variant="ghost" @click="router.push('/sdg-framework')">Close</MpButton>
          <MpButton :is-disabled="!canSave || isSaving" @click="save">{{ isEdit ? 'Update' : 'Create' }}</MpButton>
        </MpFlex>
      </MpFlex>
    </MpFlex>
  </MpFlex>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  MpFlex,
  MpText,
  MpButton,
  MpInput,
  MpTextarea,
  MpSelect,
  MpToggle,
  MpCheckbox,
  MpFormControl,
  MpFormLabel,
  MpFormErrorMessage,
  MpDivider,
  MpSkeleton,
  toast,
} from '@mekari/pixel3'
import {
  useGetSdgFramework,
  useCreateSdgFramework,
  useUpdateSdgFramework,
  usePublishSdgFramework,
  isDuplicateMatrixRowCode,
  canDeleteMatrixRow,
  isApplicableEntitiesValid,
  isInvestmentImpactAllowed,
} from '@/services/sdg-framework'
import { useGetSdgAdoption } from '@/services/sdg-adoption'
import { useGetMasterPillar } from '@/services/master-pillar'
import { useGetMasterEntity } from '@/services/master-entity'
import { useGetMkiSdgList } from '@/services/mki-sdg'

const route = useRoute()
const router = useRouter()

const id = route.query.id as string | undefined
const isEdit = computed(() => Boolean(id))

const { data: current, isLoading } = useGetSdgFramework(() => id)
const isPublished = computed(() => current.value?.status === 'Published')

const { data: goals } = useGetSdgAdoption()
const adoptedGoals = computed(() => (goals.value ?? []).filter((g) => g.adopted))
function sdgName(sdgId: string) {
  return goals.value?.find((g) => g.id === sdgId)?.name
}

const { data: pillars } = useGetMasterPillar()
const activePillars = computed(() => (pillars.value ?? []).filter((p) => p.status === 'Active'))

const { data: entities } = useGetMasterEntity()
const activeEntities = computed(() => (entities.value ?? []).filter((e) => e.status === 'Active'))

const { data: mkiSdgList } = useGetMkiSdgList()
const activeMkiSdg = computed(() => (mkiSdgList.value ?? []).filter((m) => m.status === 'Active'))

let rowSeq = 0
function newRowId() {
  rowSeq += 1
  return `new-${rowSeq}`
}

const form = reactive<{
  sdg_id: string
  impact_type: SdgImpactType | ''
  is_applied_to_all_entity: boolean
  applicable_entity_ids: string[]
  rows: ActionPlanMatrixRow[]
}>({
  sdg_id: '',
  impact_type: '',
  is_applied_to_all_entity: true,
  applicable_entity_ids: [],
  rows: [],
})

watch(
  current,
  (framework) => {
    if (!framework) return
    form.sdg_id = framework.sdg_id
    form.impact_type = framework.impact_type
    form.is_applied_to_all_entity = framework.is_applied_to_all_entity
    form.applicable_entity_ids = [...framework.applicable_entity_ids]
    form.rows = framework.rows.map((r) => ({ ...r }))
  },
  { immediate: true },
)

// AC-47/48: Investment Impact only selectable when the entity scope includes a whitelisted entity;
// "applied to all entities" trivially includes them.
const investmentImpactAllowed = computed(() => {
  if (form.is_applied_to_all_entity) return true
  const names = form.applicable_entity_ids
    .map((eid) => activeEntities.value.find((e) => e.id === eid)?.name)
    .filter((n): n is string => Boolean(n))
  return isInvestmentImpactAllowed(names)
})

watch(investmentImpactAllowed, (allowed) => {
  if (!allowed && form.impact_type === 'Investment Impact') form.impact_type = ''
})

const applicableEntitiesValid = computed(() =>
  isApplicableEntitiesValid(form.is_applied_to_all_entity, form.applicable_entity_ids),
)

function isDuplicateCode(row: ActionPlanMatrixRow) {
  return Boolean(row.no_code) && isDuplicateMatrixRowCode(form.rows, row.no_code, row.id)
}

const hasDuplicateCodes = computed(() => form.rows.some((r) => isDuplicateCode(r)))

function addRow() {
  form.rows.push({
    id: newRowId(),
    no_code: '',
    pillar_id: '',
    key_business_action: '',
    detail_action_solution: '',
    action_indicator: null,
    alignment: '',
    created_by_level: 'Holding',
    taken_by_count: 0,
  })
}

function removeRow(i: number) {
  const row = form.rows[i]
  if (row && !canDeleteMatrixRow(row)) return
  form.rows.splice(i, 1)
}

function setActionIndicator(row: ActionPlanMatrixRow, mkiId: string) {
  const mki = activeMkiSdg.value.find((m) => m.id === mkiId)
  row.action_indicator = mki ? { id: mki.id, name: mki.indicator_name } : null
}

const canSave = computed(
  () => Boolean(form.sdg_id && form.impact_type) && applicableEntitiesValid.value && !hasDuplicateCodes.value,
)

const createMutation = useCreateSdgFramework()
const updateMutation = useUpdateSdgFramework()
const publishMutation = usePublishSdgFramework()
const isSaving = computed(() => createMutation.isPending.value || updateMutation.isPending.value)

async function save() {
  if (!canSave.value || !form.impact_type) return
  const payload = {
    sdg_id: form.sdg_id,
    impact_type: form.impact_type,
    is_applied_to_all_entity: form.is_applied_to_all_entity,
    applicable_entity_ids: form.is_applied_to_all_entity ? [] : form.applicable_entity_ids,
    rows: form.rows,
  }
  if (isEdit.value && id && current.value) {
    await updateMutation.mutateAsync({ ...current.value, ...payload })
    toast.notify({ id: 'sdg-framework-update', variant: 'success', title: 'SDG Framework updated.' })
  } else {
    await createMutation.mutateAsync(payload)
    toast.notify({ id: 'sdg-framework-create', variant: 'success', title: 'SDG Framework created.' })
  }
  router.push('/sdg-framework')
}

async function publish() {
  if (!id) return
  await publishMutation.mutateAsync(id)
  toast.notify({ id: 'sdg-framework-publish', variant: 'success', title: 'SDG Framework published.' })
}
</script>

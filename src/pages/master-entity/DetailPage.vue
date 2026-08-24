<template>
  <MpFlex direction="column" backgroundColor="background.surface" minHeight="100vh">
    <MpFlex justifyContent="space-between" alignItems="center" paddingX="24px" paddingY="24px">
      <MpFlex direction="row" gap="3">
        <MpButton variant="ghost" left-icon="arrows-left" aria-label="Back" @click="router.back()" />
        <MpFlex direction="column" alignItems="flex-start">
          <MpButton variant="textLink" as="a" href="#/master-entity">Master Entity</MpButton>
          <MpText as="h1" size="h1">{{ isEdit ? form.name || 'Edit' : 'Create' }}</MpText>
        </MpFlex>
      </MpFlex>
      <MpButton
        v-if="isEdit && current?.status === 'Active'"
        variant="ghost"
        left-icon="delete"
        @click="isConfirmingDeactivate = true"
      >
        Deactivate
      </MpButton>
    </MpFlex>

    <MpFlex
      direction="row"
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

      <template v-else>
        <MpFlex direction="column" gap="6" flex="1" maxWidth="640px">
          <MpFormControl id="entity-name" is-required>
            <MpFormLabel>Name</MpFormLabel>
            <MpInput v-model="form.name" placeholder="e.g. PT Sintesa Argo" :is-disabled="isDeactivated" />
          </MpFormControl>

          <MpFormControl id="entity-type" is-required>
            <MpFormLabel>Type</MpFormLabel>
            <MpSelect v-model="form.type" placeholder="Select type" is-full-width :is-disabled="isDeactivated">
              <option value="" disabled>Select type</option>
              <option v-for="t in entityTypes" :key="t" :value="t">{{ t }}</option>
            </MpSelect>
          </MpFormControl>

          <MpFormControl v-if="requiresParent" id="entity-parent" is-required>
            <MpFormLabel>Parent Entity</MpFormLabel>
            <MpSelect v-model="form.parentEntityId" placeholder="Select parent entity" is-full-width :is-disabled="isDeactivated">
              <option value="" disabled>Select parent entity</option>
              <option v-for="p in parentOptions" :key="p.id" :value="p.id">{{ p.name }}</option>
            </MpSelect>
            <MpText v-if="!parentOptions.length" size="label" color="text.secondary">
              No active entities available to be a parent yet.
            </MpText>
          </MpFormControl>
          <!-- AC-06: Subsidiary's parent is always null, no picker shown -->
          <MpText v-else size="label" color="text.secondary">Subsidiary entities have no Parent Entity (parents directly to Holding).</MpText>

          <MpFormControl id="entity-address">
            <MpFormLabel>Address</MpFormLabel>
            <MpInput v-model="form.address" placeholder="e.g. Jl. Jend. Sudirman Kav. 1" :is-disabled="isDeactivated" />
          </MpFormControl>

          <MpFlex v-if="isEdit" alignItems="center" gap="2">
            <MpText size="label" weight="semiBold">Status</MpText>
            <MpBadge for="tableStatus" :type="current?.status === 'Active' ? 'completed' : 'announcement'">
              {{ current?.status }}
            </MpBadge>
          </MpFlex>

          <MpFlex>
            <MpButton :is-disabled="!canSave || isDeactivated" @click="save">{{ isEdit ? 'Update' : 'Create' }}</MpButton>
          </MpFlex>
        </MpFlex>
      </template>
    </MpFlex>

    <ConfirmDeleteModal
      :is-open="isConfirmingDeactivate"
      title="Deactivate this entity?"
      message="This will set the status to Inactive. It can no longer be picked as a Parent Entity for new entities, and it can't be permanently deleted per policy."
      @close="isConfirmingDeactivate = false"
      @confirm="confirmDeactivate"
    />
  </MpFlex>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MpFlex, MpText, MpButton, MpInput, MpSelect, MpFormControl, MpFormLabel, MpSkeleton, MpBadge, toast } from '@mekari/pixel3'
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal.vue'
import { useCreateMasterEntity, useDeactivateMasterEntity, useGetMasterEntity, useMasterEntityDetail, useUpdateMasterEntity } from '@/services/master-entity'

const entityTypes: EntityType[] = ['Subsidiary', 'Business Unit', 'Branch']

const route = useRoute()
const router = useRouter()

const id = route.query.id as string | undefined
const isEdit = computed(() => Boolean(id))
const isConfirmingDeactivate = ref(false)

const { data: allEntities, isLoading: isListLoading } = useGetMasterEntity()
const { data: current, isLoading: isDetailLoading } = useMasterEntityDetail(id)
const isLoading = computed(() => isListLoading.value || (isEdit.value && isDetailLoading.value))

// entities that have already been deactivated are frozen — deactivation is the terminal action (AC-09)
const isDeactivated = computed(() => isEdit.value && current.value?.status === 'Inactive')

const form = reactive({
  name: '',
  type: '' as EntityType | '',
  parentEntityId: '',
  address: '',
})

// AC-06/AC-07: only Business Unit/Branch require (and show) a Parent Entity picker
const requiresParent = computed(() => form.type === 'Business Unit' || form.type === 'Branch')

// AC-08: Inactive entities are excluded from the parent-picker options; also exclude self to avoid a cycle
const parentOptions = computed(() =>
  (allEntities.value ?? []).filter((e) => e.status === 'Active' && e.id !== id),
)

const canSave = computed(() => {
  if (!form.name || !form.type) return false
  if (requiresParent.value && !form.parentEntityId) return false
  return true
})

watch(
  () => form.type,
  (type) => {
    if (type === 'Subsidiary') form.parentEntityId = ''
  },
)

watch(current, (detail) => {
  if (!detail) return
  form.name = detail.name
  form.type = detail.type
  form.parentEntityId = detail.parent_entity_id ?? ''
  form.address = detail.address
})

// list finished loading but this id isn't in it — bad deep link, bounce back to the list
watch([isListLoading, current], ([loading, detail]) => {
  if (!loading && id && !detail) router.replace('/master-entity')
})

const createMutation = useCreateMasterEntity()
const updateMutation = useUpdateMasterEntity()
const deactivateMutation = useDeactivateMasterEntity()

async function save() {
  if (!canSave.value) return
  // AC-06: Subsidiary's parent is always null, even if a stale value lingers in the form
  const parentEntityId = form.type === 'Subsidiary' ? null : form.parentEntityId || null

  if (isEdit.value && id && current.value) {
    await updateMutation.mutateAsync({
      id,
      name: form.name,
      type: form.type as EntityType,
      parent_entity_id: parentEntityId,
      address: form.address,
      status: current.value.status,
    })
    toast.notify({ id: 'entity-update', variant: 'success', title: 'Entity updated.' })
  } else {
    await createMutation.mutateAsync({
      name: form.name,
      type: form.type as EntityType,
      parent_entity_id: parentEntityId,
      address: form.address,
      status: 'Active',
    })
    toast.notify({ id: 'entity-create', variant: 'success', title: 'Entity created.' })
  }
  router.push('/master-entity')
}

async function confirmDeactivate() {
  if (!current.value) return
  await deactivateMutation.mutateAsync(current.value)
  isConfirmingDeactivate.value = false
  toast.notify({ id: 'entity-deactivate', variant: 'success', title: 'Entity deactivated.' })
  router.push('/master-entity')
}
</script>

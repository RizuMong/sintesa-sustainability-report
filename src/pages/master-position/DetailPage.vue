<template>
  <MpFlex direction="column" backgroundColor="background.surface" minHeight="100vh">
    <MpFlex justifyContent="space-between" alignItems="center" paddingX="24px" paddingY="24px">
      <MpFlex direction="row" gap="3">
        <MpButton variant="ghost" left-icon="arrows-left" aria-label="Back" @click="router.back()" />
        <MpFlex direction="column" alignItems="flex-start">
          <MpButton variant="textLink" as="a" href="#/master-position">Master Position</MpButton>
          <MpText as="h1" size="h1">{{ isEdit ? computedName || 'Edit' : 'Create' }}</MpText>
        </MpFlex>
      </MpFlex>
      <MpButton v-if="isEdit" variant="ghost" left-icon="delete" @click="isConfirmingDelete = true">Deactivate</MpButton>
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

      <MpFlex v-else direction="column" gap="6" flex="1" maxWidth="480px">
        <MpFormControl id="position-domain" is-required>
          <MpFormLabel>Domain</MpFormLabel>
          <MpInput v-model="form.domain" placeholder="e.g. Ekonomi, HR, Sustainability" />
        </MpFormControl>

        <MpFormControl id="position-role" is-required>
          <MpFormLabel>Role</MpFormLabel>
          <MpInput v-model="form.role" placeholder="e.g. PIC, Executive" />
        </MpFormControl>

        <MpFormControl id="position-entity">
          <MpFormLabel>Entity</MpFormLabel>
          <MpSelect v-model="form.entityId" placeholder="All Entities (generic)" is-full-width is-clearable>
            <option value="">All Entities (generic)</option>
            <option v-for="e in entities" :key="e.id" :value="e.id">{{ e.name }}</option>
          </MpSelect>
        </MpFormControl>

        <MpFormControl id="position-name">
          <MpFormLabel>Name (computed)</MpFormLabel>
          <MpInput :model-value="computedName" is-disabled />
        </MpFormControl>

        <MpFlex>
          <MpButton :is-disabled="!canSave" @click="save">{{ isEdit ? 'Update' : 'Create' }}</MpButton>
        </MpFlex>
      </MpFlex>
    </MpFlex>

    <ConfirmDeleteModal
      :is-open="isConfirmingDelete"
      title="Deactivate this position?"
      message="This will set the status to Inactive. It can still be viewed and re-activated."
      @close="isConfirmingDelete = false"
      @confirm="confirmDeactivate"
    />
  </MpFlex>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MpFlex, MpText, MpButton, MpInput, MpSelect, MpFormControl, MpFormLabel, MpSkeleton, toast } from '@mekari/pixel3'
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal.vue'
import {
  useGetMasterPosition,
  useCreateMasterPosition,
  useUpdateMasterPosition,
  useDeactivateMasterPosition,
  computePositionName,
} from '@/services/master-position'
import { getMasterEntityStub } from '@/lib/entity-stub'

const route = useRoute()
const router = useRouter()
const entities = getMasterEntityStub()

const id = route.query.id as string | undefined
const isEdit = computed(() => Boolean(id))
const isConfirmingDelete = ref(false)

// new-shape modules without a dedicated get-by-id contract fetch the list and find locally
const { data, isLoading } = useGetMasterPosition()
const createMutation = useCreateMasterPosition()
const updateMutation = useUpdateMasterPosition()
const deactivateMutation = useDeactivateMasterPosition()

const form = reactive({ domain: '', role: '', entityId: '' })

const record = computed(() => data.value?.find((p) => p.id === id))

// populate the form once the list resolves and contains the target record
watch(
  record,
  (r) => {
    if (!r) return
    form.domain = r.domain
    form.role = r.role
    form.entityId = r.entity_id ?? ''
  },
  { immediate: true },
)

const entityName = computed(() => entities.find((e) => e.id === form.entityId)?.name ?? null)
const computedName = computed(() => computePositionName(form.role, form.domain, entityName.value))
const canSave = computed(() => Boolean(form.domain && form.role))

async function save() {
  if (!canSave.value) return
  const payload = {
    domain: form.domain,
    role: form.role,
    entity_id: form.entityId || null,
    name: computedName.value,
  }

  if (isEdit.value && id) {
    await updateMutation.mutateAsync({ ...payload, id })
    toast.notify({ id: 'master-position-update', variant: 'success', title: 'Position updated.' })
  } else {
    await createMutation.mutateAsync(payload)
    toast.notify({ id: 'master-position-create', variant: 'success', title: 'Position created.' })
  }
  router.push('/master-position')
}

async function confirmDeactivate() {
  if (!id) return
  await deactivateMutation.mutateAsync(id)
  isConfirmingDelete.value = false
  router.push('/master-position')
}
</script>

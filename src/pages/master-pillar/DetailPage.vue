<template>
  <MpFlex direction="column" backgroundColor="background.surface" minHeight="100vh">
    <MpFlex justifyContent="space-between" alignItems="center" paddingX="24px" paddingY="24px">
      <MpFlex direction="row" gap="3">
        <MpButton variant="ghost" left-icon="arrows-left" aria-label="Back" @click="router.back()" />
        <MpFlex direction="column" alignItems="flex-start">
          <MpButton variant="textLink" as="a" href="#/master-pillar">Master Pillar</MpButton>
          <MpText as="h1" size="h1">{{ isEdit ? form.name || 'Edit' : 'Create' }}</MpText>
        </MpFlex>
      </MpFlex>
      <MpButton v-if="isEdit" variant="ghost" left-icon="delete" @click="isConfirmingDelete = true">Deactivate</MpButton>
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
        <MpSkeleton v-for="i in 2" :key="i" height="56px" rounded="md" />
      </MpFlex>

      <MpFlex v-else direction="column" gap="6" maxWidth="480px">
        <MpFormControl id="pillar-code" is-required :is-invalid="isDuplicateCode">
          <MpFormLabel>Code</MpFormLabel>
          <MpInput v-model="form.code" placeholder="e.g. ENV" />
          <MpFormErrorMessage v-if="isDuplicateCode">Code is already used by another pillar.</MpFormErrorMessage>
        </MpFormControl>

        <MpFormControl id="pillar-name" is-required>
          <MpFormLabel>Name</MpFormLabel>
          <MpInput v-model="form.name" placeholder="e.g. Environment" />
        </MpFormControl>

        <MpFlex>
          <MpButton :is-disabled="!canSave || isSaving" @click="save">{{ isEdit ? 'Update' : 'Create' }}</MpButton>
        </MpFlex>
      </MpFlex>
    </MpFlex>

    <ConfirmDeleteModal
      :is-open="isConfirmingDelete"
      title="Deactivate this pillar?"
      message="This will set the status to Inactive. It can still be viewed but won't appear as an active lookup on the Action Plan Matrix."
      @close="isConfirmingDelete = false"
      @confirm="confirmDeactivate"
    />
  </MpFlex>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  MpFlex,
  MpText,
  MpButton,
  MpInput,
  MpFormControl,
  MpFormLabel,
  MpFormErrorMessage,
  MpSkeleton,
  toast,
} from '@mekari/pixel3'
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal.vue'
import {
  useGetMasterPillar,
  useCreateMasterPillar,
  useUpdateMasterPillar,
  useDeactivateMasterPillar,
  isDuplicatePillarCode,
} from '@/services/master-pillar'

const route = useRoute()
const router = useRouter()

const id = route.query.id as string | undefined
const isEdit = computed(() => Boolean(id))
const isConfirmingDelete = ref(false)

const { data, isLoading } = useGetMasterPillar()
const items = computed(() => data.value ?? [])
const current = computed(() => items.value.find((p) => p.id === id))

const form = reactive({ code: '', name: '' })

watch(
  current,
  (pillar) => {
    if (!pillar) return
    form.code = pillar.code
    form.name = pillar.name
  },
  { immediate: true },
)

const isDuplicateCode = computed(() => Boolean(form.code) && isDuplicatePillarCode(items.value, form.code, id))
const canSave = computed(() => Boolean(form.code && form.name) && !isDuplicateCode.value)

const createMutation = useCreateMasterPillar()
const updateMutation = useUpdateMasterPillar()
const deactivateMutation = useDeactivateMasterPillar()
const isSaving = computed(() => createMutation.isPending.value || updateMutation.isPending.value)

async function save() {
  if (!canSave.value) return
  if (isEdit.value && id && current.value) {
    await updateMutation.mutateAsync({ ...current.value, code: form.code, name: form.name })
    toast.notify({ id: 'master-pillar-update', variant: 'success', title: 'Pillar updated.' })
  } else {
    await createMutation.mutateAsync({ code: form.code, name: form.name })
    toast.notify({ id: 'master-pillar-create', variant: 'success', title: 'Pillar created.' })
  }
  router.push('/master-pillar')
}

async function confirmDeactivate() {
  if (!current.value) return
  await deactivateMutation.mutateAsync(current.value)
  isConfirmingDelete.value = false
  router.push('/master-pillar')
}
</script>

<template>
  <MpFlex direction="column" backgroundColor="background.surface" minHeight="100vh">
    <MpFlex justifyContent="space-between" alignItems="center" paddingX="24px" paddingY="24px">
      <MpFlex direction="row" gap="3">
        <MpButton variant="ghost" left-icon="arrows-left" aria-label="Back" @click="router.back()" />
        <MpFlex direction="column" alignItems="flex-start">
          <MpButton variant="textLink" as="a" href="#/master-unit">Master Unit</MpButton>
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
        <MpSkeleton v-for="i in 3" :key="i" height="56px" rounded="md" />
      </MpFlex>

      <MpFlex v-else direction="column" gap="6" maxWidth="480px">
        <MpFormControl id="unit-name" is-required>
          <MpFormLabel>Name</MpFormLabel>
          <MpInput v-model="form.name" placeholder="e.g. Metric Ton" />
        </MpFormControl>

        <MpFormControl id="unit-code" is-required :is-invalid="isDuplicateCode">
          <MpFormLabel>Code</MpFormLabel>
          <MpInput v-model="form.code" placeholder="e.g. ton" />
          <MpFormErrorMessage v-if="isDuplicateCode">Code is already used by another unit.</MpFormErrorMessage>
        </MpFormControl>

        <MpFormControl id="unit-category" is-required>
          <MpFormLabel>Category</MpFormLabel>
          <MpSelect v-model="form.category" placeholder="Select category" is-full-width>
            <option value="" disabled>Select category</option>
            <option v-for="c in categoryOptions" :key="c" :value="c">{{ c }}</option>
          </MpSelect>
        </MpFormControl>

        <MpFlex>
          <MpButton :is-disabled="!canSave || isSaving" @click="save">{{ isEdit ? 'Update' : 'Create' }}</MpButton>
        </MpFlex>
      </MpFlex>
    </MpFlex>

    <ConfirmDeleteModal
      :is-open="isConfirmingDelete"
      title="Deactivate this unit?"
      message="This will set the status to Inactive. It can still be viewed but won't appear as an active lookup."
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
  MpSelect,
  MpFormControl,
  MpFormLabel,
  MpFormErrorMessage,
  MpSkeleton,
  toast,
} from '@mekari/pixel3'
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal.vue'
import {
  useGetMasterUnit,
  useCreateMasterUnit,
  useUpdateMasterUnit,
  useDeactivateMasterUnit,
  isDuplicateUnitCode,
} from '@/services/master-unit'

const categoryOptions = ['Energy', 'Emissions', 'Water', 'Waste', 'Headcount', 'Currency', 'Other']

const route = useRoute()
const router = useRouter()

const id = route.query.id as string | undefined
const isEdit = computed(() => Boolean(id))
const isConfirmingDelete = ref(false)

const { data, isLoading } = useGetMasterUnit()
const items = computed(() => data.value ?? [])
const current = computed(() => items.value.find((u) => u.id === id))

const form = reactive({ name: '', code: '', category: '' })

watch(
  current,
  (unit) => {
    if (!unit) return
    form.name = unit.name
    form.code = unit.code
    form.category = unit.category
  },
  { immediate: true },
)

const isDuplicateCode = computed(() => Boolean(form.code) && isDuplicateUnitCode(items.value, form.code, id))
const canSave = computed(() => Boolean(form.name && form.code && form.category) && !isDuplicateCode.value)

const createMutation = useCreateMasterUnit()
const updateMutation = useUpdateMasterUnit()
const deactivateMutation = useDeactivateMasterUnit()
const isSaving = computed(() => createMutation.isPending.value || updateMutation.isPending.value)

async function save() {
  if (!canSave.value) return
  if (isEdit.value && id && current.value) {
    await updateMutation.mutateAsync({ ...current.value, name: form.name, code: form.code, category: form.category })
    toast.notify({ id: 'master-unit-update', variant: 'success', title: 'Unit updated.' })
  } else {
    await createMutation.mutateAsync({ name: form.name, code: form.code, category: form.category })
    toast.notify({ id: 'master-unit-create', variant: 'success', title: 'Unit created.' })
  }
  router.push('/master-unit')
}

async function confirmDeactivate() {
  if (!current.value) return
  await deactivateMutation.mutateAsync(current.value)
  isConfirmingDelete.value = false
  router.push('/master-unit')
}
</script>

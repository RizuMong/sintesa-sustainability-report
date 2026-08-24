<template>
  <MpFlex direction="column" backgroundColor="background.surface" minHeight="100vh">
    <MpFlex justifyContent="space-between" alignItems="center" paddingX="24px" paddingY="24px">
      <MpFlex direction="row" gap="3">
        <MpButton variant="ghost" left-icon="arrows-left" aria-label="Back" @click="router.back()" />
        <MpFlex direction="column" alignItems="flex-start">
          <MpButton variant="textLink" as="a" href="#/master-gri">Master GRI</MpButton>
          <MpText as="h1" size="h1">{{ isEdit ? form.gri_code || 'Edit' : 'Create' }}</MpText>
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
        <MpFormControl id="gri-code" is-required :is-invalid="isDuplicateCode">
          <MpFormLabel>GRI Code</MpFormLabel>
          <MpInput v-model="form.gri_code" placeholder="e.g. 302-1" />
          <MpFormErrorMessage v-if="isDuplicateCode">GRI Code is already used by another entry.</MpFormErrorMessage>
        </MpFormControl>

        <MpFormControl id="gri-series" is-required>
          <MpFormLabel>Series</MpFormLabel>
          <MpSelect v-model="form.gri_series" placeholder="Select series" is-full-width>
            <option value="" disabled>Select series</option>
            <option v-for="s in seriesOptions" :key="s" :value="s">{{ s }}</option>
          </MpSelect>
        </MpFormControl>

        <MpFormControl id="gri-disclosure-title" is-required>
          <MpFormLabel>Disclosure Title</MpFormLabel>
          <MpInput v-model="form.disclosure_title" placeholder="e.g. Energy consumption within the organization" />
        </MpFormControl>

        <MpFlex>
          <MpButton :is-disabled="!canSave || isSaving" @click="save">{{ isEdit ? 'Update' : 'Create' }}</MpButton>
        </MpFlex>
      </MpFlex>
    </MpFlex>

    <ConfirmDeleteModal
      :is-open="isConfirmingDelete"
      title="Deactivate this GRI code?"
      message="This will set the status to Inactive. It stays on existing MKIs but won't appear as a lookup option for new ones."
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
  useGetMasterGri,
  useCreateMasterGri,
  useUpdateMasterGri,
  useDeactivateMasterGri,
  isDuplicateGriCode,
} from '@/services/master-gri'

const seriesOptions: GriSeries[] = ['Universal', 'Economic', 'Environmental', 'Social']

const route = useRoute()
const router = useRouter()

const id = route.query.id as string | undefined
const isEdit = computed(() => Boolean(id))
const isConfirmingDelete = ref(false)

const { data, isLoading } = useGetMasterGri()
const items = computed(() => data.value ?? [])
const current = computed(() => items.value.find((g) => g.id === id))

const form = reactive<{ gri_code: string; gri_series: GriSeries | ''; disclosure_title: string }>({
  gri_code: '',
  gri_series: '',
  disclosure_title: '',
})

watch(
  current,
  (gri) => {
    if (!gri) return
    form.gri_code = gri.gri_code
    form.gri_series = gri.gri_series
    form.disclosure_title = gri.disclosure_title
  },
  { immediate: true },
)

const isDuplicateCode = computed(() => Boolean(form.gri_code) && isDuplicateGriCode(items.value, form.gri_code, id))
const canSave = computed(
  () => Boolean(form.gri_code && form.gri_series && form.disclosure_title) && !isDuplicateCode.value,
)

const createMutation = useCreateMasterGri()
const updateMutation = useUpdateMasterGri()
const deactivateMutation = useDeactivateMasterGri()
const isSaving = computed(() => createMutation.isPending.value || updateMutation.isPending.value)

async function save() {
  if (!canSave.value || !form.gri_series) return
  if (isEdit.value && id && current.value) {
    await updateMutation.mutateAsync({
      ...current.value,
      gri_code: form.gri_code,
      gri_series: form.gri_series,
      disclosure_title: form.disclosure_title,
    })
    toast.notify({ id: 'master-gri-update', variant: 'success', title: 'GRI code updated.' })
  } else {
    await createMutation.mutateAsync({
      gri_code: form.gri_code,
      gri_series: form.gri_series,
      disclosure_title: form.disclosure_title,
    })
    toast.notify({ id: 'master-gri-create', variant: 'success', title: 'GRI code created.' })
  }
  router.push('/master-gri')
}

async function confirmDeactivate() {
  if (!current.value) return
  await deactivateMutation.mutateAsync(current.value)
  isConfirmingDelete.value = false
  router.push('/master-gri')
}
</script>

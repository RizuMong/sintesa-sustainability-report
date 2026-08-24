<template>
  <MpFlex direction="column" backgroundColor="background.surface" minHeight="100vh">
    <MpFlex justifyContent="space-between" alignItems="center" paddingX="24px" paddingY="24px">
      <MpFlex direction="row" gap="3">
        <MpButton variant="ghost" left-icon="arrows-left" aria-label="Back" @click="router.back()" />
        <MpFlex direction="column" alignItems="flex-start">
          <MpButton variant="textLink" as="a" href="#/master-period">Master Period</MpButton>
          <MpText as="h1" size="h1">{{ isEdit ? form.year || 'Edit' : 'Create' }}</MpText>
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
        <MpFormControl id="period-year" is-required :is-invalid="isDuplicateYear">
          <MpFormLabel>Year</MpFormLabel>
          <MpInput v-model.number="form.year" type="number" placeholder="e.g. 2026" />
          <MpFormErrorMessage v-if="isDuplicateYear">Year is already used by another period.</MpFormErrorMessage>
        </MpFormControl>

        <!-- AC-04: independent of Status Active/Inactive — gates Report Plan Realization submission -->
        <MpFormControl id="period-realization-window">
          <MpFormLabel>Realization Window</MpFormLabel>
          <MpFlex alignItems="center" gap="2">
            <MpToggle :is-checked="form.realization_window === 'Open'" @update:is-checked="onToggleWindow" />
            <MpText size="label">{{ form.realization_window }}</MpText>
          </MpFlex>
        </MpFormControl>

        <MpFlex>
          <MpButton :is-disabled="!canSave || isSaving" @click="save">{{ isEdit ? 'Update' : 'Create' }}</MpButton>
        </MpFlex>
      </MpFlex>
    </MpFlex>

    <ConfirmDeleteModal
      :is-open="isConfirmingDelete"
      title="Deactivate this period?"
      message="This will set the status to Inactive. It can still be viewed but won't be selectable as the active reporting period."
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
  MpToggle,
  MpFormControl,
  MpFormLabel,
  MpFormErrorMessage,
  MpSkeleton,
  toast,
} from '@mekari/pixel3'
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal.vue'
import {
  useGetMasterPeriod,
  useCreateMasterPeriod,
  useUpdateMasterPeriod,
  useDeactivateMasterPeriod,
  isDuplicatePeriodYear,
} from '@/services/master-period'

const route = useRoute()
const router = useRouter()

const id = route.query.id as string | undefined
const isEdit = computed(() => Boolean(id))
const isConfirmingDelete = ref(false)

const { data, isLoading } = useGetMasterPeriod()
const items = computed(() => data.value ?? [])
const current = computed(() => items.value.find((p) => p.id === id))

const form = reactive<{ year: number | undefined; realization_window: 'Open' | 'Closed' }>({
  year: undefined,
  realization_window: 'Closed',
})

watch(
  current,
  (period) => {
    if (!period) return
    form.year = period.year
    form.realization_window = period.realization_window
  },
  { immediate: true },
)

function onToggleWindow(isChecked: boolean) {
  form.realization_window = isChecked ? 'Open' : 'Closed'
}

const isDuplicateYear = computed(
  () => form.year != null && isDuplicatePeriodYear(items.value, form.year, id),
)
const canSave = computed(() => form.year != null && !isDuplicateYear.value)

const createMutation = useCreateMasterPeriod()
const updateMutation = useUpdateMasterPeriod()
const deactivateMutation = useDeactivateMasterPeriod()
const isSaving = computed(() => createMutation.isPending.value || updateMutation.isPending.value)

async function save() {
  if (!canSave.value || form.year == null) return
  if (isEdit.value && id && current.value) {
    await updateMutation.mutateAsync({ ...current.value, year: form.year, realization_window: form.realization_window })
    toast.notify({ id: 'master-period-update', variant: 'success', title: 'Period updated.' })
  } else {
    await createMutation.mutateAsync({ year: form.year, realization_window: form.realization_window })
    toast.notify({ id: 'master-period-create', variant: 'success', title: 'Period created.' })
  }
  router.push('/master-period')
}

async function confirmDeactivate() {
  if (!current.value) return
  await deactivateMutation.mutateAsync(current.value)
  isConfirmingDelete.value = false
  router.push('/master-period')
}
</script>

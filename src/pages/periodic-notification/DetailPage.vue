<template>
  <MpFlex direction="column" backgroundColor="background.surface" minHeight="100vh">
    <MpFlex justifyContent="space-between" alignItems="center" paddingX="24px" paddingY="24px">
      <MpFlex direction="row" gap="3">
        <MpButton variant="ghost" left-icon="arrows-left" aria-label="Back" @click="router.back()" />
        <MpFlex direction="column" alignItems="flex-start">
          <MpButton variant="textLink" as="a" href="#/periodic-notification">Periodic Notification</MpButton>
          <MpText as="h1" size="h1">{{ isEdit ? form.title || 'Edit' : 'Create' }}</MpText>
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
      <MpFlex v-if="isLoading" direction="column" gap="2">
        <MpSkeleton v-for="i in 4" :key="i" height="56px" rounded="md" />
      </MpFlex>

      <MpFlex v-else direction="column" gap="6" maxWidth="640px">
        <MpFormControl id="notif-title" is-required>
          <MpFormLabel>Title</MpFormLabel>
          <MpInput v-model="form.title" placeholder="e.g. GRI Quant Reminder" />
        </MpFormControl>

        <MpFormControl id="notif-type" is-required>
          <MpFormLabel>Notification Type</MpFormLabel>
          <MpSelect v-model="form.notification_type" placeholder="Select type" is-full-width>
            <option value="" disabled>Select type</option>
            <option v-for="t in notificationTypeOptions" :key="t" :value="t">{{ t }}</option>
          </MpSelect>
        </MpFormControl>

        <MpFlex gap="6">
          <MpFormControl id="notif-deadline-month" is-required flex="1" :is-invalid="deadlineMonthError">
            <MpFormLabel>Deadline Month (1-12)</MpFormLabel>
            <MpInput v-model.number="form.deadline_month" type="number" :min="1" :max="12" placeholder="e.g. 12" />
            <MpFormHelpText v-if="deadlineMonthError">Must be between 1 and 12.</MpFormHelpText>
          </MpFormControl>
          <MpFormControl id="notif-deadline-day" is-required flex="1" :is-invalid="deadlineDayError">
            <MpFormLabel>Deadline Day (1-31)</MpFormLabel>
            <MpInput v-model.number="form.deadline_day" type="number" :min="1" :max="31" placeholder="e.g. 31" />
            <MpFormHelpText v-if="deadlineDayError">Must be between 1 and 31.</MpFormHelpText>
          </MpFormControl>
        </MpFlex>

        <MpFormControl id="notif-reminder" is-required>
          <MpFormLabel>Reminder (days before deadline)</MpFormLabel>
          <MpInput v-model.number="form.reminder_days_before" type="number" :min="0" placeholder="e.g. 7" />
        </MpFormControl>

        <MpDivider />

        <MpFlex>
          <MpButton :is-disabled="!canSave" :is-loading="isSaving" @click="save">
            {{ isEdit ? 'Update' : 'Create' }}
          </MpButton>
        </MpFlex>
      </MpFlex>
    </MpFlex>

    <ConfirmDeleteModal
      :is-open="isConfirmingDelete"
      title="Deactivate this notification?"
      message="This will set the status to Inactive. It can still be viewed and re-activated."
      @close="isConfirmingDelete = false"
      @confirm="confirmDeactivate"
    />
  </MpFlex>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  MpFlex,
  MpText,
  MpButton,
  MpInput,
  MpSelect,
  MpFormControl,
  MpFormLabel,
  MpFormHelpText,
  MpDivider,
  MpSkeleton,
  toast,
} from '@mekari/pixel3'
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal.vue'
import {
  isValidDeadline,
  useCreatePeriodicNotification,
  useDeactivatePeriodicNotification,
  useGetPeriodicNotification,
  useUpdatePeriodicNotification,
} from '@/services/periodic-notification'

const notificationTypeOptions: PeriodicNotificationType[] = [
  'Action Plan',
  'Realization Report',
  'GRI Quant',
  'GRI Qual',
]

const route = useRoute()
const router = useRouter()

const id = route.query.id as string | undefined
const isEdit = computed(() => Boolean(id))
const isConfirmingDelete = ref(false)

const { data: items, isLoading: isListLoading } = useGetPeriodicNotification()
const createMutation = useCreatePeriodicNotification()
const updateMutation = useUpdatePeriodicNotification()
const deactivateMutation = useDeactivatePeriodicNotification()

const isLoading = computed(() => isEdit.value && isListLoading.value)
const isSaving = computed(() => createMutation.isPending.value || updateMutation.isPending.value)

const form = reactive({
  title: '',
  notification_type: '' as PeriodicNotificationType | '',
  deadline_month: 1,
  deadline_day: 1,
  reminder_days_before: 7,
})

function populateForm(record: PeriodicNotification) {
  form.title = record.title
  form.notification_type = record.notification_type
  form.deadline_month = record.deadline_month
  form.deadline_day = record.deadline_day
  form.reminder_days_before = record.reminder_days_before
}

watch(
  items,
  (list) => {
    if (!id || !list) return
    const record = list.find((r) => r.id === id)
    if (!record) {
      router.replace('/periodic-notification')
      return
    }
    populateForm(record)
  },
  { immediate: true },
)

const deadlineMonthError = computed(() => !isValidDeadline(form.deadline_month, 1))
const deadlineDayError = computed(() => !isValidDeadline(1, form.deadline_day))
const canSave = computed(
  () =>
    Boolean(form.title && form.notification_type) &&
    isValidDeadline(form.deadline_month, form.deadline_day) &&
    form.reminder_days_before >= 0,
)

onMounted(() => {
  if (!id) return
})

async function save() {
  if (!canSave.value || !form.notification_type) return
  const payload = {
    title: form.title,
    notification_type: form.notification_type,
    deadline_month: form.deadline_month,
    deadline_day: form.deadline_day,
    reminder_days_before: form.reminder_days_before,
  }

  if (isEdit.value && id) {
    await updateMutation.mutateAsync({ ...payload, id })
    toast.notify({ id: 'periodic-notification-update', variant: 'success', title: 'Notification updated.' })
  } else {
    await createMutation.mutateAsync(payload)
    toast.notify({ id: 'periodic-notification-create', variant: 'success', title: 'Notification created.' })
  }
  router.push('/periodic-notification')
}

async function confirmDeactivate() {
  if (!id) return
  await deactivateMutation.mutateAsync(id)
  isConfirmingDelete.value = false
  router.push('/periodic-notification')
}
</script>

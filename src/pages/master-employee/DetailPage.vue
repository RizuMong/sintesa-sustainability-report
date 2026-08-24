<template>
  <MpFlex direction="column" backgroundColor="background.surface" minHeight="100vh">
    <MpFlex justifyContent="space-between" alignItems="center" paddingX="24px" paddingY="24px">
      <MpFlex direction="row" gap="3">
        <MpButton variant="ghost" left-icon="arrows-left" aria-label="Back" @click="router.back()" />
        <MpFlex direction="column" alignItems="flex-start">
          <MpButton variant="textLink" as="a" href="#/master-employee">Master Employee</MpButton>
          <MpText as="h1" size="h1">{{ isEdit ? form.fullName || 'Edit' : 'Create' }}</MpText>
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
        <MpFormControl id="employee-full-name" is-required>
          <MpFormLabel>Full Name</MpFormLabel>
          <MpInput v-model="form.fullName" placeholder="e.g. Budi Santoso" />
        </MpFormControl>

        <MpFormControl id="employee-email" is-required :is-invalid="Boolean(emailError)">
          <MpFormLabel>Corporate Email</MpFormLabel>
          <MpInput v-model="form.email" type="email" placeholder="e.g. budi@mekari.com" />
          <MpFormErrorMessage v-if="emailError">{{ emailError }}</MpFormErrorMessage>
        </MpFormControl>

        <MpFormControl id="employee-phone">
          <MpFormLabel>Phone Number</MpFormLabel>
          <MpInput v-model="form.phone" placeholder="e.g. 081234567890" />
        </MpFormControl>

        <MpFormControl id="employee-entity" is-required>
          <MpFormLabel>Entity Assignment</MpFormLabel>
          <MpSelect v-model="form.entityId" placeholder="Select entity" is-full-width>
            <option value="" disabled>Select entity</option>
            <option v-for="e in entities" :key="e.id" :value="e.id">{{ e.name }}</option>
          </MpSelect>
        </MpFormControl>

        <MpFormControl id="employee-position" is-required>
          <MpFormLabel>Position</MpFormLabel>
          <MpSelect v-model="form.positionId" placeholder="Select position" is-full-width>
            <option value="" disabled>Select position</option>
            <option v-for="p in activePositions" :key="p.id" :value="p.id">{{ p.name }}</option>
          </MpSelect>
        </MpFormControl>

        <MpFlex>
          <MpButton :is-disabled="!canSave" @click="save">{{ isEdit ? 'Update' : 'Create' }}</MpButton>
        </MpFlex>
      </MpFlex>
    </MpFlex>

    <ConfirmDeleteModal
      :is-open="isConfirmingDelete"
      title="Deactivate this employee?"
      message="This will set the status to Inactive. The employee immediately loses login access."
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
  useGetMasterEmployee,
  useCreateMasterEmployee,
  useUpdateMasterEmployee,
  useDeactivateMasterEmployee,
  isEmailUnique,
  isValidEmailFormat,
} from '@/services/master-employee'
import { useGetMasterPosition } from '@/services/master-position'
import { getMasterEntityStub } from '@/lib/entity-stub'

const route = useRoute()
const router = useRouter()
const entities = getMasterEntityStub()

const id = route.query.id as string | undefined
const isEdit = computed(() => Boolean(id))
const isConfirmingDelete = ref(false)

// new-shape modules without a dedicated get-by-id contract fetch the list and find locally
const { data, isLoading } = useGetMasterEmployee()
const { data: positions } = useGetMasterPosition()
const createMutation = useCreateMasterEmployee()
const updateMutation = useUpdateMasterEmployee()
const deactivateMutation = useDeactivateMasterEmployee()

const activePositions = computed(() => (positions.value ?? []).filter((p) => p.status === 'Active'))

const form = reactive({ fullName: '', email: '', phone: '', entityId: '', positionId: '' })

const record = computed(() => data.value?.find((e) => e.id === id))
watch(
  record,
  (r) => {
    if (!r) return
    form.fullName = r.full_name
    form.email = r.email
    form.phone = r.phone
    form.entityId = r.entity_id
    form.positionId = r.position_id
  },
  { immediate: true },
)

// AC-12: duplicate email against another employee is rejected client-side before save
const emailError = computed(() => {
  if (!form.email) return null
  if (!isValidEmailFormat(form.email)) return 'Enter a valid email address.'
  if (!isEmailUnique(data.value ?? [], form.email, id)) return 'This email is already used by another employee.'
  return null
})

const canSave = computed(
  () => Boolean(form.fullName && form.email && form.entityId && form.positionId) && !emailError.value,
)

async function save() {
  if (!canSave.value) return
  const payload = {
    full_name: form.fullName,
    email: form.email,
    phone: form.phone,
    entity_id: form.entityId,
    position_id: form.positionId,
  }

  if (isEdit.value && id) {
    await updateMutation.mutateAsync({ ...payload, id })
    toast.notify({ id: 'master-employee-update', variant: 'success', title: 'Employee updated.' })
  } else {
    await createMutation.mutateAsync(payload)
    toast.notify({ id: 'master-employee-create', variant: 'success', title: 'Employee created.' })
  }
  router.push('/master-employee')
}

async function confirmDeactivate() {
  if (!id) return
  await deactivateMutation.mutateAsync(id)
  isConfirmingDelete.value = false
  router.push('/master-employee')
}
</script>

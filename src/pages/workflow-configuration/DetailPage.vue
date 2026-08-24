<template>
  <MpFlex direction="column" backgroundColor="background.surface" minHeight="100vh">
    <MpFlex justifyContent="space-between" alignItems="center" paddingX="24px" paddingY="24px">
      <MpFlex direction="row" gap="3">
        <MpButton variant="ghost" left-icon="arrows-left" aria-label="Back" @click="router.back()" />
        <MpFlex direction="column" alignItems="flex-start">
          <MpButton variant="textLink" as="a" href="#/workflow-configuration">Workflow Configuration</MpButton>
          <MpText as="h1" size="h1">{{ isEdit ? 'Detail workflow_configuration' : 'Create workflow_configuration' }}</MpText>
        </MpFlex>
      </MpFlex>
      <MpButton v-if="isEdit" variant="ghost" left-icon="delete" @click="isConfirmingDelete = true">Delete</MpButton>
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
        <MpFormControl id="wf-submission-type" is-required>
          <MpFormLabel>Submission Type</MpFormLabel>
          <MpSelect v-model="form.workflow_name" placeholder="Select submission type" is-full-width>
            <option value="" disabled>Select submission type</option>
            <option v-for="opt in workflowNameOptions" :key="opt" :value="opt">{{ opt }}</option>
          </MpSelect>
        </MpFormControl>

        <MpFormControl id="wf-entity" is-required>
          <MpFormLabel>Entity</MpFormLabel>
          <MpSelect v-model="form.entity_id" placeholder="Select entity" is-full-width>
            <option value="" disabled>Select entity</option>
            <option v-for="e in activeEntities" :key="e.id" :value="e.id">{{ e.name }}</option>
          </MpSelect>
        </MpFormControl>

        <MpDivider />

        <MpFlex direction="column" gap="4">
          <MpText size="h3" weight="semiBold">Approval Lines</MpText>

          <MpFlex
            v-for="(line, i) in form.approval_lines"
            :key="i"
            direction="column"
            gap="3"
            padding="16px"
            borderWidth="1px"
            borderColor="border.default"
            rounded="md"
          >
            <MpFlex justifyContent="space-between" alignItems="center">
              <MpText size="label" weight="semiBold">Level {{ i + 1 }}</MpText>
              <MpButton
                v-if="form.approval_lines.length > 1"
                variant="ghost"
                left-icon="delete"
                aria-label="Remove level"
                @click="removeLevel(i)"
              />
            </MpFlex>

            <MpFormControl :id="`wf-approval-type-${i}`" is-required>
              <MpFormLabel>Approval Type</MpFormLabel>
              <MpSelect v-model="line.approval_type" is-full-width>
                <option v-for="opt in approvalTypeOptions" :key="opt" :value="opt">{{ opt }}</option>
              </MpSelect>
            </MpFormControl>

            <MpFormControl :id="`wf-employees-${i}`">
              <MpFormLabel>Approvers</MpFormLabel>
              <MpFlex direction="column" gap="2">
                <MpText v-if="!employees.length" size="label" color="text.secondary">No employees available.</MpText>
                <MpCheckbox
                  v-for="emp in employees"
                  :key="emp.id"
                  v-model="line.employee_ids"
                  :value="emp.id"
                  :id="`wf-employee-${i}-${emp.id}`"
                >
                  {{ emp.full_name }}
                </MpCheckbox>
              </MpFlex>
            </MpFormControl>
          </MpFlex>

          <MpButton
            size="sm"
            variant="ghost"
            left-icon="add"
            is-full-width
            :class="css({ borderWidth: '1px', borderStyle: 'dashed', borderColor: 'border.default', justifyContent: 'center' })"
            @click="addLevel"
          >
            Add More Data
          </MpButton>
        </MpFlex>

        <MpDivider />

        <MpFlex justifyContent="flex-end" gap="3">
          <MpButton variant="ghost" @click="router.push('/workflow-configuration')">Close</MpButton>
          <MpButton :is-disabled="!canSave" @click="save">{{ isEdit ? 'Update' : 'Create' }}</MpButton>
        </MpFlex>
      </MpFlex>
    </MpFlex>

    <ConfirmDeleteModal
      :is-open="isConfirmingDelete"
      title="Deactivate this workflow?"
      message="This will set the status to Inactive. It can still be viewed and re-activated."
      @close="isConfirmingDelete = false"
      @confirm="confirmDelete"
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
  MpSelect,
  MpFormControl,
  MpFormLabel,
  MpDivider,
  MpCheckbox,
  MpSkeleton,
  css,
  toast,
} from '@mekari/pixel3'
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal.vue'
import {
  useGetWorkflowConfiguration,
  useCreateWorkflowConfiguration,
  useUpdateWorkflowConfiguration,
  useDeactivateWorkflowConfiguration,
  hasActiveWorkflowConflict,
} from '@/services/workflow-configuration'
import { useMasterEntityStub } from './masterEntityStub'
import { useMasterEmployeeStub } from './masterEmployeeStub'

const workflowNameOptions: WorkflowName[] = ['GRI_QUANTITATIVE', 'GRI_QUALITATIVE', 'SDG_ACTION_PLAN', 'SDG_REALIZATION']
const approvalTypeOptions: ApprovalType[] = ['Holding Approval', 'By PIC']

const route = useRoute()
const router = useRouter()

const id = route.query.id as string | undefined
const isEdit = computed(() => Boolean(id))
const isConfirmingDelete = ref(false)

const { data: allWorkflows, isLoading } = useGetWorkflowConfiguration()
const { data: entities } = useMasterEntityStub()
const { data: employees } = useMasterEmployeeStub()

const activeEntities = computed(() => entities.value.filter((e) => e.status === 'Active'))

const form = reactive({
  workflow_name: '' as WorkflowName | '',
  entity_id: '',
  approval_lines: [{ approval_type: 'Holding Approval' as ApprovalType, employee_ids: [] as string[] }],
})

const canSave = computed(() => Boolean(form.workflow_name && form.entity_id && form.approval_lines.length))

function defaultApprovalType(): ApprovalType {
  // Business rule: Branch entities default their first level to 'By PIC' (parent Subsidiary acts as approver);
  // Subsidiaries without a Branch default to 'Holding Approval'.
  const entity = entities.value.find((e) => e.id === form.entity_id)
  return entity?.type === 'Branch' && form.approval_lines.length === 0 ? 'By PIC' : 'Holding Approval'
}

function addLevel() {
  form.approval_lines.push({ approval_type: defaultApprovalType(), employee_ids: [] })
}

function removeLevel(i: number) {
  form.approval_lines.splice(i, 1)
}

// re-apply the level-1 default when the entity changes and the form hasn't been touched beyond that default line
watch(
  () => form.entity_id,
  () => {
    if (form.approval_lines.length === 1 && !form.approval_lines[0].employee_ids.length) {
      form.approval_lines[0].approval_type = defaultApprovalType()
    }
  },
)

function populateForm(detail: WorkflowConfig) {
  form.workflow_name = detail.workflow_name
  form.entity_id = detail.entity_id
  form.approval_lines = detail.approval_lines.map((l) => ({ approval_type: l.approval_type, employee_ids: [...l.employee_ids] }))
}

watch(
  allWorkflows,
  (list) => {
    if (!id || !list) return
    const detail = list.find((w) => w.id === id)
    if (!detail) {
      router.replace('/workflow-configuration')
      return
    }
    populateForm(detail)
  },
  { immediate: true },
)

const createMutation = useCreateWorkflowConfiguration()
const updateMutation = useUpdateWorkflowConfiguration()
const deactivateMutation = useDeactivateWorkflowConfiguration()

async function save() {
  if (!canSave.value || !form.workflow_name) return

  // AC-31: only one Active workflow per (entity_id, workflow_name) — validate before create/update
  if (hasActiveWorkflowConflict(allWorkflows.value ?? [], { entity_id: form.entity_id, workflow_name: form.workflow_name }, id)) {
    toast.notify({
      id: 'wf-conflict',
      variant: 'error',
      title: 'This entity already has an Active workflow for this submission type.',
    })
    return
  }

  const payload = {
    workflow_name: form.workflow_name,
    entity_id: form.entity_id,
    approval_lines: form.approval_lines.map((l) => ({ approval_type: l.approval_type, employee_ids: l.employee_ids })),
  }

  if (isEdit.value && id) {
    await updateMutation.mutateAsync({ ...payload, id })
    toast.notify({ id: 'wf-update', variant: 'success', title: 'Workflow updated.' })
  } else {
    await createMutation.mutateAsync(payload)
    toast.notify({ id: 'wf-create', variant: 'success', title: 'Workflow created.' })
  }
  router.push('/workflow-configuration')
}

async function confirmDelete() {
  if (!id) return
  await deactivateMutation.mutateAsync({ id })
  isConfirmingDelete.value = false
  router.push('/workflow-configuration')
}
</script>
